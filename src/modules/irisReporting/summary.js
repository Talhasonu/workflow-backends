const buildIrisReportingSummary = (records = []) => {
  const total = records.length;
  const completed = records.filter((record) => record.status === 'completed').length;
  const inProgress = records.filter((record) => record.status === 'in_progress').length;
  const blocked = records.filter((record) => record.status === 'blocked').length;

  const evidenceCount = records.reduce((sum, record) => sum + (Array.isArray(record.evidenceItems) ? record.evidenceItems.length : 0), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = records.filter((record) => {
    if (!record.dueDate) return false;
    const dueDate = new Date(record.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const nextDue = records
    .filter((record) => record.dueDate)
    .map((record) => ({ ...record, dueDateValue: new Date(record.dueDate) }))
    .filter((record) => record.dueDateValue >= today)
    .sort((a, b) => a.dueDateValue - b.dueDateValue)[0]?.dueDate || null;

  const complianceScore = total === 0 ? 0 : Math.round(((completed + inProgress * 0.67 + blocked * 0.33) / total) * 100);

  return {
    total,
    completed,
    inProgress,
    blocked,
    evidenceCount,
    overdueCount,
    complianceScore,
    nextDue,
  };
};

module.exports = {
  buildIrisReportingSummary,
};
