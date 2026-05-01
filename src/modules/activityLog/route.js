const express = require('express');
const auth = require('../../middlewares/auth');
const { isSuperAdmin } = require('../../middlewares/auth');
const activityLogController = require('./controller');
const API_ROUTES = require('../../config/apiRoutes');

const router = express.Router();

router
    .get(API_ROUTES.ACTIVITY_LOG.LIST, auth(), isSuperAdmin(), activityLogController.getActivityLogs)
    .get(API_ROUTES.ACTIVITY_LOG.GET_BY_ENTITY, auth(), isSuperAdmin(), activityLogController.getActivityLogsByEntityId)
    .get(API_ROUTES.ACTIVITY_LOG.GET_BY_ID, auth(), isSuperAdmin(), activityLogController.getActivityLogById);

module.exports = router;
