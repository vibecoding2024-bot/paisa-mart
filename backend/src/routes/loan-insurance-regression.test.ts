import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { rmSync } from "node:fs";
import { join } from "node:path";

const databasePath = join(import.meta.dir, "loan-insurance-regression.test.sqlite");
rmSync(databasePath, { force: true });
process.env.LEADS_DB = databasePath;
process.env.HOME_LOANS_DATABASE_URL = "";
process.env.PERSONAL_LOANS_DATABASE_URL = "";
process.env.BUSINESS_LOANS_DATABASE_URL = "";
process.env.VEHICLE_LOANS_DATABASE_URL = "";
process.env.LIFE_INSURANCE_DATABASE_URL = "";
process.env.DATABASE_URL = "";
process.env.POSTGRES_URL = "";
process.env.AUTH_TOKEN_SECRET = "requirements-regression-auth-secret";
process.env.HOME_LOAN_ADMIN_PASSWORD = "requirements-test-password";
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = "requirements-regression-admin-secret";

const { businessLoansRouter } = await import("./business-loans");
const { personalLoansRouter } = await import("./personal-loans");
const { lifeInsuranceRouter } = await import("./life-insurance");
const { vehicleLoansRouter } = await import("./vehicle-loans");
const { adminRouter } = await import("./admin");
const { leadStageLabel, leadStageOptions } = await import("../../../mobile/src/lib/loan-product-stages");

const json = (data: unknown, token?: string) => ({
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(data),
});
const body = (response: Response) => response.json() as Promise<any>;

test.serial("business loan calendar DOB and all submitted fields persist", async () => {
  const invalid = await businessLoansRouter.request("/leads", {
    method: "POST",
    ...json({
      phoneNumber: "9876543210",
      businessType: "Retail Business",
      loanPurpose: "Working Capital",
      dateOfBirth: "31/02/2000",
    }),
  });
  expect(invalid.status).toBe(400);

  const response = await businessLoansRouter.request("/leads", {
    method: "POST",
    ...json({
      phoneNumber: "9876543210",
      fullName: "Test Business Owner",
      cibil: "750",
      dateOfBirth: "29/02/2000",
      city: "Hyderabad",
      state: "Telangana",
      monthlyIncome: "50000",
      existingEmi: "2500",
      businessType: "Retail Business",
      loanAmountRequired: "2500000",
      loanPurpose: "Other",
      loanPurposeOtherText: "Open a second location",
    }),
  });
  expect(response.status).toBe(200);
  const saved = await body(response);
  expect(saved.success).toBe(true);

  const db = new Database(databasePath);
  const row = db.query("SELECT * FROM business_loan_leads WHERE id = ?").get(saved.data.id) as Record<string, string>;
  expect(row.fullName).toBe("Test Business Owner");
  expect(row.cibil).toBe("750");
  expect(row.dateOfBirth).toBe("29/02/2000");
  expect(row.city).toBe("Hyderabad");
  expect(row.state).toBe("Telangana");
  expect(row.monthlyIncome).toBe("50000");
  expect(row.existingEmi).toBe("2500");
  expect(row.loanPurposeOtherText).toBe("Open a second location");
  db.run("CREATE TRIGGER reject_business BEFORE INSERT ON business_loan_leads BEGIN SELECT RAISE(FAIL, 'test failure'); END");
  const failed = await businessLoansRouter.request("/leads", {
    method: "POST",
    ...json({
      phoneNumber: "9876543210",
      businessType: "Retail Business",
      loanPurpose: "Working Capital",
    }),
  });
  expect(failed.status).toBe(500);
  expect((await body(failed)).success).toBe(false);
  db.run("DROP TRIGGER reject_business");
  db.close();
});

