/**
 * Health check endpoint for the UI application
 * Returns status information about the application and agent connectivity
 */

import { NextResponse } from "next/server";

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    agent: {
      status: "connected" | "disconnected" | "unknown";
      url: string;
      latency?: number;
      error?: string;
    };
  };
}

const startTime = Date.now();

/**
 * Check agent connectivity
 */
async function checkAgentHealth(): Promise<HealthStatus["checks"]["agent"]> {
  const agentUrl = process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:8123";

  try {
    const startTime = Date.now();
    const response = await fetch(`${agentUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        status: "connected",
        url: agentUrl,
        latency,
      };
    } else {
      return {
        status: "disconnected",
        url: agentUrl,
        error: `Agent returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: "disconnected",
      url: agentUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * GET /api/health
 * Returns health status of the application
 */
export async function GET() {
  try {
    const agentHealth = await checkAgentHealth();

    // Determine overall status
    let status: HealthStatus["status"] = "healthy";
    if (agentHealth.status === "disconnected") {
      status = "degraded"; // UI can still serve pages, but agent is down
    }

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        agent: agentHealth,
      },
    };

    const statusCode =
      healthStatus.status === "unhealthy" ? 503 : healthStatus.status === "degraded" ? 200 : 200;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 }
    );
  }
}
