import { test, expect, mock } from "bun:test";
import { saveHomeLoanAndRefresh } from "../mobile/src/lib/admin-refresh";
let snapshot: () => Promise<any>;
mock.module("../mobile/src/lib/admin-operations-api", () => ({
  operationsSnapshot: () => snapshot(),
  operations: async () => ({ success: true }),
}));
mock.module("../mobile/src/lib/home-loan-admin-api", () => ({
  adminLogin: async () => null,
}));
mock.module("@react-native-async-storage/async-storage", () => ({
  default: { setItem: async () => {}, removeItem: async () => {} },
}));
const { useAdminStore } = await import("../mobile/src/lib/admin-store");
const result = (stage: string) => ({
  leads: [
    {
      id: "HL-test",
      stage,
      followUpDate: "2030-01-01T00:00:00.000Z",
      assignedOwner: "preview@example.test",
    },
  ],
  availability: { home_loan_leads: "available" },
  adminUsers: [],
  auditLogs: [],
  currentAdmin: {
    id: "admin-1",
    name: "Test",
    email: "preview@example.test",
    role: "admin",
    createdAt: "",
  },
});

test("Home save refreshes actual shared store and stage counts before success", async () => {
  let persistedStage = "new";
  snapshot = async () => result(persistedStage);
  await useAdminStore.getState().refresh();
  expect(
    useAdminStore.getState().leads.filter((l) => l.stage === "new"),
  ).toHaveLength(1);
  let pipelineRefreshed = false;
  await saveHomeLoanAndRefresh({
    save: async () => {
      persistedStage = "kyc_pending";
    },
    refreshApplications: useAdminStore.getState().refresh,
    refreshPipeline: async () => {
      pipelineRefreshed = true;
    },
  });
  const state = useAdminStore.getState();
  expect(state.leads.filter((l) => l.stage === "new")).toHaveLength(0);
  expect(state.leads.filter((l) => l.stage === "kyc_pending")).toHaveLength(1);
  expect(state.followUps).toHaveLength(1);
  expect(state.error).toBe("");
  expect(pipelineRefreshed).toBe(true);
});

test("actual store prevents an older background response undoing a saved refresh", async () => {
  let resolveOld!: (value: any) => void;
  const pending = new Promise<any>((resolve) => {
    resolveOld = resolve;
  });
  snapshot = () => pending;
  const old = useAdminStore.getState().refresh();
  snapshot = async () => result("submitted");
  await saveHomeLoanAndRefresh({
    save: async () => {},
    refreshApplications: useAdminStore.getState().refresh,
    refreshPipeline: async () => {},
  });
  resolveOld(result("new"));
  expect(await old).toBe(true);
  expect(useAdminStore.getState().leads[0].stage).toBe("submitted");
});

test("shared refresh failure preserves saved/error distinction and does not claim completion", async () => {
  snapshot = async () => {
    throw new Error("Synthetic network error");
  };
  await expect(
    saveHomeLoanAndRefresh({
      save: async () => {},
      refreshApplications: useAdminStore.getState().refresh,
      refreshPipeline: async () => {},
    }),
  ).rejects.toThrow("Home Loan was saved");
  expect(useAdminStore.getState().error).toBe("Synthetic network error");
});