test.serial("life insurance leads save all form fields and reject failed writes", async () => {
  const lifeInput = {
    phoneNumber: "9876543210",
    fullName: "Life Applicant",
    selectedLifeInsurer: "Example Insurer",
    policyType: "Term Insurance",
    premiumSlab: "Others Amount",
    premiumOtherAmount: "12500",
  };
  const life = await lifeInsuranceRouter.request("/leads", { method: "POST", ...json(lifeInput) });
  expect(life.status).toBe(200);
  const lifeData = (await body(life)).data;

  const db = new Database(databasePath);
  expect(db.query("SELECT policyType, premiumSlab, premiumOtherAmount FROM life_insurance_leads WHERE id = ?").get(lifeData.id))
    .toEqual({ policyType: "Term Insurance", premiumSlab: "Others Amount", premiumOtherAmount: "12500" });

  db.run("CREATE TRIGGER reject_life BEFORE INSERT ON life_insurance_leads BEGIN SELECT RAISE(FAIL, 'test failure'); END");
  const failedLife = await lifeInsuranceRouter.request("/leads", { method: "POST", ...json(lifeInput) });
  expect(failedLife.status).toBe(500);
  expect((await body(failedLife)).success).toBe(false);
  db.run("DROP TRIGGER reject_life");
  db.close();
});

test.serial("vehicle loan submission persists its complete form and rejects invalid DOB", async () => {
  const input = {
    phoneNumber: "9988776655",
    fullName: "Vehicle Loan Applicant",
    cibil: "720",
    occupation: "Transport Operator",
    dateOfBirth: "15/08/1988",
    city: "Hyderabad",
    state: "Telangana",
    monthlyIncome: "85000",
    loanAmountRequired: "1200000",
    existingEmi: "15000",
    vehicleType: "Lorry / Truck",
  };
  const invalid = await vehicleLoansRouter.request("/leads", {
    method: "POST",
    ...json({ ...input, dateOfBirth: "31/02/2000" }),
  });
  expect(invalid.status).toBe(400);

  const response = await vehicleLoansRouter.request("/leads", {
    method: "POST",
    ...json(input),
  });
  expect(response.status).toBe(200);
  const saved = await body(response);
  const db = new Database(databasePath);
  const row = db.query("SELECT * FROM vehicle_loan_leads WHERE id = ?").get(saved.data.id) as Record<string, string>;
  for (const [field, expected] of Object.entries({
    phoneNumber: input.phoneNumber,
    fullName: input.fullName,
    cibil: input.cibil,
    occupation: input.occupation,
    dateOfBirth: input.dateOfBirth,
    city: input.city,
    state: input.state,
    monthlyIncome: input.monthlyIncome,
    loanAmountRequired: input.loanAmountRequired,
    existingEmi: input.existingEmi,
    vehicleType: input.vehicleType,
  })) expect(row[field]).toBe(expected);
  db.close();
});

test("loan pipeline UI maps the eight named stages only to loan products", () => {
  const stages = ["new", "eligibility_check", "kyc_pending", "submitted", "kyc_completed", "approved", "disbursed", "rejected"];
  for (const product of ["business-loans", "personal-loans", "vehicle-loans"] as const) {
    expect(leadStageOptions(product)).toEqual(stages);
    expect(leadStageOptions(product).map((stage) => leadStageLabel(product, stage))).toEqual([
      "New leads",
      "Contacted",
      "Documents pending",
      "Login / application submitted",
      "Underwriting",
      "Sanctioned",
      "Disbursed",
      "Rejected / dropped",
    ]);
  }
});

