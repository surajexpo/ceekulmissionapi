const mongoose = require('mongoose');
const Workshop = require('../../models/workshopModel');

/**
 * Remove a single session from a workshop by its subdocument _id.
 * The workshop must have at least 1 session remaining after deletion.
 *
 * DELETE /api/v1/workshops/:id/sessions/:sessionId
 * @access Teacher (verified) — owner only, draft status only
 */
const deleteSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: 'Invalid workshop ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ status: false, message: 'Invalid session ID' });
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
        message: `Sessions can only be removed from draft workshops. Current status: '${workshop.status}'.`
      });
    }

    const sessionExists = workshop.sessions.some(
      (s) => s._id.toString() === sessionId
    );

    if (!sessionExists) {
      return res.status(404).json({ status: false, message: 'Session not found in this workshop' });
    }

    if (workshop.sessions.length === 1) {
      return res.status(400).json({
        status: false,
        message: 'Cannot remove the last session. A workshop must have at least one session.'
      });
    }

    // Remove the session subdocument by its _id
    await Workshop.findByIdAndUpdate(id, {
      $pull: { sessions: { _id: new mongoose.Types.ObjectId(sessionId) } }
    });

    // Recalculate revenue (bypasses pre-save hook since we used findByIdAndUpdate)
    const remaining = workshop.sessions.filter((s) => s._id.toString() !== sessionId);
    const total = remaining.reduce((sum, s) => sum + (s.fee || 0), 0);
    await Workshop.findByIdAndUpdate(id, { $set: { totalRevenuePotential: total } });

    return res.status(200).json({
      status: true,
      message: 'Session removed successfully',
      data: {
        removedSessionId: sessionId,
        totalSessions: remaining.length,
        totalRevenuePotential: total
      }
    });

  } catch (error) {
    console.error('Delete Session Error:', error);
    return res.status(500).json({ status: false, message: 'Failed to remove session' });
  }
};

module.exports = deleteSession;
