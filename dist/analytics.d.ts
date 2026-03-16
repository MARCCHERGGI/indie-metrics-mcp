import Stripe from "stripe";
export interface RevenueSummary {
    period: string;
    totalRevenue: number;
    mrr: number;
    arr: number;
    transactionCount: number;
    averageTransactionValue: number;
    growthRate: number | null;
    currency: string;
}
export interface CustomerMetrics {
    totalCustomers: number;
    newCustomers: number;
    averageLTV: number;
    topCustomers: Array<{
        email: string | null;
        totalSpent: number;
        transactionCount: number;
    }>;
}
export interface ProductPerformance {
    products: Array<{
        id: string;
        name: string;
        revenue: number;
        unitsSold: number;
        averagePrice: number;
        revenueShare: number;
    }>;
    totalRevenue: number;
}
export interface SubscriptionHealth {
    activeSubscriptions: number;
    canceledThisPeriod: number;
    newThisPeriod: number;
    churnRate: number;
    mrr: number;
    arpu: number;
    plans: Array<{
        name: string;
        count: number;
        mrr: number;
    }>;
}
export interface RefundAnalysis {
    totalRefunds: number;
    refundAmount: number;
    refundRate: number;
    recentRefunds: Array<{
        amount: number;
        reason: string | null;
        date: string;
        product: string | null;
    }>;
}
export interface RevenueForecast {
    currentMrr: number;
    projectedMonthly: number;
    projectedAnnual: number;
    trend: "growing" | "stable" | "declining";
    growthRate: number;
    confidence: "high" | "medium" | "low";
}
export declare function getRevenueSummary(stripe: Stripe, period?: string): Promise<RevenueSummary>;
export declare function getCustomerMetrics(stripe: Stripe, period?: string, limit?: number): Promise<CustomerMetrics>;
export declare function getProductPerformance(stripe: Stripe, period?: string): Promise<ProductPerformance>;
export declare function getSubscriptionHealth(stripe: Stripe): Promise<SubscriptionHealth>;
export declare function getRecentTransactions(stripe: Stripe, limit?: number): Promise<Array<{
    id: string;
    amount: number;
    status: string;
    customer: string | null;
    description: string | null;
    created: string;
    product: string | null;
}>>;
export declare function getRefundAnalysis(stripe: Stripe, period?: string): Promise<RefundAnalysis>;
export declare function getRevenueForecast(stripe: Stripe): Promise<RevenueForecast>;
