# indie-metrics-mcp

MCP server that gives your AI assistant real-time access to your Stripe business metrics. Ask Claude (or any MCP-compatible AI) about your revenue, customers, subscriptions, and forecasts in natural language.

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
| `get_revenue_summary` | MRR, ARR, total revenue, growth rate, avg transaction value |
| `get_customer_metrics` | Total customers, new customers, LTV, top spenders |
| `get_product_performance` | Revenue by product, units sold, revenue share |
| `get_subscription_health` | Active subs, churn rate, MRR, ARPU, plan breakdown |
| `get_recent_transactions` | Latest charges with amount, status, customer, timestamp |
| `get_refund_analysis` | Refund count, rate, amounts, reasons |
| `get_revenue_forecast` | Projected revenue, trend direction, confidence level |

## Quick Start

### Install

```bash
npm install -g indie-metrics-mcp
```

### Configure

Set your Stripe API key:

```bash
export STRIPE_API_KEY=sk_live_your_key_here
```

### Add to Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "indie-metrics": {
      "command": "indie-metrics-mcp",
      "env": {
        "STRIPE_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

### Add to Claude Code

```bash
claude mcp add indie-metrics -- indie-metrics-mcp
```

Then set `STRIPE_API_KEY` in your environment.

## Supported Periods

All time-based tools accept a `period` parameter: `7d`, `30d`, `90d`, or `1y`.

## Security

- Your Stripe key stays local — it's only used server-side to make API calls
- No data is sent to any third-party service
- Read-only access — the server never creates, modifies, or deletes anything in your Stripe account
- Works with both test (`sk_test_`) and live (`sk_live_`) keys

## Requirements

- Node.js 18+
- A Stripe account with API access

## License

MIT
