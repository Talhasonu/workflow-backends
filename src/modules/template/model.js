const mongoose = require('mongoose');

const TEMPLATE_STATUS = ['draft', 'inprogress', 'completed'];

const embeddedStepSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        timeEstimate: { type: String, default: '', trim: true },
        notes: { type: String, default: '', trim: true },
        status: { type: String, enum: TEMPLATE_STATUS, default: 'draft' },
        coordinates: {
            x: { type: Number, default: null },
            y: { type: Number, default: null },
        },
        sequence: { type: Number, required: true },
    },
    { _id: false }
);

const templateSchema = new mongoose.Schema(
    {
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        category: { type: String, default: '', trim: true },
        settings: {
            notifications: {
                email: { type: Boolean, default: false },
                slack: { type: Boolean, default: false },
                inApp: { type: Boolean, default: false },
            },
            automation: {
                autoAssignTasks: { type: Boolean, default: false },
                dueDateReminders: { type: Boolean, default: false },
                escalateOverdueTasks: { type: Boolean, default: false },
            },
        },
        status: { type: String, enum: TEMPLATE_STATUS, default: 'draft' },
        steps: { type: [embeddedStepSchema], default: [] },
    },
    { timestamps: true }
);

const Template = mongoose.model('Template', templateSchema);

module.exports = { Template, TEMPLATE_STATUS };
