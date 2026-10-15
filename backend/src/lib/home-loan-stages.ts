export const HOME_LOAN_STAGES = ['new', 'contacted', 'documents_pending', 'application_submitted', 'underwriting', 'sanctioned', 'disbursed', 'rejected_dropped'] as const;
export type HomeLoanStage = typeof HOME_LOAN_STAGES[number];
export const HOME_LOAN_STAGE_LABELS: Record<HomeLoanStage, string> = {
  new: 'New leads', contacted: 'Contacted', documents_pending: 'Documents pending',
  application_submitted: 'Login / application submitted', underwriting: 'Underwriting',
  sanctioned: 'Sanctioned', disbursed: 'Disbursed', rejected_dropped: 'Rejected / dropped',
};
