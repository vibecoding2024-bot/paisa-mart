export type PaisaConnectorOptions = { baseUrl?: string | undefined; apiKey?: string | undefined };

export class PaisaConnector {
  baseUrl: string;
  apiKey?: string;
  constructor(opts: PaisaConnectorOptions) {
    this.baseUrl = opts.baseUrl || "http://localhost:3000";
    this.apiKey = opts.apiKey;
  }

  private headers() {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h["Authorization"] = `Bearer ${this.apiKey}`;
    return h;
  }

  async updateProfile(payload: any) {
    const res = await fetch(`${this.baseUrl}/api/users/profile`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`paisa updateProfile failed: ${res.status}`);
    return res.json();
  }

  async createLead(payload: any) {
    const res = await fetch(`${this.baseUrl}/api/personal-loans/leads`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`paisa createLead failed: ${res.status}`);
    return res.json();
  }
}
