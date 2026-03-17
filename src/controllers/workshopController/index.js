const createWorkshop = require('./createWorkshop');
const getAllWorkshops = require('./getAllWorkshops');
const getMyWorkshops = require('./getMyWorkshops');
const getWorkshop = require('./getWorkshop');
const updateWorkshop = require('./updateWorkshop');
const cancelWorkshop = require('./cancelWorkshop');
const addSession = require('./addSession');
const deleteSession = require('./deleteSession');
const deleteWorkshop = require('./deleteWorkshop');
const enrollWorkshop = require('./enrollWorkshop');
const getMyEnrolledWorkshops = require('./getMyEnrolledWorkshops');
const getWorkshopEnrollees = require('./getWorkshopEnrollees');

module.exports = {
  getAllWorkshops,
  createWorkshop,
  getMyWorkshops,
  getWorkshop,
  updateWorkshop,
  cancelWorkshop,
  addSession,
  deleteSession,
  deleteWorkshop,
  enrollWorkshop,
  getMyEnrolledWorkshops,
  getWorkshopEnrollees
};
