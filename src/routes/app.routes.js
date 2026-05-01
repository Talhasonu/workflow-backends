const express = require('express');
const API_ROUTES = require('../config/apiRoutes');
const users = require('../modules/users/route');
const workspace = require('../modules/workspace/route');
const process = require('../modules/process/route');
const step = require('../modules/step/route');
const activityLog = require('../modules/activityLog/route');
const template = require('../modules/template/route');

module.exports = (app) => {
    const apiV1Router = express.Router();

    apiV1Router.use('/users', users);
    apiV1Router.use('/workspace', workspace);
    apiV1Router.use('/process', process);
    apiV1Router.use('/step', step);
    apiV1Router.use('/activity-log', activityLog);
    apiV1Router.use('/template', template);

    app.use('/api/v1', apiV1Router);
};
