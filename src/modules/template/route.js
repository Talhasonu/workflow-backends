const express = require('express');
const auth = require('../../middlewares/auth');
const { isSuperAdmin } = require('../../middlewares/auth');
const templateController = require('./controller');

const router = express.Router();

router
    .post('/create', auth(), isSuperAdmin(), templateController.createTemplate)
    .patch('/update/:templateId', auth(), isSuperAdmin(), templateController.updateTemplate)
    .delete('/delete/:templateId', auth(), isSuperAdmin(), templateController.deleteTemplate)
    .get('/list', auth(), templateController.listTemplates)
    .get('/:templateId', auth(), templateController.getTemplateById);

module.exports = router;
