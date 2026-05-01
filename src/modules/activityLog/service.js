const httpStatus = require('http-status');
const ApiError = require('../../utils/ApiError');
const { ActivityLog } = require('./model');

/**
 * Create an activity log entry.
 * This is fire-and-forget safe — errors are swallowed to never break the main flow.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.workspaceId
 * @param {Object}          params.actor         - { _id, name, email }
 * @param {string}          params.action        - one of ACTIVITY_ACTIONS values
 * @param {string}          params.entityType    - 'workspace' | 'process' | 'step' | 'user'
 * @param {string|ObjectId} [params.entityId]
 * @param {string}          params.message
 * @param {*}               [params.data]        - any extra context (changes, payload, etc.)
 */
const logActivity = async ({ workspaceId, actor, action, entityType, entityId = null, message, data = null }) => {
    try {
        await ActivityLog.create({
            workspaceId,
            userId: actor._id,
            userName: actor.name || '',
            userEmail: actor.email || '',
            action,
            entityType,
            entityId: entityId || null,
            message,
            data,
        });
    } catch (err) {
        // Log errors should never crash the main request
        console.error('[ActivityLog] Failed to write activity log:', err.message);
    }
};

/**
 * Paginated list of activity logs for a workspace.
 */
const getWorkspaceActivityLogs = async ({ workspaceId, page = 1, limit = 20, action, userId }) => {
    const filter = { workspaceId };
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        ActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email profilePicture')
            .lean(),
        ActivityLog.countDocuments(filter),
    ]);

    return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get all activity logs for a specific entity (process, step, workspace, user).
 */
const getActivityLogsByEntityId = async ({ entityId, workspaceId }) => {
    const logs = await ActivityLog.find({ workspaceId, entityId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email profilePicture')
        .lean();

    return { logs, total: logs.length };
};

/**
 * Get a single activity log entry by id (must belong to the workspace).
 */
const getActivityLogById = async ({ logId, workspaceId }) => {
    const log = await ActivityLog.findOne({ _id: logId, workspaceId })
        .populate('userId', 'name email profilePicture')
        .lean();

    if (!log) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Activity log not found');
    }

    return log;
};

module.exports = {
    logActivity,
    getWorkspaceActivityLogs,
    getActivityLogById,
    getActivityLogsByEntityId,
};
