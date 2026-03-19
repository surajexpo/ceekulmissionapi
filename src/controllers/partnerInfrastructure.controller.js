const PartnerInfrastructureService = require('../services/partnerInfrastructure.service');
const { ApiError } = require('../errorHandler');

/**
 * Controller for Partner Infrastructure management
 */
class PartnerInfrastructureController {
  /**
   * Create a new infrastructure record
   */
  async createInfrastructure(req, res, next) {
    try {
      const partnerId = req.user._id;
      const data = req.validatedBody ?? req.body;
      const infrastructure = await PartnerInfrastructureService.createInfrastructure(partnerId, data);
      res.status(201).json({ status: true, message: 'Infrastructure created successfully', data: infrastructure });
    } catch (err) { next(err); }
  }

  /**
   * List all infrastructures for the partner
   */
  async listInfrastructures(req, res, next) {
    try {
      const partnerId = req.user._id;
      const infrastructures = await PartnerInfrastructureService.listInfrastructures(partnerId);
      res.status(200).json({ status: true, message: 'Infrastructures retrieved successfully', data: infrastructures });
    } catch (err) { next(err); }
  }

  /**
   * Get specific infrastructure
   */
  async getInfrastructure(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId } = req.params;
      const infrastructure = await PartnerInfrastructureService.getInfrastructure(partnerId, infraId);
      res.status(200).json({ status: true, message: 'Infrastructure retrieved successfully', data: infrastructure });
    } catch (err) { next(err); }
  }

  /**
   * Update top-level infrastructure details
   */
  async updateInfrastructure(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId } = req.params;
      const data = req.validatedBody ?? req.body;
      const infrastructure = await PartnerInfrastructureService.updateInfrastructure(partnerId, infraId, data);
      res.status(200).json({ status: true, message: 'Infrastructure updated successfully', data: infrastructure });
    } catch (err) { next(err); }
  }

  /**
   * Add a classroom
   */
  async addClassroom(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId } = req.params;
      const data = req.validatedBody ?? req.body;
      const classroom = await PartnerInfrastructureService.addResource(partnerId, infraId, 'classrooms', data);
      res.status(201).json({ status: true, message: 'Classroom added successfully', data: classroom });
    } catch (err) { next(err); }
  }

  /**
   * Update a classroom
   */
  async updateClassroom(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId, id } = req.params;
      const data = req.validatedBody ?? req.body;
      const classroom = await PartnerInfrastructureService.updateResource(partnerId, infraId, 'classrooms', id, data);
      res.status(200).json({ status: true, message: 'Classroom updated successfully', data: classroom });
    } catch (err) { next(err); }
  }

  /**
   * Delete a classroom
   */
  async deleteClassroom(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId, id } = req.params;
      await PartnerInfrastructureService.deleteResource(partnerId, infraId, 'classrooms', id);
      res.status(200).json({ status: true, message: 'Classroom deleted successfully' });
    } catch (err) { next(err); }
  }

  /**
   * Add a computer lab
   */
  async addComputerLab(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId } = req.params;
      const data = req.validatedBody ?? req.body;
      const lab = await PartnerInfrastructureService.addResource(partnerId, infraId, 'computerLabs', data);
      res.status(201).json({ status: true, message: 'Computer lab added successfully', data: lab });
    } catch (err) { next(err); }
  }

  /**
   * Update a computer lab
   */
  async updateComputerLab(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId, id } = req.params;
      const data = req.validatedBody ?? req.body;
      const lab = await PartnerInfrastructureService.updateResource(partnerId, infraId, 'computerLabs', id, data);
      res.status(200).json({ status: true, message: 'Computer lab updated successfully', data: lab });
    } catch (err) { next(err); }
  }

  /**
   * Delete a computer lab
   */
  async deleteComputerLab(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId, id } = req.params;
      await PartnerInfrastructureService.deleteResource(partnerId, infraId, 'computerLabs', id);
      res.status(200).json({ status: true, message: 'Computer lab deleted successfully' });
    } catch (err) { next(err); }
  }

  /**
   * Add a facility
   */
  async addFacility(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId } = req.params;
      const data = req.validatedBody ?? req.body;
      const facility = await PartnerInfrastructureService.addResource(partnerId, infraId, 'otherFacilities', data);
      res.status(201).json({ status: true, message: 'Facility added successfully', data: facility });
    } catch (err) { next(err); }
  }

  /**
   * Update a facility
   */
  async updateFacility(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId, id } = req.params;
      const data = req.validatedBody ?? req.body;
      const facility = await PartnerInfrastructureService.updateResource(partnerId, infraId, 'otherFacilities', id, data);
      res.status(200).json({ status: true, message: 'Facility updated successfully', data: facility });
    } catch (err) { next(err); }
  }

  /**
   * Delete a facility
   */
  async deleteFacility(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId, id } = req.params;
      await PartnerInfrastructureService.deleteResource(partnerId, infraId, 'otherFacilities', id);
      res.status(200).json({ status: true, message: 'Facility deleted successfully' });
    } catch (err) { next(err); }
  }

  /**
   * Delete specific infrastructure record
   */
  async deleteInfrastructure(req, res, next) {
    try {
      const partnerId = req.user._id;
      const { infraId } = req.params;
      await PartnerInfrastructureService.deleteInfrastructure(partnerId, infraId);
      res.status(200).json({ status: true, message: 'Infrastructure deleted successfully' });
    } catch (err) { next(err); }
  }
}

module.exports = new PartnerInfrastructureController();
