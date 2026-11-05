import { SERVICE_STAGE_LABELS } from './product-catalog';
import type { LeadStage, ProductCategory } from './admin-store';
import { HOME_LOAN_STAGE_LABELS, HOME_LOAN_STAGES } from './home-loan-stages';

const LOAN_PRODUCTS: readonly ProductCategory[] = [
  'home-loans',
  'business-loans',
  'personal-loans',
  'vehicle-loans',
];

const GENERIC_STAGE_BY_LOAN_STAGE: Record<(typeof HOME_LOAN_STAGES)[number], LeadStage> = {
  new: 'new',
  contacted: 'eligibility_check',
  documents_pending: 'kyc_pending',
  application_submitted: 'submitted',
  underwriting: 'kyc_completed',
  sanctioned: 'approved',
  disbursed: 'disbursed',
  rejected_dropped: 'rejected',
};

const LOAN_LABEL_BY_GENERIC_STAGE: Partial<Record<LeadStage, string>> = {
  new: HOME_LOAN_STAGE_LABELS.new,
  eligibility_check: HOME_LOAN_STAGE_LABELS.contacted,
  kyc_pending: HOME_LOAN_STAGE_LABELS.documents_pending,
  submitted: HOME_LOAN_STAGE_LABELS.application_submitted,
  kyc_completed: HOME_LOAN_STAGE_LABELS.underwriting,
  approved: HOME_LOAN_STAGE_LABELS.sanctioned,
  disbursed: HOME_LOAN_STAGE_LABELS.disbursed,
  rejected: HOME_LOAN_STAGE_LABELS.rejected_dropped,
};

const GENERIC_STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  consent_given: 'Consent Given',
  eligibility_check: 'Eligibility Check',
  kyc_pending: 'KYC Pending',
  kyc_completed: 'KYC Completed',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  closed: 'Closed',
};

export function isLoanPipelineProduct(product: ProductCategory): boolean {
  return LOAN_PRODUCTS.includes(product);
}

export function leadStageLabel(product: ProductCategory, stage: LeadStage): string {
  if (SERVICE_STAGE_LABELS[product]?.[stage]) return SERVICE_STAGE_LABELS[product][stage];
  return isLoanPipelineProduct(product)
    ? LOAN_LABEL_BY_GENERIC_STAGE[stage] ?? stage
    : GENERIC_STAGE_LABELS[stage];
}

export function leadStageOptions(product: ProductCategory): LeadStage[] {
  if (SERVICE_STAGE_LABELS[product]) return Object.keys(SERVICE_STAGE_LABELS[product]) as LeadStage[];
  if (!isLoanPipelineProduct(product)) {
    return ['new', 'eligibility_check', 'kyc_pending', 'kyc_completed', 'submitted', 'closed'];
  }
  return HOME_LOAN_STAGES.map((stage) => GENERIC_STAGE_BY_LOAN_STAGE[stage]);
}
