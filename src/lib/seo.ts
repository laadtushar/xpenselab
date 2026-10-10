import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

/** The home page title (about 55 characters): the brand, then what it is. */
export const HOME_TITLE = 'XpenseLab | Free Expense Tracker & Personal Finance App';

/**
 * Absolute canonical URL for a path on this site. "/" gives the bare apex
 * (https://xpenselab.com), which is what the canonical, og:url, the sitemap
 * and the JSON-LD all use, so they never disagree.
 */
export function absoluteUrl(path: string = '/'): string {
  if (path === '/' || path === '') return siteConfig.siteUrl;
  return `${siteConfig.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

// The 1200x630 preview served by app/opengraph-image.tsx and app/twitter-image.tsx.
// A page that sets its own openGraph/twitter loses the file-based images, so
// they are named here explicitly.
const OG_IMAGE_URL = absoluteUrl('/opengraph-image');
const TWITTER_IMAGE_URL = absoluteUrl('/twitter-image');
const OG_IMAGE_ALT = `${siteConfig.name}: ${siteConfig.tagline}`;

interface PageMetadataInput {
  /** The full <title>, used as written (no template is appended). */
  title: string;
  /** Meta description, roughly 140-160 characters. */
  description: string;
  /** Path of this page, e.g. "/privacy". Gives the self-referencing canonical and og:url. */
  path: string;
  /** Public but not for the index (for example the sign-in page). */
  noindex?: boolean;
}

/**
 * Per-page metadata. Next replaces (not merges) the `openGraph` and `twitter`
 * objects of a parent layout, so a page that sets its own must repeat the
 * whole set. This builds the full set so every page gets a unique title and
 * description, its own canonical and a matching og:url.
 */
export function pageMetadata({ title, description, path, noindex = false }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: TWITTER_IMAGE_URL, alt: OG_IMAGE_ALT }],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Escape "<" so JSON-LD can never close its own <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
