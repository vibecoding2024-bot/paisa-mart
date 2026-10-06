import { getPgClient, sqlite, listHomeLoanLeads } from './home-loan-lead-store';
import { HOME_LOAN_STAGES, type HomeLoanStage } from './home-loan-stages';

type History = { stage: HomeLoanStage; loanAmountRequired: string; note: string; actor: string; at: string };
type Workflow = { lead_id: string; stage: HomeLoanStage; version: number; history: string };
export class PipelineConflict extends Error {}

async function connection() {
  const sql = await getPgClient();
  const ddl = `CREATE TABLE IF NOT EXISTS home_loan_workflow (lead_id TEXT PRIMARY KEY, stage TEXT NOT NULL DEFAULT 'new', version INTEGER NOT NULL DEFAULT 0, history TEXT NOT NULL DEFAULT '[]')`;
  if (sql) await sql.unsafe(ddl);
  else sqlite!.run(ddl);
  return sql;
}

export async function listPipeline(search = '', stage?: HomeLoanStage, page = 1) {
  const sql = await connection();
  const workflow: Workflow[] = sql ? await sql`SELECT * FROM home_loan_workflow` : sqlite!.query('SELECT * FROM home_loan_workflow').all() as Workflow[];
  const byId = new Map(workflow.map(row => [row.lead_id, row]));
  const leads = (await listHomeLoanLeads()).map(lead => {
    const entry = byId.get(lead.id);
    return { ...lead, referenceNumber: `HL-${lead.id}`, stage: entry?.stage ?? 'new', version: entry?.version ?? 0, history: JSON.parse(entry?.history ?? '[]') as History[] };
  });
  const summary = HOME_LOAN_STAGES.map(key => {
    const rows = leads.filter(lead => lead.stage === key);
    return { stage: key, count: rows.length, totalLoanAmount: rows.reduce((sum, lead) => sum + BigInt(lead.loanAmountRequired), 0n).toString() };
  });
  const term = search.trim().toLowerCase();
  const filtered = leads.filter(lead => (!stage || lead.stage === stage) && [lead.referenceNumber, lead.fullName ?? '', lead.phoneNumber].some(value => value.toLowerCase().includes(term)));
  return { data: filtered.slice((page - 1) * 20, page * 20), total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / 20)), summary };
}

export async function updatePipeline(id: string, input: { stage: HomeLoanStage; version: number; loanAmountRequired: string; note: string }, actor: string) {
  const sql = await connection();
  const event: History = { stage: input.stage, loanAmountRequired: input.loanAmountRequired, note: input.note, actor, at: new Date().toISOString() };
  if (sql) {
    await sql.begin(async (tx: any) => {
      const lead = await tx`SELECT id FROM home_loan_leads WHERE id::text = ${id} FOR UPDATE`;
      if (!lead.length) throw new Error('Lead not found');
      const rows = await tx`SELECT * FROM home_loan_workflow WHERE lead_id = ${id}`;
      const current = rows[0] as Workflow | undefined;
      if ((current?.version ?? 0) !== input.version) throw new PipelineConflict('This lead changed. Refresh and try again.');
      const history = JSON.stringify([...(JSON.parse(current?.history ?? '[]') as History[]), event]);
      await tx`INSERT INTO home_loan_workflow (lead_id, stage, version, history) VALUES (${id}, ${input.stage}, ${input.version + 1}, ${history}) ON CONFLICT (lead_id) DO UPDATE SET stage = EXCLUDED.stage, version = EXCLUDED.version, history = EXCLUDED.history`;
      await tx`UPDATE home_loan_leads SET loan_amount_required = ${input.loanAmountRequired} WHERE id::text = ${id}`;
    });
  } else {
    sqlite!.transaction(() => {
      if (!sqlite!.query('SELECT id FROM home_loan_leads WHERE id = ?').get(id)) throw new Error('Lead not found');
      const current = sqlite!.query('SELECT * FROM home_loan_workflow WHERE lead_id = ?').get(id) as Workflow | null;
      if ((current?.version ?? 0) !== input.version) throw new PipelineConflict('This lead changed. Refresh and try again.');
      const history = JSON.stringify([...(JSON.parse(current?.history ?? '[]') as History[]), event]);
      sqlite!.run('INSERT INTO home_loan_workflow (lead_id, stage, version, history) VALUES (?, ?, ?, ?) ON CONFLICT (lead_id) DO UPDATE SET stage = excluded.stage, version = excluded.version, history = excluded.history', [id, input.stage, input.version + 1, history]);
      sqlite!.run('UPDATE home_loan_leads SET loanAmountRequired = ? WHERE id = ?', [input.loanAmountRequired, id]);
    })();
  }
}

// Expose only the verified customer's records, without private admin notes or other leads.
export async function customerApplications(phone: string) {
  const sql = await getPgClient();
  let workflow: Workflow[] = [];
  if (sql) {
    const exists = await sql`SELECT to_regclass('home_loan_workflow') AS name`;
    if (exists[0]?.name) workflow = await sql`SELECT * FROM home_loan_workflow`;
  } else if (sqlite!.query("SELECT name FROM sqlite_master WHERE type='table' AND name='home_loan_workflow'").get()) {
    workflow = sqlite!.query('SELECT * FROM home_loan_workflow').all() as Workflow[];
  }
  const byId = new Map(workflow.map(row => [row.lead_id, row]));
  return (await listHomeLoanLeads()).filter(lead => lead.phoneNumber === phone).map(lead => ({
    referenceNumber: `HL-${lead.id}`, stage: byId.get(lead.id)?.stage ?? 'new',
    loanAmountRequired: lead.loanAmountRequired, loanType: lead.loanType, createdAt: lead.createdAt,
  }));
}
