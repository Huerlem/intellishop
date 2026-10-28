/**
 * Plans / paywall (decision record: Free 2/20/30 + 3 introductory AI generations; Standard
 * removes limits, no AI; Premium adds AI recipes within fair use). Prices come only from the
 * App Store (StoreKit via RevenueCat) — never hard-coded. Until purchases are configured
 * (owner checkpoint, M6) the screen says so and offers no purchase button.
 * Only features that exist are listed (no optimisation or price lookup).
 */
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { INTRODUCTORY_AI_CREDITS, PLAN_LIMITS, PREMIUM_AI_QUOTA, type PlanId } from '@/shared/entitlements/plans';
import { getSubscriptionService, type PlanOffer } from '@/src/data/subscriptionService';
import { PLAN_NAMES } from '@/src/features/presenters';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { usePlan } from '@/src/state/hooks';
import { Alert, AppText, Badge, Button, Card, Header, IconButton, Screen } from '@/src/ui';

export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    `Up to ${PLAN_LIMITS.free.activeLists} active lists`,
    `Up to ${PLAN_LIMITS.free.itemsPerList} items per list`,
    `Up to ${PLAN_LIMITS.free.pantryItems} Pantry items`,
    'Shopping Mode and Pantry updates',
    `${INTRODUCTORY_AI_CREDITS} free AI recipe generations (verified email)`,
  ],
  standard: ['Unlimited lists, items and Pantry items', 'Shopping Mode and Pantry updates', 'Keeps any unused free AI recipe generations', 'No AI features'],
  premium: ['Everything in Standard', `AI recipe ideas — up to ${PREMIUM_AI_QUOTA.perMonth} a month, ${PREMIUM_AI_QUOTA.perHour} an hour (fair use)`, 'Allergen and diet checks on suggestions'],
};

export default function PlansScreen() {
  const router = useRouter();
  const { plan, status } = usePlan();
  const service = getSubscriptionService();
  const [offers, setOffers] = useState<PlanOffer[] | null>(null);
  const [notice, setNotice] = useState<{ tone: 'info' | 'error' | 'success'; title: string; detail?: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.profile));

  useEffect(() => {
    let live = true;
    service
      .getOffers()
      .then((o) => live && setOffers(o))
      .catch(() => live && setOffers([]));
    return () => {
      live = false;
    };
  }, [service]);

  const buy = async (offer: PlanOffer) => {
    setBusy(offer.productId);
    setNotice(null);
    const r = await service.purchase(offer);
    setBusy(null);
    if (r.status === 'purchased') setNotice({ tone: 'success', title: 'Thank you', detail: 'Your plan will update in a moment.' });
    else if (r.status === 'pending') setNotice({ tone: 'info', title: 'Purchase pending', detail: 'It will complete once approved.' });
    else if (r.status === 'failed' || r.status === 'unavailable') setNotice({ tone: 'error', title: 'Purchase not completed', detail: r.message });
  };

  return (
    <Screen testID="plans-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Plans" />}>
      {!service.available || (offers !== null && offers.length === 0) ? (
        <Alert tone="info" title="Subscriptions aren't available yet" detail="You can use IntelliShop on the Free plan. Paid plans will appear here when they launch." testID="plans-unavailable" />
      ) : null}
      {notice ? <Alert tone={notice.tone} title={notice.title} detail={notice.detail} /> : null}
      {(['free', 'standard', 'premium'] as const).map((p) => {
        const offer = offers?.find((o) => o.plan === p);
        const current = plan === p;
        return (
          <Card key={p} accent={current ? 'primary' : undefined} testID={`plan-card-${p}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <AppText variant="h3">{PLAN_NAMES[p]}</AppText>
              {current ? <Badge label={status === 'cancelled_active' ? 'Current · ends soon' : 'Current plan'} tone="success" /> : null}
            </View>
            {offer ? <AppText variant="label">{offer.priceString} a month, renews monthly until cancelled</AppText> : null}
            {PLAN_FEATURES[p].map((f) => (
              <AppText key={f} variant="bodySmall" tone="secondary">
                • {f}
              </AppText>
            ))}
            {offer && !current ? <Button title={`Subscribe to ${PLAN_NAMES[p]}`} onPress={() => buy(offer)} loading={busy === offer.productId} style={{ marginTop: 8 }} /> : null}
          </Card>
        );
      })}
      <Button
        title="Restore purchases"
        variant="secondary"
        loading={busy === 'restore'}
        onPress={async () => {
          setBusy('restore');
          const r = await service.restore();
          setBusy(null);
          setNotice(r.status === 'restored' ? { tone: 'success', title: 'Purchases restored' } : r.status === 'nothing_to_restore' ? { tone: 'info', title: 'No purchases to restore' } : { tone: 'info', title: 'Restore is not available', detail: r.message });
        }}
      />
      <AppText variant="caption" tone="muted">
        Subscriptions are billed by Apple to your Apple Account and renew automatically unless cancelled at least 24 hours before the end of the period. Manage or cancel in your App Store account settings.
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Button title="Subscription Terms" variant="tertiary" compact onPress={() => router.push(routeTo.legal('subscriptions'))} />
        <Button title="Terms" variant="tertiary" compact onPress={() => router.push(routeTo.legal('terms'))} />
        <Button title="Privacy" variant="tertiary" compact onPress={() => router.push(routeTo.legal('privacy'))} />
      </View>
    </Screen>
  );
}
