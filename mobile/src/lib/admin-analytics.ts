/** Provider outcome buckets are mutually exclusive; internal processing is independent. */
export function providerOutcomeCounts(
  rows: ReadonlyArray<{ providerDecision?: string }>,
) {
  let approvedLeads = 0,
    rejectedLeads = 0,
    pendingLeads = 0;
  for (const row of rows) {
    if (
      row.providerDecision === "approved" ||
      row.providerDecision === "disbursed"
    )
      approvedLeads++;
    else if (row.providerDecision === "rejected") rejectedLeads++;
    else pendingLeads++;
  }
  return {
    totalLeads: rows.length,
    approvedLeads,
    rejectedLeads,
    pendingLeads,
  };
}
