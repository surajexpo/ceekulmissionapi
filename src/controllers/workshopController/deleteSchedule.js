const mongoose = require('mongoose');
const Workshop = require('../../models/workshopModel');

/**
 * Remove a single schedule from a workshop by its subdocument _id.
 *
 * DELETE /api/v1/workshops/:id/schedules/:scheduleId
 * @access Teacher (verified) — owner or enrolled Instructor, draft/published status only
 */
const deleteSchedule = async (req, res) => {
  try {
    const { id, scheduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: 'Invalid workshop ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ status: false, message: 'Invalid schedule ID' });
    }

    const workshop = await Workshop.findById(id);

    if (!workshop) {
      return res.status(404).json({ status: false, message: 'Workshop not found' });
    }

    const { Enrollment } = require('../../models/authModels');
    const enrollment = await Enrollment.findOne({ workshopId: id, userId: req.user._id });
    const isOwner = workshop.createdBy.toString() === req.user._id.toString();

    if (!isOwner && (!enrollment || enrollment.role !== 'Instructor')) {
      return res.status(403).json({
        status: false,
        message: 'Access denied. You must be the owner or an enrolled Instructor to remove schedules.'
      });
    }

    if (!['draft', 'published'].includes(workshop.status)) {
      return res.status(403).json({
        status: false,
        message: `Schedules can only be removed from draft or published workshops. Current status: '${workshop.status}'.`
      });
    }

    const targetSchedule = workshop.schedules.find(
      (s) => s._id.toString() === scheduleId
    );

    if (!targetSchedule) {
      return res.status(404).json({ status: false, message: 'Schedule not found in this workshop' });
    }

    // Permission check: Owner can delete anything. Instructor can only delete THEIR schedules.
    if (!isOwner && (!targetSchedule.instructorId || targetSchedule.instructorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        status: false,
        message: 'Access denied. You can only remove your own schedules.'
      });
    }

    // Remove the schedule subdocument by its _id
    await Workshop.findByIdAndUpdate(id, {
      $pull: { schedules: { _id: new mongoose.Types.ObjectId(scheduleId) } }
    });

    // Recalculate revenue (bypasses pre-save hook since we used findByIdAndUpdate)
    const remaining = workshop.schedules.filter((s) => s._id.toString() !== scheduleId);
    const total = remaining.reduce((sum, s) => sum + (s.fee || 0), 0);
    await Workshop.findByIdAndUpdate(id, { $set: { totalRevenuePotential: total } });

    return res.status(200).json({
      status: true,
      message: 'Schedule removed successfully',
      data: {
        removedScheduleId: scheduleId,
        totalSchedules: remaining.length,
        totalRevenuePotential: total
      }
    });

  } catch (error) {
    console.error('Delete Schedule Error:', error);
    return res.status(500).json({ status: false, message: 'Failed to remove schedule' });
  }
};

module.exports = deleteSchedule;
