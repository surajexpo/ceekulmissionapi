const PARTNER_TYPES = Object.freeze([
  "Service Provider",
  "Infrastructure Provider",
  "School",
  "College",
  "University",
  "Research Institution",
  "EdTech Platform",
  "Corporate Training Center",
  "Micro, Small & Medium Enterprise (MSME)",
  "Company",
  "Industry Association",
  "Non Government Organization (NGO)",
  "Political Party",
  "Website Owner",
  "Inverstor",
  "Beneficiary",
  "Any Other",
]);

const ACTIVITY_TYPES = Object.freeze([
  "Learning",
  "Teaching",
  "Research",
  "Entrepreneurship",
  "Webinar",
  "Workshop",
  "Seminar",
  "Conference",
  "Healthcare Services",
  "Socio-Economic Transformation",
  "Election",
  "Any Other",
]);

const MODE_OPTIONS = Object.freeze([
  "Online",
  "Classroom",
  "Hybrid",
  "Home Tuition",
]);

const EXPERT_TYPES = Object.freeze([
  "Teacher",
  "Researcher",
  "Entrepreneur",
  "Expert",
  "Instructor",
  "Any Other",
]);

const GENDERS = Object.freeze(["Male", "Female", "Other", "PreferNotToSay"]);

const AUTH_PROVIDERS = Object.freeze(["MOBILE_OTP", "EMAIL_PASSWORD", "BOTH"]);

const USER_STATUSES = Object.freeze(["Active", "Inactive", "Suspended"]);

const VERIFICATION_STATUSES = Object.freeze([
  "Pending",
  "Verified",
  "Rejected",
]);

module.exports = {
  PARTNER_TYPES,
  ACTIVITY_TYPES,
  MODE_OPTIONS,
  EXPERT_TYPES,
  GENDERS,
  AUTH_PROVIDERS,
  USER_STATUSES,
  VERIFICATION_STATUSES,
};
