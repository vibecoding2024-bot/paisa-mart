import { test, expect } from "bun:test";
import { providerOutcomeCounts } from "../mobile/src/lib/admin-analytics";
import {
  createLatestRefresh,
  saveHomeLoanAndRefresh,
} from "../mobile/src/lib/admin-refresh";
function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("provider distribution partitions all internal stages without double counting", () => {
  const stages = [
    "new",
    "submitted",
    "closed",
    "approved",
    "rejected",
    "disbursed",
  ];
  for (const stage of stages) {
    const rows = [
      { stage, providerDecision: "approved" },
      { stage, providerDecision: "disbursed" },
      { stage, providerDecision: "rejected" },
      { stage, providerDecision: "unconfirmed" },
      { stage },
    ];
    const result = providerOutcomeCounts(rows);
    expect(result).toEqual({
      totalLeads: 5,
      approvedLeads: 2,
      rejectedLeads: 1,
      pendingLeads: 2,
    });
    expect(
      result.approvedLeads + result.rejectedLeads + result.pendingLeads,
    ).toBe(result.totalLeads);
  }
  expect(providerOutcomeCounts([])).toEqual({
    totalLeads: 0,
    approvedLeads: 0,
    rejectedLeads: 0,
    pendingLeads: 0,
  });
});

test("Home save immediately updates shared list/counts and pipeline before completing", async () => {
  const saved = deferred<void>(),
    pipeline = deferred<void>();
  let version = 0,
    applied = -1,
    total = 0,
    stage = "new",
    pipelineStarted = false,
    done = false;
  const refresh = createLatestRefresh(
    async () => ({
      version,
      total: 1,
      stage: version === 1 ? "documents_pending" : "new",
    }),
    (data) => {
      applied = data.version;
      total = data.total;
      stage = data.stage;
    },
    () => {},
  );
  const task = saveHomeLoanAndRefresh({
    save: async () => {
      await saved.promise;
      version = 1;
    },
    refreshApplications: refresh.refresh,
    refreshPipeline: () => {
      pipelineStarted = true;
      return pipeline.promise;
    },
  }).then(() => {
    done = true;
  });
  expect(applied).toBe(-1);
  expect(pipelineStarted).toBe(false);
  saved.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  expect(applied).toBe(1);
  expect(total).toBe(1);
  expect(stage).toBe("documents_pending");
  expect(pipelineStarted).toBe(true);
  expect(done).toBe(false);
  pipeline.resolve();
  await task;
  expect(done).toBe(true);
});

test("failed Home save never refreshes or reports success", async () => {
  let refreshes = 0;
  await expect(
    saveHomeLoanAndRefresh({
      save: async () => {
        throw new Error("Conflict");
      },
      refreshApplications: async () => {
        refreshes++;
        return true;
      },
      refreshPipeline: async () => {
        refreshes++;
      },
    }),
  ).rejects.toThrow("Conflict");
  expect(refreshes).toBe(0);
});

test("confirmed save with failed shared refresh reports saved-but-unavailable", async () => {
  let saved = false,
    pipeline = false;
  await expect(
    saveHomeLoanAndRefresh({
      save: async () => {
        saved = true;
      },
      refreshApplications: async () => false,
      refreshPipeline: async () => {
        pipeline = true;
      },
    }),
  ).rejects.toThrow("Home Loan was saved");
  expect(saved).toBe(true);
  expect(pipeline).toBe(true);
});

test("failed pipeline refetch is awaited and cannot become success", async () => {
  await expect(
    saveHomeLoanAndRefresh({
      save: async () => {},
      refreshApplications: async () => true,
      refreshPipeline: async () => {
        throw new Error("Network");
      },
    }),
  ).rejects.toThrow("Home Loan was saved");
});

test("older background response cannot overwrite refreshed Home counts", async () => {
  const old = deferred<number>(),
    fresh = deferred<number>();
  let call = 0;
  const applied: number[] = [];
  const loader = createLatestRefresh(
    () => (++call === 1 ? old.promise : fresh.promise),
    (n) => {
      applied.push(n);
    },
    () => {},
  );
  const background = loader.refresh();
  const current = loader.refresh();
  fresh.resolve(2);
  expect(await current).toBe(true);
  old.resolve(1);
  expect(await background).toBe(true);
  expect(applied).toEqual([2]);
});

test("superseded caller waits for newest refresh and ignores stale errors", async () => {
  const old = deferred<number>(),
    fresh = deferred<number>();
  let call = 0,
    done = false;
  const applied: number[] = [],
    errors: unknown[] = [];
  const loader = createLatestRefresh(
    () => (++call === 1 ? old.promise : fresh.promise),
    (n) => {
      applied.push(n);
    },
    (e) => {
      errors.push(e);
    },
  );
  const first = loader.refresh().then((r) => {
    done = true;
    return r;
  });
  const second = loader.refresh();
  old.reject(new Error("Old failed"));
  await Promise.resolve();
  expect(done).toBe(false);
  fresh.resolve(2);
  expect(await first).toBe(true);
  expect(await second).toBe(true);
  expect(errors).toEqual([]);
  expect(applied).toEqual([2]);
});

test("latest failure prevents stale success from publishing or returning true", async () => {
  const old = deferred<number>(),
    fresh = deferred<number>();
  let call = 0;
  const applied: number[] = [],
    errors: unknown[] = [];
  const loader = createLatestRefresh(
    () => (++call === 1 ? old.promise : fresh.promise),
    (n) => {
      applied.push(n);
    },
    (e) => {
      errors.push(e);
    },
  );
  const first = loader.refresh(),
    second = loader.refresh();
  fresh.reject(new Error("Unavailable"));
  expect(await second).toBe(false);
  old.resolve(1);
  expect(await first).toBe(false);
  expect(applied).toEqual([]);
  expect(errors).toHaveLength(1);
});

test("logout invalidation prevents late application data from returning", async () => {
  const pending = deferred<number>();
  let applied = false;
  const loader = createLatestRefresh(
    () => pending.promise,
    () => {
      applied = true;
    },
    () => {},
  );
  const refresh = loader.refresh();
  loader.invalidate();
  pending.resolve(1);
  expect(await refresh).toBe(false);
  expect(applied).toBe(false);
});
