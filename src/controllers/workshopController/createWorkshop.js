const Workshop = require('../../models/workshopModel');
const { localToUTC, detectSessionConflicts } = require('../../utils/timezoneUtils');

/**
 * Create a new workshop
 * POST /api/v1/workshops
 * @access Teacher (verified)
 */
const createWorkshop = async (req, res) => {
  try {
    const createdBy = req.user._id;
    const {
      workshopTitle,
      workshopDescription,
      expertDescription,
      timezone,
      instructorType,
      sessions
    } = req.validatedBody;

    // Validate each session date is not in the past (timezone-aware)
    const now = new Date();
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const startUTC = localToUTC(s.date, s.startTime, timezone);
      if (startUTC <= now) {
        return res.status(400).json({
          status: false,
          message: `Session ${i + 1} start date/time must be in the future`
        });
      }
    }

    // Detect session time overlaps
    const { hasConflict, conflictDetails } = detectSessionConflicts(sessions, timezone);
    if (hasConflict) {
      return res.status(409).json({
        status: false,
        message: `Schedule conflict detected: ${conflictDetails}`
      });
    }

    // Map sessions: convert date string to Date object
    const mappedSessions = sessions.map((s) => ({
      ...s,
      date: new Date(s.date),
      location: s.location || null
    }));

    const workshop = new Workshop({
      workshopTitle,
      workshopDescription,
      expertDescription,
      timezone,
      instructorType,
      createdBy,
      sessions: mappedSessions,
      status: 'draft'
    });

    await workshop.save();

    // Automatically enroll the creator as the 'expert'
    const { Enrollment } = require('../../models/authModels');
    await Enrollment.create({
      workshopId: workshop._id,
      userId: createdBy,
      role: 'Expert',
      status: 'active'
    });

    return res.status(201).json({
      status: true,
      message: 'Workshop created successfully',
      data: workshop
    });
  } catch (error) {
    console.error('Create Workshop Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ status: false, message: messages.join(', ') });
    }

    return res.status(500).json({ status: false, message: 'Failed to create workshop' });
  }
};

module.exports = createWorkshop;
