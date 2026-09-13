export type SubscriptionPlan = "free_trial" | "starter" | "pro" | "enterprise";

export type Capability =
  | "ORDERS_500_LIMIT"
  | "ORDERS_1000_LIMIT"
  | "ORDERS_UNLIMITED"
  | "BASIC_ANALYTICS"
  | "ADVANCED_ANALYTICS"
  | "QR_CODE_MENU"
  | "CUSTOM_THEME"
  | "CUSTOMER_DATABASE"
  | "API_ACCESS"
  | "MULTI_LOCATION"
  | "CUSTOM_INTEGRATIONS";

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, Capability[]> = {
  free_trial: ["ORDERS_UNLIMITED", "BASIC_ANALYTICS", "QR_CODE_MENU", "CUSTOM_THEME"],
  starter: ["ORDERS_500_LIMIT", "BASIC_ANALYTICS", "QR_CODE_MENU"],
  pro: ["ORDERS_1000_LIMIT", "BASIC_ANALYTICS", "ADVANCED_ANALYTICS", "QR_CODE_MENU", "CUSTOM_THEME", "CUSTOMER_DATABASE"],
  enterprise: ["ORDERS_UNLIMITED", "BASIC_ANALYTICS", "ADVANCED_ANALYTICS", "QR_CODE_MENU", "CUSTOM_THEME", "CUSTOMER_DATABASE", "API_ACCESS", "MULTI_LOCATION", "CUSTOM_INTEGRATIONS"],
};

export class EntitlementService {
  /**
   * Check if a specific plan has a given capability
   */
  public static hasEntitlement(plan: SubscriptionPlan | string | undefined, capability: Capability): boolean {
    if (!plan) return false;
    
    // Fallback to starter if unknown
    const normalizedPlan = plan.toLowerCase() as SubscriptionPlan;
    const capabilities = PLAN_ENTITLEMENTS[normalizedPlan] || PLAN_ENTITLEMENTS["starter"];
    
    return capabilities.includes(capability);
  }

  /**
   * Return a unified structure for the frontend
   */
  public static getFrontendEntitlements(plan: SubscriptionPlan | string | undefined) {
    if (!plan) return null;
    
    const normalizedPlan = plan.toLowerCase() as SubscriptionPlan;
    
    return {
      ordersMonthlyLimit: this.hasEntitlement(normalizedPlan, "ORDERS_UNLIMITED")
        ? 999999999
        : (this.hasEntitlement(normalizedPlan, "ORDERS_1000_LIMIT")
          ? 1000
          : (this.hasEntitlement(normalizedPlan, "ORDERS_500_LIMIT") ? 500 : 0)),
      customTheme: this.hasEntitlement(normalizedPlan, "CUSTOM_THEME"),
      advancedAnalytics: this.hasEntitlement(normalizedPlan, "ADVANCED_ANALYTICS"),
      customerDatabase: this.hasEntitlement(normalizedPlan, "CUSTOMER_DATABASE"),
      apiAccess: this.hasEntitlement(normalizedPlan, "API_ACCESS"),
      multiLocation: this.hasEntitlement(normalizedPlan, "MULTI_LOCATION"),
      customIntegrations: this.hasEntitlement(normalizedPlan, "CUSTOM_INTEGRATIONS"),
    };
  }
}
