/**
 * In-app legal document (privacy policy, terms, AI transparency, …). Reachable signed out
 * (registration) and signed in (Profile › Legal & Privacy). Drafts are labelled as drafts.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LegalMarkdown } from '@/src/components/legal/LegalMarkdown';
import { LEGAL_DOCUMENTS } from '@/src/legal/documents.generated';
import { routeTo } from '@/src/navigation/routes';
import { Alert, AppText, EmptyState, Header, IconButton, Screen } from '@/src/ui';

export function findLegalDocument(slug: string | string[] | undefined) {
  const key = Array.isArray(slug) ? slug.join('/') : (slug ?? '');
  return LEGAL_DOCUMENTS.find((d) => d.slug === key) ?? null;
}

export default function LegalDocumentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string | string[] }>();
  const router = useRouter();
  const doc = findLegalDocument(slug);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Screen testID="legal-document-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title={doc?.title ?? 'Document'} titleVariant="h3" />}>
      {!doc ? (
        <EmptyState title="Document not found" />
      ) : (
        <>
          {doc.status.toUpperCase().startsWith('DRAFT') ? <Alert tone="warning" title="Draft — not yet in force" detail={`Version ${doc.version}. This document is still being reviewed and may change before release.`} testID="legal-draft-banner" /> : null}
          <AppText variant="caption" tone="muted">
            Version {doc.version} · Last updated {doc.lastUpdated}
          </AppText>
          <LegalMarkdown markdown={doc.markdown} onInternalLink={(s) => router.push(routeTo.legal(s))} />
        </>
      )}
    </Screen>
  );
}
