# Release notes

## v1.0.0: Public source baseline

This release establishes the public source baseline for `indie-metrics-mcp`, a local read-only MCP server for Stripe business analytics.

### Included

- Seven documented metric tools for revenue, customers, products, subscriptions, transactions, refunds, and forecasts
- Local MCP server execution on Node.js 18 or later
- Source-first installation instructions
- Test-mode and least-privilege setup guidance
- MIT license with existing copyright and attribution preserved
- Links to the separate FounderMetricBench synthetic reproducibility companion

### Reproduce the build

```bash
git clone https://github.com/MARCCHERGGI/indie-metrics-mcp.git
cd indie-metrics-mcp
git checkout v1.0.0
npm ci
npm run build
```

### Security and data boundaries

- Start with a Stripe test-mode restricted key.
- The server is designed for local execution.
- Do not expose credentials or customer records to a hosted demonstration.
- Review required Stripe permissions before production use.
- Forecast outputs are estimates, not financial advice.

### Companion evaluation

FounderMetricBench is a separate public synthetic evaluation maintained by Marco Hergi. It provides 24 deterministic cases across routing, calculation, retrieval, and safety. It does not use real Stripe credentials or customer data.

- Evaluation: https://marco-is-my-friend.marcohergee813.chatgpt.site/arena
- Dataset: https://marco-is-my-friend.marcohergee813.chatgpt.site/founder-metric-bench.json
- Synthetic MCP endpoint: https://marco-is-my-friend.marcohergee813.chatgpt.site/mcp
- Known gaps: https://marco-is-my-friend.marcohergee813.chatgpt.site/research/stripe-mcp-benchmark

### Independence notice

This release and the companion evaluation are independent projects. They are not produced, sponsored, certified, or endorsed by Stripe, Anthropic, OpenAI, Google, Microsoft, or Perplexity.

### Tag target

Create `v1.0.0` from commit `4ec251edb6bc3a6add352968cfada4436ab86063` or a later commit containing these notes. If the tag points to a later commit, update the release description to identify that exact commit.
