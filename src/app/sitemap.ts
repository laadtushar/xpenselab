import { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

// Public, indexable pages only, with the same absolute canonical URLs the
// pages declare. Not listed on purpose: /login (noindex), the signed-in app
// and /api. No lastModified: the repo has no per-page dates to cite, and a
// build-time "now" would claim every page changed on every deploy.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/') },
    { url: absoluteUrl('/privacy') },
  ];
}
