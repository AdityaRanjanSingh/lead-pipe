import { Hono } from "hono";

// Create Hono app for custom HTTP routes
const app = new Hono();

// Health check endpoints
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/ok", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (c) => {
  return c.json({
    message: "LangGraph Agent Server",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

export { app };
