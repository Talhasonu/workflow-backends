const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildIrisReportingSummary,
} = require("../src/modules/irisReporting/summary");

test("buildIrisReportingSummary computes status and evidence metrics", () => {
  const records = [
    {
      status: "in_progress",
      evidenceItems: [{}, {}, {}],
      dueDate: "2026-08-10",
    },
    {
      status: "completed",
      evidenceItems: [{}],
      dueDate: "2026-07-20",
    },
    {
      status: "blocked",
      evidenceItems: [],
      dueDate: "2026-09-10",
    },
  ];

  const summary = buildIrisReportingSummary(records);

  assert.equal(summary.total, 3);
  assert.equal(summary.completed, 1);
  assert.equal(summary.inProgress, 1);
  assert.equal(summary.blocked, 1);
  assert.equal(summary.evidenceCount, 4);
  assert.equal(summary.overdueCount, 1);
  assert.equal(summary.complianceScore, 67);
  assert.equal(summary.nextDue, "2026-08-10");
});
