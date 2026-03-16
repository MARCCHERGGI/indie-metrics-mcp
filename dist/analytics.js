function toCents(amount) {
    return amount;
}
function toDollars(cents) {
    return Number((cents / 100).toFixed(2));
}
function periodToTimestamps(period) {
    const now = new Date();
    const end = Math.floor(now.getTime() / 1000);
    let start;
    let prevStart;
    switch (period) {
        case "7d":
            start = end - 7 * 86400;
            prevStart = start - 7 * 86400;
            break;
        case "30d":
            start = end - 30 * 86400;
            prevStart = start - 30 * 86400;
            break;
        case "90d":
            start = end - 90 * 86400;
            prevStart = start - 90 * 86400;
            break;
        case "1y":
            start = end - 365 * 86400;
            prevStart = start - 365 * 86400;
            break;
        default:
            start = end - 30 * 86400;
            prevStart = start - 30 * 86400;
    }
    return { start, end, prevStart };
}
export async function getRevenueSummary(stripe, period = "30d") {
    const { start, end, prevStart } = periodToTimestamps(period);
    const charges = await stripe.charges.list({
        created: { gte: start, lte: end },
        limit: 100,
    });
    const prevCharges = await stripe.charges.list({
        created: { gte: prevStart, lte: start },
        limit: 100,
    });
    const successfulCharges = charges.data.filter((c) => c.status === "succeeded");
    const prevSuccessfulCharges = prevCharges.data.filter((c) => c.status === "succeeded");
    const totalRevenue = successfulCharges.reduce((sum, c) => sum + c.amount, 0);
    const prevRevenue = prevSuccessfulCharges.reduce((sum, c) => sum + c.amount, 0);
    const daysInPeriod = (end - start) / 86400;
    const dailyRevenue = totalRevenue / daysInPeriod;
    const mrr = dailyRevenue * 30;
    const arr = mrr * 12;
    const growthRate = prevRevenue > 0
        ? Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
        : null;
    return {
        period,
        totalRevenue: toDollars(totalRevenue),
        mrr: toDollars(mrr),
        arr: toDollars(arr),
        transactionCount: successfulCharges.length,
        averageTransactionValue: successfulCharges.length > 0
            ? toDollars(totalRevenue / successfulCharges.length)
            : 0,
        growthRate,
        currency: "usd",
    };
}
export async function getCustomerMetrics(stripe, period = "30d", limit = 10) {
    const { start, end } = periodToTimestamps(period);
    const customers = await stripe.customers.list({ limit: 100 });
    const newCustomers = customers.data.filter((c) => c.created >= start && c.created <= end);
    const customerSpending = new Map();
    const charges = await stripe.charges.list({
        limit: 100,
    });
    for (const charge of charges.data) {
        if (charge.status !== "succeeded")
            continue;
        const custId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
        if (!custId)
            continue;
        const existing = customerSpending.get(custId);
        if (existing) {
            existing.total += charge.amount;
            existing.count += 1;
        }
        else {
            customerSpending.set(custId, {
                email: charge.billing_details?.email || charge.receipt_email,
                total: charge.amount,
                count: 1,
            });
        }
    }
    const allSpending = Array.from(customerSpending.values());
    const totalSpent = allSpending.reduce((sum, c) => sum + c.total, 0);
    const avgLTV = allSpending.length > 0 ? totalSpent / allSpending.length : 0;
    const topCustomers = allSpending
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)
        .map((c) => ({
        email: c.email,
        totalSpent: toDollars(c.total),
        transactionCount: c.count,
    }));
    return {
        totalCustomers: customers.data.length,
        newCustomers: newCustomers.length,
        averageLTV: toDollars(avgLTV),
        topCustomers,
    };
}
export async function getProductPerformance(stripe, period = "30d") {
    const { start, end } = periodToTimestamps(period);
    const invoices = await stripe.invoices.list({
        created: { gte: start, lte: end },
        limit: 100,
        status: "paid",
    });
    const productMap = new Map();
    for (const invoice of invoices.data) {
        if (!invoice.lines?.data)
            continue;
        for (const line of invoice.lines.data) {
            const priceDetails = line.pricing?.price_details;
            const prodId = priceDetails?.product || "unknown";
            const prodName = line.description || prodId;
            const existing = productMap.get(prodId);
            if (existing) {
                existing.revenue += line.amount;
                existing.units += line.quantity || 1;
            }
            else {
                productMap.set(prodId, {
                    name: prodName,
                    revenue: line.amount,
                    units: line.quantity || 1,
                });
            }
        }
    }
    // Also check one-time charges via checkout sessions
    const sessions = await stripe.checkout.sessions.list({
        created: { gte: start, lte: end },
        limit: 100,
    });
    for (const session of sessions.data) {
        if (session.payment_status !== "paid")
            continue;
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
        for (const item of lineItems.data) {
            const prodId = typeof item.price?.product === "string"
                ? item.price.product
                : "unknown";
            const prodName = item.description || prodId;
            const existing = productMap.get(prodId);
            if (existing) {
                existing.revenue += item.amount_total;
                existing.units += item.quantity || 1;
            }
            else {
                productMap.set(prodId, {
                    name: prodName,
                    revenue: item.amount_total,
                    units: item.quantity || 1,
                });
            }
        }
    }
    const totalRevenue = Array.from(productMap.values()).reduce((sum, p) => sum + p.revenue, 0);
    const products = Array.from(productMap.entries())
        .map(([id, data]) => ({
        id,
        name: data.name,
        revenue: toDollars(data.revenue),
        unitsSold: data.units,
        averagePrice: data.units > 0 ? toDollars(data.revenue / data.units) : 0,
        revenueShare: totalRevenue > 0 ? Number(((data.revenue / totalRevenue) * 100).toFixed(1)) : 0,
    }))
        .sort((a, b) => b.revenue - a.revenue);
    return {
        products,
        totalRevenue: toDollars(totalRevenue),
    };
}
export async function getSubscriptionHealth(stripe) {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 86400;
    const activeSubs = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
    });
    const canceledSubs = await stripe.subscriptions.list({
        status: "canceled",
        limit: 100,
    });
    const recentCanceled = canceledSubs.data.filter((s) => s.canceled_at && s.canceled_at >= thirtyDaysAgo);
    const recentNew = activeSubs.data.filter((s) => s.created >= thirtyDaysAgo);
    let totalMrr = 0;
    const planMap = new Map();
    for (const sub of activeSubs.data) {
        for (const item of sub.items.data) {
            const amount = item.price.unit_amount || 0;
            let monthlyAmount = amount;
            if (item.price.recurring?.interval === "year") {
                monthlyAmount = Math.round(amount / 12);
            }
            else if (item.price.recurring?.interval === "week") {
                monthlyAmount = Math.round(amount * 4.33);
            }
            totalMrr += monthlyAmount;
            const planName = item.price.nickname || item.price.id;
            const existing = planMap.get(planName);
            if (existing) {
                existing.count += 1;
                existing.mrr += monthlyAmount;
            }
            else {
                planMap.set(planName, { name: planName, count: 1, mrr: monthlyAmount });
            }
        }
    }
    const totalAtStart = activeSubs.data.length + recentCanceled.length - recentNew.length;
    const churnRate = totalAtStart > 0
        ? Number(((recentCanceled.length / totalAtStart) * 100).toFixed(1))
        : 0;
    const arpu = activeSubs.data.length > 0
        ? toDollars(totalMrr / activeSubs.data.length)
        : 0;
    return {
        activeSubscriptions: activeSubs.data.length,
        canceledThisPeriod: recentCanceled.length,
        newThisPeriod: recentNew.length,
        churnRate,
        mrr: toDollars(totalMrr),
        arpu,
        plans: Array.from(planMap.values())
            .map((p) => ({ ...p, mrr: toDollars(p.mrr) }))
            .sort((a, b) => b.mrr - a.mrr),
    };
}
export async function getRecentTransactions(stripe, limit = 20) {
    const charges = await stripe.charges.list({ limit });
    return charges.data.map((c) => ({
        id: c.id,
        amount: toDollars(c.amount),
        status: c.status,
        customer: c.billing_details?.email || c.receipt_email || null,
        description: c.description,
        created: new Date(c.created * 1000).toISOString(),
        product: c.metadata?.product || null,
    }));
}
export async function getRefundAnalysis(stripe, period = "30d") {
    const { start, end } = periodToTimestamps(period);
    const refunds = await stripe.refunds.list({
        created: { gte: start, lte: end },
        limit: 100,
    });
    const charges = await stripe.charges.list({
        created: { gte: start, lte: end },
        limit: 100,
    });
    const successfulCharges = charges.data.filter((c) => c.status === "succeeded");
    const totalCharges = successfulCharges.length;
    const totalRefundAmount = refunds.data.reduce((sum, r) => sum + r.amount, 0);
    const refundRate = totalCharges > 0
        ? Number(((refunds.data.length / totalCharges) * 100).toFixed(1))
        : 0;
    const recentRefunds = refunds.data.slice(0, 10).map((r) => ({
        amount: toDollars(r.amount),
        reason: r.reason,
        date: new Date(r.created * 1000).toISOString(),
        product: r.metadata?.product || null,
    }));
    return {
        totalRefunds: refunds.data.length,
        refundAmount: toDollars(totalRefundAmount),
        refundRate,
        recentRefunds,
    };
}
export async function getRevenueForecast(stripe) {
    const now = Math.floor(Date.now() / 1000);
    // Get last 3 months of data for trending
    const months = [];
    for (let i = 2; i >= 0; i--) {
        const monthStart = now - (i + 1) * 30 * 86400;
        const monthEnd = now - i * 30 * 86400;
        const charges = await stripe.charges.list({
            created: { gte: monthStart, lte: monthEnd },
            limit: 100,
        });
        const revenue = charges.data
            .filter((c) => c.status === "succeeded")
            .reduce((sum, c) => sum + c.amount, 0);
        months.push(revenue);
    }
    const currentMrr = months[2] || 0;
    // Simple linear regression for trend
    let trend = "stable";
    let growthRate = 0;
    if (months[1] > 0) {
        growthRate = ((months[2] - months[1]) / months[1]) * 100;
        if (growthRate > 5)
            trend = "growing";
        else if (growthRate < -5)
            trend = "declining";
    }
    // Projected with trend continuation
    const projectedMonthly = currentMrr * (1 + growthRate / 100);
    const projectedAnnual = projectedMonthly * 12;
    // Confidence based on data points and consistency
    const variance = months.length > 1
        ? months.reduce((sum, m) => sum + Math.pow(m - currentMrr, 2), 0) / months.length
        : Infinity;
    const cv = currentMrr > 0 ? Math.sqrt(variance) / currentMrr : 1;
    let confidence = "medium";
    if (cv < 0.2 && months.every((m) => m > 0))
        confidence = "high";
    else if (cv > 0.5 || months.some((m) => m === 0))
        confidence = "low";
    return {
        currentMrr: toDollars(currentMrr),
        projectedMonthly: toDollars(projectedMonthly),
        projectedAnnual: toDollars(projectedAnnual),
        trend,
        growthRate: Number(growthRate.toFixed(1)),
        confidence,
    };
}
//# sourceMappingURL=analytics.js.map