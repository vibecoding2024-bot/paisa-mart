/** Only the newest request may publish state. Older callers wait for its outcome. */
export function createLatestRefresh<T>(
  load: () => Promise<T>,
  apply: (value: T) => void,
  fail: (error: unknown) => void,
) {
  let revision = 0;
  let latest: Promise<boolean> = Promise.resolve(false);
  return {
    refresh(): Promise<boolean> {
      const request = ++revision;
      latest = (async () => {
        try {
          const value = await load();
          if (request !== revision) return latest;
          apply(value);
          return true;
        } catch (error) {
          if (request !== revision) return latest;
          fail(error);
          return false;
        }
      })();
      return latest;
    },
    invalidate() {
      revision++;
      latest = Promise.resolve(false);
    },
  };
}

/** Keep the save pending until both screens can read the confirmed backend change. */
export async function saveHomeLoanAndRefresh(actions: {
  save: () => Promise<void>;
  refreshApplications: () => Promise<boolean>;
  refreshPipeline: () => Promise<unknown>;
}) {
  await actions.save();
  const results = await Promise.allSettled([
    actions.refreshApplications(),
    actions.refreshPipeline(),
  ]);
  if (
    results[0].status !== "fulfilled" ||
    !results[0].value ||
    results[1].status !== "fulfilled"
  ) {
    throw new Error(
      "Home Loan was saved, but refreshed dashboard data is unavailable. Refresh before making another change.",
    );
  }
}
