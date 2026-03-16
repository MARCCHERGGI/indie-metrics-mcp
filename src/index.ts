#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Stripe from "stripe";
import { z } from "zod";
import {
  getRevenueSummary,
  getCustomerMetrics,
  getProductPerformance,
  getSubscriptionHealth,
  getRecentTransactions,
  getRefundAnalysis,
  getRevenueForecast,
} from "./analytics.js";

const STRIPE_KEY = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY || "";

if (!STRIPE_KEY) {
  console.error(
    "Error: STRIPE_API_KEY or STRIPE_SECRET_KEY environment variable is required.\n" +
    "Set it with: export STRIPE_API_KEY=sk_live_..."
  );
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY);

const server = new McpServer({
  name: "indie-metrics",
  version: "1.0.0",
});

// --- Tool 1: Revenue Summary ---
server.registerTool("get_revenue_summary", {
  title: "Revenue Summary",
  description:
    "Get a complete revenue overview including MRR, ARR, total revenue, transaction count, " +
    "average transaction value, and period-over-period growth rate. " +
    "Supports periods: 7d, 30d, 90d, 1y.",
  inputSchema: {
    period: z
      .enum(["7d", "30d", "90d", "1y"])
      .optional()
      .default("30d")
      .describe("Time period to analyze"),
  },
}, async ({ period }) => {
  try {
    const summary = await getRevenueSummary(stripe, period);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Tool 2: Customer Metrics ---
server.registerTool("get_customer_metrics", {
  title: "Customer Metrics",
  description:
    "Get customer analytics including total customers, new customers in period, " +
    "average lifetime value (LTV), and top customers by spend.",
  inputSchema: {
    period: z
      .enum(["7d", "30d", "90d", "1y"])
      .optional()
      .default("30d")
      .describe("Time period for new customer analysis"),
    limit: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe("Number of top customers to return"),
  },
}, async ({ period, limit }) => {
  try {
    const metrics = await getCustomerMetrics(stripe, period, limit);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(metrics, null, 2),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Tool 3: Product Performance ---
server.registerTool("get_product_performance", {
  title: "Product Performance",
  description:
    "Analyze revenue by product — shows each product's revenue, units sold, " +
    "average price, and share of total revenue. Identifies your best and worst sellers.",
  inputSchema: {
    period: z
      .enum(["7d", "30d", "90d", "1y"])
      .optional()
      .default("30d")
      .describe("Time period to analyze"),
  },
}, async ({ period }) => {
  try {
    const perf = await getProductPerformance(stripe, period);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(perf, null, 2),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Tool 4: Subscription Health ---
server.registerTool("get_subscription_health", {
  title: "Subscription Health",
  description:
    "Full subscription analytics: active subscriptions, churn rate, MRR, ARPU, " +
    "new vs canceled subscriptions, and breakdown by plan. Essential for SaaS metrics.",
  inputSchema: {},
}, async () => {
  try {
    const health = await getSubscriptionHealth(stripe);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(health, null, 2),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Tool 5: Recent Transactions ---
server.registerTool("get_recent_transactions", {
  title: "Recent Transactions",
  description:
    "List recent charges and payments with amount, status, customer email, " +
    "description, and timestamp. Great for checking latest sales activity.",
  inputSchema: {
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .describe("Number of transactions to return"),
  },
}, async ({ limit }) => {
  try {
    const txns = await getRecentTransactions(stripe, limit);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(txns, null, 2),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Tool 6: Refund Analysis ---
server.registerTool("get_refund_analysis", {
  title: "Refund Analysis",
  description:
    "Analyze refunds: total count, amount, refund rate vs successful charges, " +
    "and details of recent refunds including reasons. Helps identify product issues.",
  inputSchema: {
    period: z
      .enum(["7d", "30d", "90d", "1y"])
      .optional()
      .default("30d")
      .describe("Time period to analyze"),
  },
}, async ({ period }) => {
  try {
    const analysis = await getRefundAnalysis(stripe, period);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Tool 7: Revenue Forecast ---
server.registerTool("get_revenue_forecast", {
  title: "Revenue Forecast",
  description:
    "Predict future revenue based on recent trends. Shows current MRR, projected monthly " +
    "and annual revenue, growth trend direction, and confidence level. " +
    "Uses 3-month rolling analysis.",
  inputSchema: {},
}, async () => {
  try {
    const forecast = await getRevenueForecast(stripe);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(forecast, null, 2),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Start Server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
