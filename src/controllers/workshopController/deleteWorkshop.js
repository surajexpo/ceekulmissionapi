const mongoose = require('mongoose');
const Workshop = require('../../models/workshopModel');

/**
 * Delete a workshop (hard delete)
 * DELETE /api/v1/workshops/:id
 * @access Teacher (verified) — owner only
 */
const deleteWorkshop = async (req, res) => {
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
            return res.status(403).json({ status: false, message: 'Access denied. You can only delete your own workshops.' });
        }

        // Optional: Only allow deleting draft or cancelled workshops
        if (workshop.status === 'published') {
            return res.status(400).json({ status: false, message: 'Cannot delete a published workshop. Please cancel it first.' });
        }

        await Workshop.findByIdAndDelete(id);

        return res.status(200).json({
            status: true,
            message: 'Workshop deleted successfully'
        });
    } catch (error) {
        console.error('Delete Workshop Error:', error);
        return res.status(500).json({ status: false, message: 'Failed to delete workshop' });
    }
};

module.exports = deleteWorkshop;
