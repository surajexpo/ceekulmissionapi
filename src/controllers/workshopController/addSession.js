const mongoose = require('mongoose');
const Workshop = require('../../models/workshopModel');
const { localToUTC, detectSessionConflicts } = require('../../utils/timezoneUtils');

/**
 * Add one or more sessions to an existing workshop in a single request.
 *
 * POST /api/v1/workshops/:id/sessions
 * Body: { "sessions": [ {...}, {...} ] }
 *
 * Validations (applied to the whole batch):
 *  1. Each session must start in the future (timezone-aware).
 *  2. No overlap within the incoming batch itself.
 *  3. No overlap between the incoming batch and the existing sessions.
 *
 * @access Teacher (verified) — owner only, draft status only
 */
const addSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: false, message: 'Invalid workshop ID' });
    }

    const workshop = await Workshop.findById(id);

    if (!workshop) {
      return res.status(404).json({ status: false, message: 'Workshop not found' });
    }

    const { Enrollment } = require('../../models/authModels');
    const enrollment = await Enrollment.findOne({ workshopId: id, userId: req.user._id });

    if (!enrollment || !['Expert', 'Instructor'].includes(enrollment.role)) {
      return res.status(403).json({
        status: false,
        message: 'Access denied. You must be enrolled as an Instructor or Expert to add sessions.'
      });
    }

    if (workshop.status !== 'draft') {
      return res.status(403).json({
        status: false,
        message: `Sessions can only be added to draft workshops. Current status: '${workshop.status}'.`
      });
    }

    const { sessions: newSessions } = req.validatedBody; // always an array (min 1)
    const now = new Date();

    // 1. Each incoming session must start in the future
    for (let i = 0; i < newSessions.length; i++) {
      const s = newSessions[i];
      const startUTC = localToUTC(s.date, s.startTime, workshop.timezone);
      if (startUTC <= now) {
        return res.status(400).json({
          status: false,
          message: `sessions[${i}]: start date/time must be in the future`
        });
      }
    }

    // 2 + 3. Overlap check across existing + all incoming sessions combined
    const existingForCheck = workshop.sessions.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      startTime: s.startTime,
      endTime: s.endTime
    }));

    const incomingForCheck = newSessions.map((s) => ({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime
    }));

    const { hasConflict, conflictDetails } = detectSessionConflicts(
      [...existingForCheck, ...incomingForCheck],
      workshop.timezone
    );

    if (hasConflict) {
      return res.status(409).json({
        status: false,
        message: `Schedule conflict: ${conflictDetails}`
      });
    }

    // Map incoming sessions to the shape expected by the subdocument schema
    const sessionDocs = newSessions.map((s) => ({
      ...s,
      date: new Date(s.date),
      location: s.location || null
    }));

    // Push all new sessions atomically
    const updated = await Workshop.findByIdAndUpdate(
      id,
      { $push: { sessions: { $each: sessionDocs } } },
      { new: true, runValidators: true }
    ).select('-__v');

    // Recalculate revenue (findByIdAndUpdate bypasses pre-save hook)
    const total = updated.sessions.reduce((sum, s) => sum + (s.fee || 0), 0);
    await Workshop.findByIdAndUpdate(id, { $set: { totalRevenuePotential: total } });
    updated.totalRevenuePotential = total;

    // Return only the newly added sessions (last N)
    const addedSessions = updated.sessions.slice(-newSessions.length);

    return res.status(201).json({
      status: true,
      message: `${newSessions.length} session(s) added successfully`,
      data: {
        addedSessions,
        totalSessions: updated.sessions.length,
        totalRevenuePotential: total
      }
    });

  } catch (error) {
    console.error('Add Session Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: messages.join(', ') });
    }

    return res.status(500).json({ status: false, message: 'Failed to add session(s)' });
  }
};

module.exports = addSession;
