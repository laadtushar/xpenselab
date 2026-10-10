import { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

// Every route under src/app/(app) is the signed-in product (each also carries
// noindex), and /api serves the app. Keep this list in step with that folder.
const PRIVATE_PATHS = [
  '/api/',
  '/dashboard',
  '/expenses',
  '/income',
  '/budget',
  '/categories',
  '/recurring',
  '/loans',
  '/debts',
  '/splits',
  '/reports',
  '/forecast',
  '/insights',
  '/wellness',
  '/scan-receipt',
  '/integrations',
  '/settings',
  '/pricing',
  '/checkout',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // /login stays crawlable so crawlers can read its noindex.
        allow: ['/', '/login', '/privacy'],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
