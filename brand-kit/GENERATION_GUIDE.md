# Brand Kit Generation Guide

This guide explains how to generate PNG versions and other formats from the SVG logos.

## Prerequisites

- Node.js and npm installed
- ImageMagick or similar tool for conversion
- Or use online SVG to PNG converters

## Generating PNG Files

### Method 1: Using ImageMagick (Command Line)

```bash
# Install ImageMagick (if not installed)
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: Download from https://imagemagick.org/

# Generate PNG from SVG
# Example: Generate 512x512 PNG
magick -background none -density 300 logo-primary-stacked.svg -resize 512x512 logo-primary-stacked-512.png

# Generate multiple sizes
for size in 16 32 64 128 256 512; do
  magick -background none -density 300 logo-primary-stacked.svg -resize ${size}x${size} logo-primary-stacked-${size}.png
done
```

### Method 2: Using Online Tools

1. Visit https://cloudconvert.com/svg-to-png
2. Upload SVG file
3. Set desired dimensions
4. Download PNG

### Method 3: Using Node.js Script

Create `generate-pngs.js`:

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 64, 128, 256, 512, 1024];
const svgDir = path.join(__dirname, 'logos', 'svg');
const pngDir = path.join(__dirname, 'logos', 'png');

// Create PNG directories
const logos = ['logo-primary-stacked', 'logo-primary-light', 'logo-monochrome-dark', 'logo-monochrome-light', 'logo-horizontal', 'icon-app'];
logos.forEach(logo => {
  const dir = path.join(pngDir, logo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Generate PNGs (requires ImageMagick)
logos.forEach(logo => {
  const svgPath = path.join(svgDir, `${logo}.svg`);
  sizes.forEach(size => {
    const outputPath = path.join(pngDir, logo, `${logo}-${size}.png`);
    try {
      execSync(`magick -background none -density 300 "${svgPath}" -resize ${size}x${size} "${outputPath}"`);
      console.log(`Generated ${outputPath}`);
    } catch (error) {
      console.error(`Error generating ${outputPath}:`, error.message);
    }
  });
});
```

## Generating Favicon

### From App Icon SVG

```bash
# Generate ICO file (requires ImageMagick)
magick icon-app.svg -define icon:auto-resize=16,32,48 favicon.ico

# Or generate individual sizes
magick icon-app.svg -resize 16x16 favicon-16.png
magick icon-app.svg -resize 32x32 favicon-32.png
magick icon-app.svg -resize 48x48 favicon-48.png
```

## Recommended PNG Sizes

### Logo Variations
- **Web**: 200px, 400px, 800px
- **Print**: 1200px, 2400px (300 DPI)
- **Social Media**: 1200x630px (Open Graph)

### App Icon
- **iOS**: 1024x1024px
- **Android**: 512x512px
- **Favicon**: 16x16, 32x32, 48x48px

## File Naming Convention

```
{logo-name}-{size}.png
Example: logo-primary-stacked-512.png
```

## Quality Settings

- **Web**: 72-96 DPI
- **Print**: 300 DPI
- **High-res displays**: 2x resolution (e.g., 512px for 256px display)
