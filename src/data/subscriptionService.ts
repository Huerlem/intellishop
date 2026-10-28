/**
 * Subscription purchases (Apple In-App Purchase via RevenueCat) — client interface.
 *
 * Status: the RevenueCat SDK (`react-native-purchases`) is NOT installed yet. Adding it, creating
 * App Store products and enabling purchases are owner checkpoints (no live Apple products without
 * App Store Connect configuration and approval). Until then the app uses
 * `UnavailableSubscriptionService`, which reports that purchases are not available and never
 * pretends a purchase succeeded.
 *
 * The plan shown in the app always comes from the server-written `entitlements/{uid}` document
 * (resolved from verified store events), never from this client.
 */
import { Linking } from 'react-native';

import type { PlanId } from '@/shared/entitlements/plans';

export type PlanOffer = {
  plan: Exclude<PlanId, 'free'>;
  productId: string;
  /** Localised price string from StoreKit (currency symbol and amount). Never hard-coded. */
  priceString: string;
  period: 'month';
};

export type PurchaseOutcome =
  | { status: 'purchased' } // the server entitlement update follows asynchronously
  | { status: 'cancelled' }
  | { status: 'pending' } // e.g. Ask to Buy
  | { status: 'failed'; message: string }
  | { status: 'unavailable'; message: string };

export type RestoreOutcome = { status: 'restored' } | { status: 'nothing_to_restore' } | { status: 'failed'; message: string } | { status: 'unavailable'; message: string };

export interface SubscriptionService {
  readonly available: boolean;
  /** Links purchases to the Firebase UID (RevenueCat app user ID = UID). */
  identify(uid: string): Promise<void>;
  reset(): Promise<void>;
  getOffers(): Promise<PlanOffer[]>;
  purchase(offer: PlanOffer): Promise<PurchaseOutcome>;
  restore(): Promise<RestoreOutcome>;
  /** Opens Apple's subscription management (App Store). Works without RevenueCat. */
  manageSubscriptions(): Promise<void>;
  /** Opens Apple's refund request route. Works without RevenueCat. */
  requestRefund(): Promise<void>;
}

/** Apple's documented URLs (developer.apple.com, "Offering account deletion in your app"). */
export const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
export const APPLE_REFUND_HELP_URL = 'https://support.apple.com/118223';

const NOT_AVAILABLE = 'Subscriptions are not available in this version of IntelliShop yet.';

export class UnavailableSubscriptionService implements SubscriptionService {
  readonly available = false;
  async identify(): Promise<void> {}
  async reset(): Promise<void> {}
  async getOffers(): Promise<PlanOffer[]> {
    return [];
  }
  async purchase(): Promise<PurchaseOutcome> {
    return { status: 'unavailable', message: NOT_AVAILABLE };
  }
  async restore(): Promise<RestoreOutcome> {
    return { status: 'unavailable', message: NOT_AVAILABLE };
  }
  async manageSubscriptions(): Promise<void> {
    await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
  }
  async requestRefund(): Promise<void> {
    await Linking.openURL(APPLE_REFUND_HELP_URL);
  }
}

let service: SubscriptionService = new UnavailableSubscriptionService();

export function getSubscriptionService(): SubscriptionService {
  return service;
}

/** Replaced by the RevenueCat implementation at the subscription milestone (M6). */
export function setSubscriptionService(next: SubscriptionService) {
  service = next;
}
