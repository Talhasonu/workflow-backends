const mongoose = require('mongoose');

const AUDIT_ACTIONS = {
    CREATE_PROCESS: 'create_process',
    UPDATE_PROCESS: 'update_process',
    DELETE_PROCESS: 'delete_process',
    CREATE_STEP: 'create_step',
    UPDATE_STEP: 'update_step',
    DELETE_STEP: 'delete_step',
};

const PROCESS_STATUS = ['draft', 'completed', 'inprogress'];

const processAuditSchema = new mongoose.Schema(
    {
        action: { type: String, required: true, enum: Object.values(AUDIT_ACTIONS) },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        actorName: { type: String, default: '' },
        actorEmail: { type: String, default: '' },
        entityType: { type: String, enum: ['process', 'step'], required: true },
        entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
        message: { type: String, required: true },
        changes: {
            type: [
                {
                    field: { type: String, required: true },
                    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
                    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
                },
            ],
            default: [],
        },
    },
    { _id: false, timestamps: true }
);

const processSchema = new mongoose.Schema(
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
        visibility: { type: String, enum: ['private', 'public'], default: 'private' },
        assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
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
        status: { type: String, enum: PROCESS_STATUS, default: 'draft' },
        auditTrail: { type: [processAuditSchema], default: [] },
    },
    {
        timestamps: true,
    }
);

const Process = mongoose.model('Process', processSchema);

module.exports = {
    Process,
    PROCESS_STATUS,
    AUDIT_ACTIONS,
};
