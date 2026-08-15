import { Router } from "express";
import { PaisaConnector } from "../paisaConnector";
import { LLMClient } from "../llmClient";

const router = Router();
const paisa = new PaisaConnector({ baseUrl: process.env.PAISA_BASE_URL, apiKey: process.env.PAISA_API_KEY });
const llm = new LLMClient({ apiKey: process.env.OPENAI_API_KEY });

router.get("/health", (_req, res) => res.json({ ok: true }));

router.post("/execute", async (req, res) => {
  const { connector, action, params } = req.body || {};
  if (connector !== "paisa") return res.status(400).json({ error: "unsupported connector" });

  // Example safety confirmation via LLM (can be extended)
  const prompt = `Should I perform action ${action} with params ${JSON.stringify(params)}? Answer yes or no.`;
  const decision = await llm.simpleDecision(prompt);
  if (!decision.confirmed) return res.status(403).json({ error: "Action not confirmed by policy" });

  try {
    let result;
    switch (action) {
      case "updateProfile":
        result = await paisa.updateProfile(params);
        break;
      case "createLead":
        result = await paisa.createLead(params);
        break;
      default:
        return res.status(400).json({ error: "unknown action" });
    }
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

export default router;
