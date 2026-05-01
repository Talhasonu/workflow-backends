const express = require('express');
const auth = require('../../middlewares/auth');
const { isSuperAdmin } = require('../../middlewares/auth');
const workspaceController = require('./controller');
const API_ROUTES = require('../../config/apiRoutes');

const router = express.Router();

router
    .post(API_ROUTES.WORKSPACE.CREATE_WORKSPACE, auth(), isSuperAdmin(), workspaceController.createWorkspace)
    .patch(API_ROUTES.WORKSPACE.UPDATE_WORKSPACE, auth(), isSuperAdmin(), workspaceController.updateWorkspace)
    .get(API_ROUTES.WORKSPACE.GET_USER_WORKSPACE, auth(), workspaceController.getUserWorkspace)
    .get(API_ROUTES.WORKSPACE.OVERVIEW, auth(), isSuperAdmin(), workspaceController.workspaceOverview)

module.exports = router;
