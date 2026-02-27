const Workshop = require('../../models/workshopModel');
const { localToUTC, detectSessionConflicts } = require('../../utils/timezoneUtils');
const mongoose = require('mongoose');

/**
 * Update a workshop (only allowed in 'draft' status)
 * PUT /api/v1/workshops/:id
 * @access Teacher (verified) — owner only
 */
const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: 'Invalid workshop ID' });
    }

    const workshop = await Workshop.findById(id);

    if (!workshop) {
      return res.status(404).json({ status: false, message: 'Workshop not found' });
    }

    if (workshop.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: false, message: 'Access denied. You can only edit your own workshops.' });
    }

    if (workshop.status !== 'draft') {
      return res.status(403).json({
        status: false,
        message: `Workshop cannot be edited in '${workshop.status}' status. Only draft workshops can be edited.`
      });
    }

    const updates = req.validatedBody;

    // If sessions are being updated, run timezone-aware validations
    if (updates.sessions) {
      const timezone = updates.timezone || workshop.timezone;
      const now = new Date();

      for (let i = 0; i < updates.sessions.length; i++) {
        const s = updates.sessions[i];
        const startUTC = localToUTC(s.date, s.startTime, timezone);
        if (startUTC <= now) {
          return res.status(400).json({
            status: false,
            message: `Session ${i + 1} start date/time must be in the future`
          });
        }
      }

      const { hasConflict, conflictDetails } = detectSessionConflicts(updates.sessions, timezone);
      if (hasConflict) {
        return res.status(409).json({
          status: false,
          message: `Schedule conflict detected: ${conflictDetails}`
        });
      }

      updates.sessions = updates.sessions.map((s) => ({
        ...s,
        date: new Date(s.date),
        location: s.location || null
      }));
    }

    Object.assign(workshop, updates);
    await workshop.save();

    return res.status(200).json({
      status: true,
      message: 'Workshop updated successfully',
      data: workshop
    });
  } catch (error) {
    console.error('Update Workshop Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: messages.join(', ') });
    }

    return res.status(500).json({ status: false, message: 'Failed to update workshop' });
  }
};

module.exports = updateWorkshop;
