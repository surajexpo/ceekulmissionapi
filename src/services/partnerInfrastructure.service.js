const PartnerInfrastructure = require('../models/partnerInfrastructure.model');
const { ApiError } = require('../errorHandler');

/**
 * Service to manage partner infrastructure
 */
class PartnerInfrastructureService {
  /**
   * Save (create or update) partner infrastructure
   * @param {string} partnerId - ID of the partner
   * @param {Object} data - Infrastructure data
   * @returns {Promise<Object>} Saved infrastructure
   */
  /**
   * Create a new infrastructure record
   * @param {string} partnerId 
   * @param {Object} data 
   */
  async createInfrastructure(partnerId, data) {
    const infrastructure = await PartnerInfrastructure.create({
      ...data,
      partnerId
    });
    return infrastructure;
  }

  /**
   * List all infrastructures for a partner
   * @param {string} partnerId 
   */
  async listInfrastructures(partnerId) {
    return await PartnerInfrastructure.find({ partnerId });
  }

  /**
   * Get specific infrastructure
   * @param {string} partnerId 
   * @param {string} infraId 
   */
  async getInfrastructure(partnerId, infraId) {
    const infrastructure = await PartnerInfrastructure.findOne({ _id: infraId, partnerId });
    if (!infrastructure) {
      throw new ApiError('Infrastructure not found', 404);
    }
    return infrastructure;
  }

  /**
   * Update top-level infrastructure fields
   * @param {string} partnerId 
   * @param {string} infraId 
   * @param {Object} data 
   */
  async updateInfrastructure(partnerId, infraId, data) {
    const updateData = {};
    
    // Flatten generalInfo to support partial updates instead of replacing the entire object
    if (data.generalInfo) {
      for (const [key, value] of Object.entries(data.generalInfo)) {
        updateData[`generalInfo.${key}`] = value;
      }
      delete data.generalInfo;
    }

    // Merge other fields
    Object.assign(updateData, data);

    const infrastructure = await PartnerInfrastructure.findOneAndUpdate(
      { _id: infraId, partnerId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!infrastructure) {
      throw new ApiError('Infrastructure not found', 404);
    }
    return infrastructure;
  }

  /**
   * Delete a specific infrastructure document
   * @param {string} partnerId 
   * @param {string} infraId 
   */
  async deleteInfrastructure(partnerId, infraId) {
    const result = await PartnerInfrastructure.deleteOne({ _id: infraId, partnerId });
    if (result.deletedCount === 0) {
      throw new ApiError('Infrastructure not found', 404);
    }
    return true;
  }

  /**
   * Add a resource to a specific category in a specific infrastructure
   * @param {string} partnerId 
   * @param {string} infraId 
   * @param {string} category 
   * @param {Object} data 
   */
  async addResource(partnerId, infraId, category, data) {
    if (!data.id) {
      const { v4: uuidv4 } = require('uuid');
      data.id = uuidv4();
    }

    // Check for duplicate name in the same category within THIS infrastructure
    const infra = await this.getInfrastructure(partnerId, infraId);
    const isDuplicate = infra[category].some(item =>
      item.name.toLowerCase() === data.name.toLowerCase()
    );

    if (isDuplicate) {
      throw new ApiError(`${data.name} already exists in ${category}`, 400);
    }

    const updated = await PartnerInfrastructure.findOneAndUpdate(
      { _id: infraId, partnerId },
      { $push: { [category]: data } },
      { new: true, runValidators: true }
    );

    return updated[category].find(item => item.id === data.id);
  }

  /**
   * Update a specific resource within an infrastructure
   */
  async updateResource(partnerId, infraId, category, resourceId, data) {
    const updateFields = {};
    for (const [key, value] of Object.entries(data)) {
      updateFields[`${category}.$[elem].${key}`] = value;
    }

    // The frontend might be sending the MongoDB _id or the UUID id
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(resourceId);

    const resourceMatch = isObjectId 
      ? { $or: [{ [`${category}.id`]: resourceId }, { [`${category}._id`]: new mongoose.Types.ObjectId(resourceId) }] }
      : { [`${category}.id`]: resourceId };

    const arrayFilters = isObjectId
      ? [{ $or: [{ 'elem.id': resourceId }, { 'elem._id': new mongoose.Types.ObjectId(resourceId) }] }]
      : [{ 'elem.id': resourceId }];

    const updated = await PartnerInfrastructure.findOneAndUpdate(
      {
        _id: infraId,
        partnerId,
        ...resourceMatch
      },
      { $set: updateFields },
      { new: true, runValidators: true, arrayFilters }
    );

    if (!updated) {
      throw new ApiError(`Resource ${resourceId} not found in ${category} for this infrastructure`, 404);
    }

    return updated[category].find(item => item.id === resourceId || item._id.toString() === resourceId);
  }

  /**
   * Delete a resource from an infrastructure
   */
  async deleteResource(partnerId, infraId, category, resourceId) {
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(resourceId);
    const pullCondition = isObjectId
      ? { $or: [{ id: resourceId }, { _id: new mongoose.Types.ObjectId(resourceId) }] }
      : { id: resourceId };

    const updated = await PartnerInfrastructure.findOneAndUpdate(
      { _id: infraId, partnerId },
      { $pull: { [category]: pullCondition } },
      { new: true }
    );

    if (!updated) {
      throw new ApiError('Infrastructure not found', 404);
    }

    return true;
  }
}

module.exports = new PartnerInfrastructureService();
