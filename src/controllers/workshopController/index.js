const createWorkshop = require('./createWorkshop');
const getMyWorkshops = require('./getMyWorkshops');
const getWorkshop = require('./getWorkshop');
const updateWorkshop = require('./updateWorkshop');
const cancelWorkshop = require('./cancelWorkshop');
const addSession = require('./addSession');
const deleteSession = require('./deleteSession');

module.exports = {
  createWorkshop,
  getMyWorkshops,
  getWorkshop,
  updateWorkshop,
  cancelWorkshop,
  addSession,
  deleteSession
};
