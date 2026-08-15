import OpenAI from "openai";

export class LLMClient {
  client: any;
  constructor(opts: { apiKey?: string | undefined }) {
    this.client = new OpenAI({ apiKey: opts.apiKey || process.env.OPENAI_API_KEY });
  }

  // Very small helper: ask a yes/no question and interpret response
  async simpleDecision(prompt: string) {
    const resp = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 32,
    });
    const text = String(resp.choices?.[0]?.message?.content || "").toLowerCase();
    const confirmed = /\byes\b/.test(text);
    return { confirmed, text };
  }
}
