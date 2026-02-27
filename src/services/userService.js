const { User } = require('../models/authModels');

class UserService {
  static async createUser(validatedData) {
    // Determine auth provider
    let authProvider = validatedData.authProvider;
    if (!authProvider) {
      if (validatedData.email && validatedData.phone) authProvider = 'BOTH';
      else if (validatedData.email) authProvider = 'EMAIL_PASSWORD';
      else authProvider = 'MOBILE_OTP';
    }

    // Check for existing users
    if (validatedData.email) {
      const existing = await User.findOne({ email: validatedData.email.toLowerCase() });
      if (existing) {
        const err = new Error('Email already registered');
        err.status = 409;
        throw err;
      }
    }
    if (validatedData.phone) {
      const existing = await User.findOne({ phone: validatedData.phone });
      if (existing) {
        const err = new Error('Phone number already registered');
        err.status = 409;
        throw err;
      }
    }

    // Build user document
    const userData = {
      email: validatedData.email?.toLowerCase(),
      phone: validatedData.phone,
      authProvider,
      name: validatedData.name?.trim(),
      gender: validatedData.gender,
      dateOfBirth: validatedData.dateOfBirth,
      address: validatedData.address,
      selectedRole: validatedData.selectedRole,
      partnerType: validatedData.selectedRole === 'Partner' ? validatedData.partnerType : undefined,
      activityType: validatedData.activityType || [],
      modeOptions: validatedData.modeOptions || [],
      expertTypes: validatedData.expertTypes || [],
    };

    if (validatedData.password && authProvider !== 'MOBILE_OTP') {
      userData.password = validatedData.password;
    }

    // Auto-verify teachers who registered via MOBILE_OTP.
    // The phone was already verified by OTP before signup was called,
    // so no admin approval is required.
    if (userData.selectedRole === 'Teacher' && authProvider === 'MOBILE_OTP') {
      const now = new Date();
      userData.phoneVerified = true;
      userData.verificationStatus = 'Verified';
      userData.verifiedBy = { verifierRole: 'System', verifiedAt: now };
      userData.teacherProfile = { teacherVerifiedAt: now };
    }

    const user = new User(userData);
    await user.save();
    return user;
  }

  static sanitizeUserResponse(user) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
  }
}

module.exports = UserService;
