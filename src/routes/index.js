const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('../modules/users/route');
const workspaceRoute = require('./workpace.route');
const config = require('../config/config');
const API_ROUTES = require('../config/apiRoutes');

const router = express.Router();

const defaultRoutes = [
  {
    path: API_ROUTES.AUTH.BASE,
    route: authRoute,
  },
  {
    path: API_ROUTES.USER.BASE,
    route: userRoute,
  },
  {
    path: API_ROUTES.WORKSPACE.BASE,
    route: workspaceRoute,
  },


];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// /* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