test.serial("business, personal, and vehicle loan stages persist with refreshed history and audit, while viewer access stays restricted", async () => {
  const business = await body(await businessLoansRouter.request("/leads", {
    method: "POST",
    ...json({
      phoneNumber: "9876543210",
      fullName: "Pipeline Business",
      dateOfBirth: "29/02/2000",
      businessType: "Retail Business",
      loanAmountRequired: "2500000",
      loanPurpose: "Working Capital",
    }),
  }));
  const personal = await body(await personalLoansRouter.request("/leads", {
    method: "POST",
    ...json({
      phoneNumber: "9123456789",
      fullName: "Pipeline Personal",
      monthlyIncome: "50000",
      existingEmi: "1000",
    }),
  }));
  const vehicle = await body(await vehicleLoansRouter.request("/leads", {
    method: "POST",
    ...json({
      phoneNumber: "9988776655",
      fullName: "Pipeline Vehicle Loan",
      cibil: "720",
      occupation: "Driver",
      dateOfBirth: "15/08/1988",
      city: "Hyderabad",
      state: "Telangana",
      monthlyIncome: "85000",
      loanAmountRequired: "1200000",
      existingEmi: "15000",
      vehicleType: "Lorry / Truck",
    }),
  }));

  const login = await body(await adminRouter.request("/auth/login", {
    method: "POST",
    ...json({ email: "admin@paisamart.com", password: "requirements-test-password" }),
  }));
  expect(login.success).toBe(true);
  const token = login.token as string;
  const ops = (path: string, method = "GET", data?: unknown, auth = token) =>
    adminRouter.request(`/operations${path}`, {
      method,
      headers: { Authorization: `Bearer ${auth}`, ...(data ? { "Content-Type": "application/json" } : {}) },
      body: data ? JSON.stringify(data) : undefined,
    });

  const listed = await body(await ops("/applications"));
  const submittedVehicleLoan = listed.data.find((item: any) => item.productType === "vehicle-loans");
  const submittedLifeInsurance = listed.data.find((item: any) => item.productType === "life-insurance");
  expect((await ops(`/applications/${encodeURIComponent(submittedVehicleLoan.id)}`, "PATCH", {
    version: submittedVehicleLoan.version,
    stage: "closed",
  })).status).toBe(400);
  expect((await ops(`/applications/${encodeURIComponent(submittedLifeInsurance.id)}`, "PATCH", {
    version: submittedLifeInsurance.version,
    stage: "approved",
  })).status).toBe(400);
  const targets = [
    { id: `BL-${business.data.id}`, stages: ["new", "eligibility_check", "kyc_pending", "submitted", "kyc_completed", "approved", "disbursed", "rejected"] },
    { id: `PL-LEGACY-${personal.data.id}`, stages: ["new", "eligibility_check", "kyc_pending", "submitted", "kyc_completed", "approved", "disbursed", "rejected"] },
    { id: `VL-${vehicle.data.id}`, stages: ["new", "eligibility_check", "kyc_pending", "submitted", "kyc_completed", "approved", "disbursed", "rejected"] },
  ];
  for (const target of targets) {
    let lead = listed.data.find((item: any) => item.id === target.id);
    expect(lead).toBeDefined();
    for (const stage of target.stages) {
      const approvalEvidence = stage === "approved" ? {
        provider: "Regression Test Provider",
        providerDecision: "approved",
        providerEvidence: "Verified approval record for isolated regression test",
      } : {};
      const changed = await ops(`/applications/${encodeURIComponent(target.id)}`, "PATCH", {
        version: lead.version,
        stage,
        note: `Reviewed ${stage}`,
        ...approvalEvidence,
      });
      expect(changed.status).toBe(200);
      lead = { ...lead, version: lead.version + 1 };
    }
  }

  const refreshed = await body(await ops("/applications"));
  for (const target of targets) {
    const lead = refreshed.data.find((item: any) => item.id === target.id);
    expect(lead.stage).toBe("rejected");
    expect(lead.stageHistory).toHaveLength(8);
    expect(lead.stageHistory.map((event: any) => event.toStage)).toEqual(target.stages);
    expect(lead.stageHistory[7].note).toBe("Reviewed rejected");
  }
  const audit = await body(await ops("/audit"));
  expect(audit.data.filter((event: any) => targets.some((target) => target.id === event.entityId))).toHaveLength(24);

  const staff = await body(await ops("/staff", "POST", {
    name: "Read Only",
    email: "viewer@example.test",
    role: "viewer",
    password: "requirements-viewer-password",
    active: true,
  }));
  expect(staff.success).toBe(true);
  const viewerLogin = await body(await adminRouter.request("/auth/login", {
    method: "POST",
    ...json({ email: "viewer@example.test", password: "requirements-viewer-password" }),
  }));
  const viewerList = await body(await ops("/applications", "GET", undefined, viewerLogin.token));
  const viewerBusiness = viewerList.data.find((item: any) => item.id === targets[0].id);
  expect(viewerBusiness.mobile).toBe("******3210");
  expect(viewerBusiness.extraDetails["Date of Birth"]).toBeUndefined();
  expect(viewerBusiness.stageHistory).toEqual([]);
  const viewerVehicle = viewerList.data.find((item: any) => item.id === targets[2].id);
  expect(viewerVehicle.extraDetails.Occupation).toBeUndefined();
  expect(viewerVehicle.extraDetails["Vehicle Type"]).toBeUndefined();
  expect(viewerVehicle.creditScore).toBeUndefined();
  expect((await ops(`/applications/${targets[0].id}`, "PATCH", {
    version: viewerBusiness.version,
    stage: "closed",
  }, viewerLogin.token)).status).toBe(403);
});
