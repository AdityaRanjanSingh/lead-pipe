/**
 * Health check endpoint for the agent
 * Provides status information about the agent and database connectivity
 */

import { Pool } from "pg";

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "connected" | "disconnected" | "not_configured";
      latency?: number;
      error?: string;
    };
  };
}

let startTime = Date.now();

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<HealthStatus["checks"]["database"]> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      status: "not_configured",
    };
  }

  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });

    const startTime = Date.now();
    await pool.query("SELECT NOW()");
    const latency = Date.now() - startTime;

    await pool.end();

    return {
      status: "connected",
      latency,
    };
  } catch (error) {
    return {
      status: "disconnected",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get overall health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const dbHealth = await checkDatabaseHealth();

  // Determine overall status
  let status: HealthStatus["status"] = "healthy";
  if (dbHealth.status === "disconnected") {
    status = "unhealthy";
  } else if (dbHealth.status === "not_configured") {
    status = "degraded"; // Still works with in-memory storage
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: dbHealth,
    },
  };
}

/**
 * Simple health check that returns 200 or 503
 */
export async function healthCheck(): Promise<{ ok: boolean; status: number }> {
  const health = await getHealthStatus();
  const ok = health.status !== "unhealthy";
  return {
    ok,
    status: ok ? 200 : 503,
  };
}

/**
 * Reset start time (useful for testing)
 */
export function resetStartTime(): void {
  startTime = Date.now();
}
