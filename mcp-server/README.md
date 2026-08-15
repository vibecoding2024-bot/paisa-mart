# Paisa MCP Server

Minimal MCP-style server to connect an LLM-driven chat to paisa-mart backend.

Run locally:

```bash
cd mcp-server
cp .env.example .env
# fill .env with values
npm install
npm run dev
```

Endpoints:
- `GET /mcp/health` - health check
- `POST /mcp/execute` - execute an action (body: { connector: 'paisa', action: 'updateProfile', params: { ... } })
