const { Process, AUDIT_ACTIONS } = require('./model');

const buildAuditChanges = (beforeObj, afterObj, fields) => {
    return fields
        .filter((field) => JSON.stringify(beforeObj[field]) !== JSON.stringify(afterObj[field]))
        .map((field) => ({
            field,
            oldValue: beforeObj[field],
            newValue: afterObj[field],
        }));
};

const addProcessAudit = async ({ processId, action, actor, entityType, entityId, message, changes = [] }) => {
    await Process.findByIdAndUpdate(processId, {
        $push: {
            auditTrail: {
                action,
                actorId: actor._id,
                actorName: actor.name || '',
                actorEmail: actor.email || '',
                entityType,
                entityId,
                message,
                changes,
            },
        },
    });
};

module.exports = {
    AUDIT_ACTIONS,
    buildAuditChanges,
    addProcessAudit,
};
