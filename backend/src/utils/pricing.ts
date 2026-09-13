export const SUBSCRIPTION_PRICING: Record<string, { MONTHLY: number; ANNUALLY: number }> = {
  starter: {
    MONTHLY: 500,
    ANNUALLY: 5000, // Discounted
  },
  pro: {
    MONTHLY: 1000,
    ANNUALLY: 10000,
  },
  enterprise: {
    MONTHLY: 2500,
    ANNUALLY: 25000,
  }
};

export const getSubscriptionPrice = (plan: string, billingCycle: "MONTHLY" | "ANNUALLY"): number => {
  const planPricing = SUBSCRIPTION_PRICING[plan];
  if (!planPricing) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  return planPricing[billingCycle];
};
