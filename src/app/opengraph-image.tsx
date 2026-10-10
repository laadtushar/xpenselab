import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { siteConfig } from '@/config/site';

// The social preview for every page that does not set its own: 1200x630 PNG,
// drawn from the brand mark and colours in public/og-image.svg. Nothing here
// is dynamic, so Next renders it once at build time.
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Geist Bold (the font the site is set in) ships inside the `geist` package.
// If it cannot be read for any reason, fall back to the built-in font rather
// than fail the build.
async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const file = path.join(
      process.cwd(),
      'node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf',
    );
    const buf = await readFile(file);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export default async function Image() {
  const font = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #101622 0%, #182234 50%, #101622 100%)',
          fontFamily: font ? 'Geist' : undefined,
          color: '#ffffff',
        }}
      >
        <svg width="120" height="120" viewBox="-100 -100 200 200">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#0d59f2" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect x="-8" y="-80" width="16" height="160" rx="8" fill="url(#g1)" transform="rotate(35)" />
          <rect x="-8" y="-64" width="16" height="128" rx="8" fill="url(#g2)" transform="rotate(-35)" opacity="0.9" />
        </svg>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 96, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {siteConfig.name}
        </div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 40, color: '#90a4cb' }}>
          {siteConfig.tagline}
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 28, color: '#90a4cb', opacity: 0.85 }}>
          Free to start • Premium AI insights
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'Geist', data: font, weight: 700, style: 'normal' }] : undefined,
    },
  );
}
