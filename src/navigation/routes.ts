/**
 * Route paths used for navigation. Route groups such as (app), (tabs) and (public)
 * do not appear in URLs.
 *
 * Permanent navigation (Figma V2): Home | Lists | Pantry. Profile is contextual (avatar).
 */
export const ROUTES = {
  home: '/',
  lists: '/lists',
  pantry: '/pantry',
  profile: '/profile',
  welcome: '/WelcomeScreen',
  login: '/LoginScreen',
  register: '/RegisterScreen',
  forgotPassword: '/forgot-password',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** The only permanent tabs allowed by the approved IA. Order matters. */
export const PERMANENT_TABS = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'lists', title: 'Lists', icon: 'list' },
  { name: 'pantry', title: 'Pantry', icon: 'cube' },
] as const;
