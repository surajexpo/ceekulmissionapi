const express = require('express');
const unspecifiedRoutesHandler = require('./unspecified.route');
const { finalErrorHandler } = require('../errorHandler');
const userRoute = require('./user.route.js');
const adminRoute = require('./admin.route.js');
const router = require('./auth.route.js');
const teacherRoute = require('./teacher.route.js');
const courseRoute = require('./course.route.js');
const workshopRoute = require('./workshop.route.js');
const partnerInfrastructureRoute = require('./partnerInfrastructure.routes.js');

const appRoutes = (app) => {
  app.get('/api/ping', (_, res) =>
    res.status(200).json({ status: true, message: 'Ping Successfully.', timestamp: new Date() })
  );
  app.use('/public', express.static('public'));

  // User routes
  app.use('/users', userRoute);

  // Admin routes
  app.use('/admin', adminRoute);

  // Teacher routes (course management)
  app.use('/api/teacher', teacherRoute);

  // Public course routes
  app.use('/api/courses', courseRoute);

  // Workshop routes
  app.use('/api/v1/workshops', workshopRoute);

  // Partner Infrastructure routes
  app.use('/api/partners/infrastructure', partnerInfrastructureRoute);

  // Auth routes (Google OAuth, etc.)
  app.use('/api', router);

  // Error handling
  app.use(unspecifiedRoutesHandler);
  app.use(finalErrorHandler);
};

module.exports = appRoutes;

