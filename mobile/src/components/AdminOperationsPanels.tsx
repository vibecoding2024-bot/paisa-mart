import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { operations } from "@/lib/admin-operations-api";
import { useAdminStore, type Lead, type AdminRole } from "@/lib/admin-store";
const Button = ({
  text,
  onPress,
  disabled = false,
}: {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    className="bg-slate-700 rounded-lg p-3 my-1"
  >
    <Text className={disabled ? "text-slate-500" : "text-orange-400"}>
      {text}
    </Text>
  </Pressable>
);
const Field = ({
  label,
  value,
  onChange,
  secure = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  secure?: boolean;
}) => (
  <View className="my-2">
    <Text className="text-slate-400 mb-1">{label}</Text>
    <TextInput
      accessibilityLabel={label}
      secureTextEntry={secure}
      value={value}
      onChangeText={onChange}
      className="bg-slate-700 text-white rounded-lg p-3"
    />
  </View>
);
export function ApplicationOperations({ lead }: { lead: Lead }) {
  const staff = useAdminStore((s) => s.adminUsers),
    role = useAdminStore((s) => s.currentAdmin?.role),
    refresh = useAdminStore((s) => s.refresh);
  const [provider, setProvider] = useState(""),
    [evidence, setEvidence] = useState("");
  const mutation = useMutation({
    mutationFn: (change: object) =>
      operations(
        "/applications/" + encodeURIComponent(lead.id),
        { version: lead.version ?? 0, ...change },
        "PATCH",
      ),
    onSuccess: () => void refresh(),
    retry: false,
  });
  return (
    <View className="bg-slate-800 rounded-xl p-4 my-3">
      <Text className="text-white font-semibold">Saved operations</Text>
      <PayoutEntry key={lead.id + ':' + lead.version + ':' + lead.homeVersion} lead={lead} />
      <Text className="text-slate-400">
        Internal stage: {lead.homeStage || lead.stage} · Provider decision:{" "}
        {lead.providerDecision || "unconfirmed"}
      </Text>
      {lead.payoutStatus === 'selected' && <Text className="text-orange-400">Payout selected</Text>}
      <Text className="text-slate-400">
        Assigned to: {lead.assignedOwner || "Unassigned"}
      </Text>
      {(role === "admin" || role === "ops") && (
        <>
          <Text className="text-slate-300 mt-3">Assign owner</Text>
          {staff
            .filter((u: any) => u.active && u.role !== "viewer")
            .map((u) => (
              <Button
                key={u.id}
                text={u.email}
                disabled={mutation.isPending}
                onPress={() => mutation.mutate({ assignedOwner: u.email })}
              />
            ))}
          <Button
            text="Mark follow-up complete"
            disabled={mutation.isPending || !lead.followUpDate}
            onPress={() => mutation.mutate({ followUpDate: "" })}
          />
          <Field
            label="Provider name (recorded confirmation only)"
            value={provider}
            onChange={setProvider}
          />
          <Field
            label="Provider confirmation reference / evidence"
            value={evidence}
            onChange={setEvidence}
          />
          {["approved", "rejected", "disbursed"].map((decision) => (
            <Button
              key={decision}
              text={"Record provider decision: " + decision}
              disabled={
                mutation.isPending || !provider.trim() || !evidence.trim()
              }
              onPress={() =>
                mutation.mutate({
                  provider,
                  providerEvidence: evidence,
                  providerDecision: decision,
                })
              }
            />
          ))}
        </>
      )}
      {mutation.isError && (
        <Text accessibilityRole="alert" className="text-red-400">
          {mutation.error.message}
        </Text>
      )}
    </View>
  );
}
export function OperationsRecords({
  kind,
}: {
  kind: "ticket" | "complaint" | "partner";
}) {
  const client = useQueryClient(),
    role = useAdminStore((s) => s.currentAdmin?.role);
  const query = useQuery({
    queryKey: ["operations-records", kind],
    queryFn: () => operations("/records/" + kind),
    retry: false,
  });
  const [title, setTitle] = useState(""),
    [owner, setOwner] = useState(""),
    [applicationId, setApplicationId] = useState(""),
    [note, setNote] = useState(""),
    [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: (body: any) => operations("/records/" + kind, body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["operations-records", kind] });
    },
    retry: false,
  });
  const canEdit = role === "admin" || (role === "ops" && kind !== "partner");
  return (
    <View className="bg-slate-800 rounded-xl p-4 my-3">
      <Text className="text-white text-lg font-semibold">
        {kind === "partner"
          ? "Partner directory"
          : kind === "ticket"
            ? "Support tickets"
            : "Complaints and escalation"}
      </Text>
      {query.isLoading && <Text className="text-slate-400">Loading…</Text>}
      {query.isError && (
        <Text className="text-red-400">{query.error.message}</Text>
      )}
      {query.data?.data.length === 0 && (
        <Text className="text-slate-400">No saved records.</Text>
      )}
      {query.data?.data.map((r: any) => (
        <View key={r.id} className="border-b border-slate-700 py-3">
          <Text className="text-white">
            {r.title} · {r.status}
          </Text>
          <Text className="text-slate-400">
            {r.applicationId} · {r.owner || "Unassigned"}
          </Text>
          {canEdit && (
            <>
              <Button
                text="Assign to owner entered below"
                onPress={() =>
                  mutation.mutate({
                    id: r.id,
                    version: r.version,
                    title: r.title,
                    applicationId: r.applicationId,
                    owner,
                    status: r.status,
                    note: note || r.note,
                    reason: r.reason,
                    dueAt: r.dueAt,
                  })
                }
                disabled={mutation.isPending || !owner}
              />
              <Button
                text={kind === "partner" ? "Set inactive" : "Resolve"}
                onPress={() =>
                  mutation.mutate({
                    id: r.id,
                    version: r.version,
                    title: r.title,
                    applicationId: r.applicationId,
                    owner: r.owner,
                    status: kind === "partner" ? "inactive" : "resolved",
                    note: note || r.note,
                    reason: r.reason,
                    dueAt: r.dueAt,
                  })
                }
                disabled={mutation.isPending}
              />
              {kind !== "partner" && (
                <Button
                  text="Escalate with reason below"
                  onPress={() =>
                    mutation.mutate({
                      id: r.id,
                      version: r.version,
                      title: r.title,
                      applicationId: r.applicationId,
                      owner: owner || r.owner,
                      status: "escalated",
                      note: note || r.note,
                      reason,
                      dueAt: r.dueAt,
                    })
                  }
                  disabled={mutation.isPending || !reason.trim()}
                />
              )}
            </>
          )}
        </View>
      ))}
      {canEdit && (
        <>
          <Field
            label="Title / partner name"
            value={title}
            onChange={setTitle}
          />
          <Field
            label="Application reference (optional)"
            value={applicationId}
            onChange={setApplicationId}
          />
          <Field
            label="Owner email (active staff)"
            value={owner}
            onChange={setOwner}
          />
          <Field label="Internal note" value={note} onChange={setNote} />
          <Field
            label="Escalation reason"
            value={reason}
            onChange={setReason}
          />
          <Button
            text="Save new record"
            disabled={mutation.isPending || !title.trim()}
            onPress={() =>
              mutation.mutate({
                title,
                owner,
                applicationId,
                note,
                reason,
                status: kind === "partner" ? "active" : "open",
              })
            }
          />
        </>
      )}
      {mutation.isError && (
        <Text accessibilityRole="alert" className="text-red-400">
          {mutation.error.message}
        </Text>
      )}
    </View>
  );
}
export function StaffAccess() {
  const role = useAdminStore((s) => s.currentAdmin?.role),
    users = useAdminStore((s) => s.adminUsers),
    refresh = useAdminStore((s) => s.refresh);
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [selectedRole, setRole] = useState<AdminRole>("viewer");
  const mutation = useMutation({
    mutationFn: (body: object) => operations("/staff", body),
    onSuccess: () => {
      setPassword("");
      void refresh();
    },
    retry: false,
  });
  return (
    <View className="bg-slate-800 rounded-xl p-4 my-3">
      <Text className="text-white text-lg font-semibold">Staff access</Text>
      <Text className="text-slate-400">
        Admin/operations enter payout amounts. Executive and manager each approve. Viewers cannot see amounts.
      </Text>
      {users.map((u: any) => (
        <View key={u.id} className="py-2">
          <Text className="text-slate-300">
            {u.name} · {u.email} · {u.role} · {u.active ? "active" : "disabled"}
          </Text>
          {role === "admin" && u.id !== "admin-1" && (
            <>
              <Button
                text={u.active ? "Disable access" : "Enable access"}
                disabled={mutation.isPending}
                onPress={() =>
                  mutation.mutate({
                    id: u.id,
                    version: u.version,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    active: !u.active,
                  })
                }
              />
              {(['ops', 'viewer', 'executive', 'manager'] as const).filter(r => r !== u.role).map(nextRole => <Button
                key={nextRole} text={'Set ' + nextRole + ' role'} disabled={mutation.isPending}
                onPress={() => mutation.mutate({ id: u.id, version: u.version, name: u.name, email: u.email, role: nextRole, active: !!u.active })}
              />)}
            </>
          )}
        </View>
      ))}
      {role === "admin" && (
        <>
          <Field label="Staff name" value={name} onChange={setName} />
          <Field label="Staff email" value={email} onChange={setEmail} />
          <Field
            label="Initial password (minimum 12 characters)"
            value={password}
            onChange={setPassword}
            secure
          />
          {(['ops', 'viewer', 'executive', 'manager'] as const).map(r => <Button key={r} text={(selectedRole === r ? 'Selected: ' : 'Role: ') + r} onPress={() => setRole(r)} />)}
          <Button
            text="Create staff login"
            disabled={mutation.isPending}
            onPress={() =>
              mutation.mutate({ name, email, password, role: selectedRole })
            }
          />
        </>
      )}
      {mutation.isError && (
        <Text className="text-red-400">{mutation.error.message}</Text>
      )}
    </View>
  );
}
export function AuditAndExport() {
  const role = useAdminStore((s) => s.currentAdmin?.role),
    audit = useAdminStore((s) => s.auditLogs);
  const [csv, setCsv] = useState("");
  const mutation = useMutation({
    mutationFn: () => operations("/export"),
    onSuccess: (r) => setCsv(r.csv),
    retry: false,
  });
  return (
    <View className="bg-slate-800 rounded-xl p-4 my-3">
      <Text className="text-white font-semibold">
        Audit and restricted export
      </Text>
      {role === "admin" ? (
        <>
          <Button
            text="Generate application report (no customer contact data)"
            disabled={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
          {csv ? (
            <Text selectable className="text-slate-300">
              {csv}
            </Text>
          ) : null}
          {audit.map((a) => (
            <Text key={a.id} className="text-slate-400 py-1">
              {a.timestamp} · {a.adminUser} · {a.action} · {a.entityId}
            </Text>
          ))}
        </>
      ) : (
        <Text className="text-slate-400">
          Administrator access required for exports and audit history.
        </Text>
      )}
      {mutation.isError && (
        <Text className="text-red-400">{mutation.error.message}</Text>
      )}
    </View>
  );
}
export function FinanceUnavailable() {
  return (
    <View className="bg-slate-800 rounded-xl p-4 my-3">
      <Text className="text-white font-semibold">
        Automated settlement unavailable
      </Text>
      <Text className="text-slate-400">
        No approved commission rates, effective dates, earning/settlement rules,
        are configured. Manual eligible payouts are reviewed separately. Estimated, earned,
        approved, payable, paid, reversed and disputed amounts must remain
        distinct. No amounts or payouts are inferred; no payments or provider
        requests are sent.
      </Text>
    </View>
  );
}
export function SavedDirectory({
  kind,
}: {
  kind: "customers" | "transactions";
}) {
  const query = useQuery({
    queryKey: ["operations", kind],
    queryFn: () => operations("/" + kind),
    retry: false,
  });
  const [search, setSearch] = useState("");
  const rows = (query.data?.data ?? []).filter((r: any) =>
    [r.name, r.phoneNumber, r.merchantRefId, r.status].some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );
  return (
    <View className="bg-slate-800 rounded-xl p-4 my-3">
      <Text className="text-white text-lg font-semibold">
        {kind === "customers"
          ? "Saved customers"
          : "Recorded payment transactions"}
      </Text>
      <Field label="Search saved records" value={search} onChange={setSearch} />
      {query.isLoading && <Text className="text-slate-400">Loading…</Text>}
      {query.isError && (
        <Text className="text-red-400">{query.error.message}</Text>
      )}
      {query.data?.available === false && (
        <Text className="text-amber-400">{query.data.message}</Text>
      )}
      {query.data?.available && (
        <Text className="text-slate-400">
          {rows.length} matching saved records
        </Text>
      )}
      {rows.map((r: any) => (
        <View
          key={r.phoneNumber || r.merchantRefId}
          className="border-b border-slate-700 py-2"
        >
          <Text selectable className="text-white">
            {r.name || r.merchantRefId}
          </Text>
          <Text className="text-slate-400">
            {kind === "customers"
              ? `${r.phoneNumber} · ${r.email} · KYC: ${r.kycStatus}`
              : `${r.amount} · ${r.status} · ${r.createdAt}`}
          </Text>
        </View>
      ))}
      <Text className="text-slate-400 mt-2">
        {kind === "transactions"
          ? "Recorded gateway status only. Reconciliation, commissions and payouts are unavailable. No payment actions are enabled."
          : "Profile and consent source records are preserved. Application notes and ownership are managed on the linked application."}
      </Text>
    </View>
  );
}


export function PayoutEntry({ lead }: { lead: Lead }) {
  const role = useAdminStore(s => s.currentAdmin?.role);
  const actorId = useAdminStore(s => s.currentAdmin?.id);
  const refresh = useAdminStore(s => s.refresh);
  const [customer, setCustomer] = useState<string>(lead.payout?.customerAmount ?? '');
  const [paisamart, setPaisamart] = useState<string>(lead.payout?.paisamartAmount ?? '');
  const mutation = useMutation({
    mutationFn: async (action: 'save' | 'approve') => {
      await operations('/applications/' + encodeURIComponent(lead.id) + '/payout' + (action === 'approve' ? '/approve' : ''),
        action === 'save' ? { version: lead.version ?? 0, homeVersion: lead.homeVersion, customerAmount: customer, paisamartAmount: paisamart } : { version: lead.version ?? 0, homeVersion: lead.homeVersion }, action === 'save' ? 'PUT' : 'POST');
      if (!await refresh()) throw new Error('Saved, but refresh failed. Refresh applications before continuing.');
    }, retry: false,
  });
  if (!role || role === 'viewer' || !['home-loans','business-loans','personal-loans','vehicle-loans','bank-accounts'].includes(lead.productType)) return null;
  const editor = role === 'admin' || role === 'ops';
  const approver = role === 'executive' || role === 'manager';
  const dirty = customer !== (lead.payout?.customerAmount ?? '') || paisamart !== (lead.payout?.paisamartAmount ?? '');
  const valid = [customer, paisamart].every(v => /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(v));
  return <View className="my-3 border border-slate-600 rounded-xl p-3">
    <Text className="text-white font-semibold">Eligible payout</Text>
    {!lead.payoutEligible && <Text className="text-slate-400">Available after {lead.productType === 'bank-accounts' ? 'Account Activation' : 'Disbursed'}.</Text>}
    {editor && lead.payoutEligible ? <>
      <Field label="Customer Eligible Payout (₹)" value={customer} onChange={setCustomer} />
      <Field label="Paisamart Eligible Payout (₹)" value={paisamart} onChange={setPaisamart} />
      <Text className="text-slate-400">Enter both amounts manually. Saving resets both approvals.</Text>
      <Button text="Save payout amounts" disabled={mutation.isPending || !valid} onPress={() => mutation.mutate('save')} />
    </> : lead.payout ? <>
      <Text className="text-slate-300">Customer Eligible Payout: ₹{lead.payout.customerAmount}</Text>
      <Text className="text-slate-300">Paisamart Eligible Payout: ₹{lead.payout.paisamartAmount}</Text>
    </> : null}
    {lead.payout && <>
      {(['executive', 'manager'] as const).map(r => <Text key={r} className="text-slate-300">{r === 'executive' ? 'Executive' : 'Manager'}: {lead.payout?.approvals[r] ? 'Approved by ' + lead.payout.approvals[r]!.email : 'Approval pending'}</Text>)}
      <Text className="text-slate-400">Only the applicant's amount is shared after both approvals. Paisamart's amount stays internal.</Text>
      {approver && <Button text={'Approve as ' + role} disabled={mutation.isPending || !lead.payoutEligible || dirty || lead.payout.editedBy === actorId || !!lead.payout.approvals[role]} onPress={() => mutation.mutate('approve')} />}
    </>}
    {mutation.isError && <Text accessibilityRole="alert" className="text-red-400">{mutation.error.message}</Text>}
  </View>;
}

export function PayoutReviewList() {
  const leads = useAdminStore(s => s.leads);
  const role = useAdminStore(s => s.currentAdmin?.role);
  if (!role || role === 'viewer') return <Text className="text-slate-400">Payout review requires authorized staff access.</Text>;
  return <View>{leads.filter(lead => lead.payoutEligible || lead.payout).map(lead => <View key={lead.id} className="my-2">
    <Text className="text-white">{lead.userName} · {lead.id}</Text>
    <PayoutEntry key={lead.id + ':' + lead.version + ':' + lead.homeVersion} lead={lead} />
  </View>)}</View>;
}
