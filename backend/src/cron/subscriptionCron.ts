import Subscription from "../models/Subscription";
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from "../config/constants";

/**
 * Transitions subscriptions that have expired their current period into PAST_DUE
 * and sets their grace period.
 */
const processPastDueTransitions = async (now: Date) => {
  const expiredActiveSubscriptions = await Subscription.find({
    status: "ACTIVE",
    currentPeriodEnd: { $lte: now }
  });

  for (const sub of expiredActiveSubscriptions) {
    try {
      const graceEnd = new Date(sub.currentPeriodEnd!);
      graceEnd.setDate(graceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

      sub.status = "PAST_DUE";
      sub.gracePeriodEnd = graceEnd;
      await sub.save();
      console.log(`[SubscriptionCron] Transitioned ${sub._id} to PAST_DUE. Grace ends: ${graceEnd.toISOString()}`);
    } catch (err) {
      console.error(`[SubscriptionCron] Error transitioning ${sub._id} to PAST_DUE:`, err);
    }
  }
};

/**
 * Transitions PAST_DUE subscriptions into EXPIRED if their grace period has ended.
 */
const processExpiredTransitions = async (now: Date) => {
  const expiredGraceSubscriptions = await Subscription.find({
    status: "PAST_DUE",
    gracePeriodEnd: { $lte: now }
  });

  for (const sub of expiredGraceSubscriptions) {
    try {
      sub.status = "EXPIRED";
      await sub.save();
      console.log(`[SubscriptionCron] Transitioned ${sub._id} to EXPIRED.`);
    } catch (err) {
      console.error(`[SubscriptionCron] Error transitioning ${sub._id} to EXPIRED:`, err);
    }
  }
};

/**
 * Sends a notification 7 days before the subscription expires.
 */
const processUpcomingExpirations = async (now: Date) => {
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const upcomingSubscriptions = await Subscription.find({
    status: { $in: ["ACTIVE", "TRIAL"] },
    currentPeriodEnd: { $gte: sevenDaysFromNow, $lt: eightDaysFromNow }
  });

  if (upcomingSubscriptions.length === 0) return;

  const { NotificationService } = await import("../services/notificationService");
  const Notification = (await import("../models/Notification")).default;

  for (const sub of upcomingSubscriptions) {
    try {
      // Check if we already sent a reminder in the last 24h
      const recentlySent = await Notification.exists({
        restaurantId: sub.restaurantId,
        type: "SUBSCRIPTION_EXPIRING_7_DAYS",
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      });

      if (!recentlySent) {
        await NotificationService.createForRestaurant(
          sub.restaurantId.toString(),
          "SUBSCRIPTION_EXPIRING_7_DAYS",
          "Subscription Expiring Soon",
          "Your subscription will expire in 7 days. Please ensure your payment method is up to date to avoid service interruption.",
          "GENERAL"
        );
        console.log(`[SubscriptionCron] Sent 7-day expiration reminder for restaurant ${sub.restaurantId}`);
      }
    } catch (err) {
      console.error(`[SubscriptionCron] Error sending reminder for ${sub.restaurantId}:`, err);
    }
  }
};

/**
 * Main cron function to evaluate subscription states.
 * Designed to be idempotent.
 */
export const runSubscriptionLifecycleJob = async () => {
  try {
    const now = new Date();
    await processPastDueTransitions(now);
    await processExpiredTransitions(now);
    await processUpcomingExpirations(now);
  } catch (error) {
    console.error("[SubscriptionCron] Top-level error:", error);
  }
};
