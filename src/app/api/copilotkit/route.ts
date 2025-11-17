import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
  LangGraphAgent
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

// 1. You can use any service adapter here for multi-agent support. We use
//    the empty adapter since we're only using one agent.
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime instance and utilize the LangGraph AG-UI
//    integration to setup the connection.
const runtime = new CopilotRuntime({
  agents: {
    starterAgent: new LangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:8123",
      graphId: "starterAgent",
      langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
    })
  }
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  const startTime = Date.now();

  try {
    logger.info("CopilotKit request received", {
      url: req.url,
      method: req.method,
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(req);
    const duration = Date.now() - startTime;

    logger.logApiRequest(
      req.method,
      "/api/copilotkit",
      response.status,
      duration,
      {
        success: response.ok,
      }
    );

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      "CopilotKit request failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        url: req.url,
        method: req.method,
        duration,
      }
    );
    throw error;
  }
};