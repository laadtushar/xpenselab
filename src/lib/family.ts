/**
 * The LabyNator family: the studio, the founder and the sibling apps.
 *
 * Source of truth: labynator `src/lib/apps.ts` (laadtushar/labynator). Names,
 * blurbs and order come from there; the URLs are the final hosts each site
 * actually serves from (after redirects). Change the list here and the footer
 * block and the JSON-LD both follow, so no second copy goes stale.
 */

export type FamilyAppId = 'memrylab' | 'xpenselab' | 'hyredlab' | 'edytlab';

export interface FamilyApp {
  id: FamilyAppId;
  name: string;
  /** One short line for the footer list (labynator `blurb`). */
  blurb: string;
  /** Canonical URL: the host the site serves from, never a redirecting one. */
  url: string;
}

/** The app this repo is. It is left out of the footer list. */
export const CURRENT_APP_ID: FamilyAppId = 'xpenselab';

export const FAMILY_STUDIO = {
  name: 'LabyNator',
  url: 'https://www.labynator.com',
} as const;

export const FAMILY_FOUNDER = {
  name: 'Tushar Laad',
  url: 'https://www.tusharlaad.com',
} as const;

/** Order matters: MemryLab, XpenseLab, HyredLab, edytlab. */
export const FAMILY_APPS: readonly FamilyApp[] = [
  { id: 'memrylab', name: 'MemryLab', blurb: 'Local AI Memory', url: 'https://www.memrylab.com' },
  { id: 'xpenselab', name: 'XpenseLab', blurb: 'Expense tracking', url: 'https://xpenselab.com' },
  { id: 'hyredlab', name: 'HyredLab', blurb: 'Job tracking', url: 'https://www.hyredlab.com' },
  { id: 'edytlab', name: 'edytlab', blurb: 'AI audio editor', url: 'https://www.edytlab.com' },
];

/** The sibling apps shown in the footer: every app except this one. */
export const FAMILY_SIBLINGS: readonly FamilyApp[] = FAMILY_APPS.filter(
  (app) => app.id !== CURRENT_APP_ID,
);
