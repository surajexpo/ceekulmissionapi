const { Admin } = require("../../../models/authModels");
const { ApiError } = require("../../../errorHandler");

/**
 * @desc    Register a new admin
 * @route   POST /api/admin/register
 * @access  Public (or Superadmin depending on policy)
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, number, role } = req.validatedBody;

        // Check if admin with email or number already exists
        const existingAdmin = await Admin.findOne({ 
            $or: [{ email }, { number }] 
        });

        if (existingAdmin) {
            const field = existingAdmin.email === email ? 'Email' : 'Phone number';
            throw new ApiError(`${field} is already registered`, 409);
        }

        // Create new admin
        const newAdmin = new Admin({
            name,
            email,
            password,
            number,
            role
        });

        await newAdmin.save();

        return res.status(201).json({
            status: true,
            message: "Admin registered successfully",
            data: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = register;