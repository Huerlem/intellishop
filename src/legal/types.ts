export type LegalDocumentSlug =
  | 'privacy'
  | 'terms'
  | 'ai'
  | 'food-safety'
  | 'subscriptions'
  | 'pricing-data'
  | 'account-deletion'
  | 'acceptable-use'
  | 'support'
  | 'legal/changes';

export type LegalDocument = {
  slug: string;
  title: string;
  version: string;
  status: string;
  effective: string;
  lastUpdated: string;
  markdown: string;
};
