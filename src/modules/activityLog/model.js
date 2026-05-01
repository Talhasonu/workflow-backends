const mongoose = require('mongoose');

const ACTIVITY_ACTIONS = {
    // Member / Invitation
    INVITE_MEMBER: 'invite_member',
    ACCEPT_INVITATION: 'accept_invitation',
    UPDATE_MEMBER: 'update_member',
    REMOVE_MEMBER: 'remove_member',

    // Workspace / Organisation
    CREATE_WORKSPACE: 'create_workspace',
    UPDATE_ORGANIZATION: 'update_organization',

    // Process
    CREATE_PROCESS: 'create_process',
    UPDATE_PROCESS: 'update_process',
    DELETE_PROCESS: 'delete_process',

    // Step
    CREATE_STEP: 'create_step',
    UPDATE_STEP: 'update_step',
    DELETE_STEP: 'delete_step',
};

const ACTIVITY_ENTITY_TYPES = ['workspace', 'process', 'step', 'user'];

const activityLogSchema = new mongoose.Schema(
    {
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        userName: { type: String, default: '' },
        userEmail: { type: String, default: '' },
        action: {
            type: String,
            required: true,
            enum: Object.values(ACTIVITY_ACTIONS),
            index: true,
        },
        entityType: {
            type: String,
            enum: ACTIVITY_ENTITY_TYPES,
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        message: {
            type: String,
            required: true,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = {
    ActivityLog,
    ACTIVITY_ACTIONS,
    ACTIVITY_ENTITY_TYPES,
};
