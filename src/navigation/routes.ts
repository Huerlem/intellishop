/**
 * Route paths used for navigation. Route groups such as (app), (tabs) and (public)
 * do not appear in URLs.
 *
 * Permanent navigation (Figma V2): Home | Lists | Pantry. Everything else is contextual:
 * Profile (avatar), List Detail, Add Items, Optimisation, Shopping Mode, Finish, Pantry Update,
 * Recipes, Plans and legal documents are stack screens, never tabs.
 */
export const ROUTES = {
  home: '/',
  lists: '/lists',
  pantry: '/pantry',
  pantryAll: '/pantry-items',
  profile: '/profile',
  recipes: '/recipes',
  plans: '/plans',
  aiConsent: '/ai-consent',
  dietary: '/dietary',
  deleteAccount: '/delete-account',
  welcome: '/WelcomeScreen',
  login: '/LoginScreen',
  register: '/RegisterScreen',
  forgotPassword: '/forgot-password',
} as const;

export const routeTo = {
  list: (listId: string) => `/list/${encodeURIComponent(listId)}` as const,
  addItems: (listId: string) => `/list/${encodeURIComponent(listId)}/add` as const,
  optimise: (listId: string) => `/list/${encodeURIComponent(listId)}/optimise` as const,
  shopping: (tripId: string) => `/shop/${encodeURIComponent(tripId)}` as const,
  finish: (tripId: string) => `/shop/${encodeURIComponent(tripId)}/finish` as const,
  pantryUpdate: (tripId: string) => `/shop/${encodeURIComponent(tripId)}/pantry-update` as const,
  legal: (slug: string) => `/legal/${slug.split('/').map(encodeURIComponent).join('/')}` as const,
};

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** The only permanent tabs allowed by the approved IA. Order matters. */
export const PERMANENT_TABS = [
  { name: 'index', title: 'Home' },
  { name: 'lists', title: 'Lists' },
  { name: 'pantry', title: 'Pantry' },
] as const;
