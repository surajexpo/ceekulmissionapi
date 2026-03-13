const createWorkshop = require('./createWorkshop');
const getAllWorkshops = require('./getAllWorkshops');
const getMyWorkshops = require('./getMyWorkshops');
const getWorkshop = require('./getWorkshop');
const updateWorkshop = require('./updateWorkshop');
const cancelWorkshop = require('./cancelWorkshop');
const addSession = require('./addSession');
const deleteSession = require('./deleteSession');
const deleteWorkshop = require('./deleteWorkshop');

module.exports = {
  getAllWorkshops,
  createWorkshop,
  getMyWorkshops,
  getWorkshop,
  updateWorkshop,
  cancelWorkshop,
  addSession,
  deleteSession,
  deleteWorkshop
};
