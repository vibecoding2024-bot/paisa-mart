import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from './api-base';
// All admin operations routes are mounted under /api/admin/operations (backend/src/routes/admin.ts); callers pass
// relative paths such as "/applications?page=1". Without this prefix the requests hit the web app's SPA fallback
// and receive index.html instead of JSON (production regression 23 Nov 2026).
const base = API_BASE + "/api/admin/operations";
export async function operations(
  path: string,
  body?: unknown,
  method?: string,
) {
  const token = await AsyncStorage.getItem("paisa_mart_admin_api_token");
  if (!token) throw new Error("Please sign in again.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(base + path, {
      method: method || (body ? "POST" : "GET"),
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(
        result.message || "Operation failed. Refresh before retrying.",
      );
    return result;
  } finally {
    clearTimeout(timer);
  }
}
export async function operationsSnapshot() {
  const first = await operations("/applications?page=1");
  let data = first.data;
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await operations("/applications?page=" + page);
    if (next.snapshot !== first.snapshot)
      throw new Error("Applications changed while loading. Refresh to retry.");
    data = [...data, ...next.data];
  }
  if (new Set(data.map((r: any) => r.id)).size !== first.total)
    throw new Error(
      "Applications changed while loading. Refresh to load a consistent list.",
    );
  const session = await operations("/session");
  const staff = await operations("/staff");
  const audit =
    session.user.role === "admin" ? await operations("/audit") : { data: [] };
  return {
    leads: data,
    availability: first.availability,
    adminUsers: staff.data,
    auditLogs: audit.data,
    currentAdmin: session.user,
  };
}
export function periodStart(period: string) {
  const today = new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) +
      "T00:00:00+05:30",
  ).getTime();
  return period === "today"
    ? today
    : period === "7days"
      ? today - 6 * 86400000
      : period === "30days"
        ? today - 29 * 86400000
        : -Infinity;
}
