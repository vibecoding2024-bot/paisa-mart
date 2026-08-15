import express from "express";
import dotenv from "dotenv";
import mcpRouter from "./routes/mcp";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/mcp", mcpRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`MCP server listening on ${port}`);
});
