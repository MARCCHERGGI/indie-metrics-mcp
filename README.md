# indie-metrics-mcp

MCP server that gives an AI assistant read-only access to Stripe business metrics. Ask an MCP-compatible client about revenue, customers, subscriptions, refunds, and forecasts in natural language.

## What You Can Ask

- "What's my MRR this month?"
- "Show me my top customers by spend"
- "Which product is selling best?"
- "What's my churn rate?"
- "Show recent transactions"
- "How many refunds did I have this quarter?"
- "Forecast my revenue for next month"

## Tools

| Tool | Description |
|------|-------------|
| `get_revenue_summary` | MRR, ARR, total revenue, growth rate, average transaction value |
| `get_customer_metrics` | Total customers, new customers, LTV, top spenders |
| `get_product_performance` | Revenue by product, units sold, revenue share |
| `get_subscription_health` | Active subscriptions, churn rate, MRR, ARPU, plan breakdown |
| `get_recent_transactions` | Latest charges with amount, status, customer, timestamp |
| `get_refund_analysis` | Refund count, rate, amounts, reasons |
| `get_revenue_forecast` | Projected revenue, trend direction, confidence level |

## Install From Source

The npm package is not claimed as published. Use the tagged source release until an npm package is independently confirmed.

```bash
git clone https://github.com/MARCCHERGGI/indie-metrics-mcp.git
cd indie-metrics-mcp
npm ci
npm run build
```

## Configure Safely

Start with a Stripe test-mode restricted key. Grant only the read permissions required by the tools you plan to use. Never commit a key, paste it into an issue, or expose it to a hosted demo.

```bash
export STRIPE_API_KEY=sk_test_your_restricted_key_here
```

### Add to an MCP-compatible desktop client

Point the client at the locally built executable:

```json
{
  "mcpServers": {
    "indie-metrics": {
      "command": "node",
      "args": ["/absolute/path/to/indie-metrics-mcp/dist/index.js"],
      "env": {
        "STRIPE_API_KEY": "sk_test_your_restricted_key_here"
      }
    }
  }
}
```

Use your client's secure environment-variable or secret-management feature when available instead of storing credentials directly in a configuration file.

## Supported Periods

All time-based tools accept a `period` parameter: `7d`, `30d`, `90d`, or `1y`.

## Security Boundaries

- The server is designed for local execution.
- Tool operations are read-only with respect to Stripe.
- Start in Stripe test mode and use a restricted key with least privilege.
- Do not connect real customer data to public demonstrations.
- Forecasts are estimates, not financial advice.
- Review the source and permissions before using the server with production data.

## Public Reproducibility Companion

FounderMetricBench is a separate public synthetic evaluation maintained by Marco Hergi. It contains 24 gold cases for routing, calculation, retrieval, and safety, plus stable evidence fixtures and a hosted synthetic MCP endpoint. It does not use this repository's users, credentials, or real Stripe data.

- [Evaluation arena](https://marco-is-my-friend.marcohergee813.chatgpt.site/arena)
- [Machine-readable benchmark](https://marco-is-my-friend.marcohergee813.chatgpt.site/founder-metric-bench.json)
- [Synthetic MCP endpoint](https://marco-is-my-friend.marcohergee813.chatgpt.site/mcp)
- [Readiness benchmark and known gaps](https://marco-is-my-friend.marcohergee813.chatgpt.site/research/stripe-mcp-benchmark)

This repository and the companion site are independent projects. They are not produced, sponsored, certified, or endorsed by Stripe, Anthropic, OpenAI, Google, Microsoft, or Perplexity.

## Release Verification

Before publishing a release, run:

```bash
npm ci
npm run build
```

A release should describe known limitations and link to the exact commit or tag it represents.

## License and Attribution

MIT. See [LICENSE](LICENSE). Existing copyright and authorship notices are preserved.
