const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Android icon sizes (in pixels for xxxhdpi, which is the base)
const sizes = {
  'mipmap-mdpi': 48,    // 0.75x
  'mipmap-hdpi': 72,    // 1.125x
  'mipmap-xhdpi': 96,   // 1.5x
  'mipmap-xxhdpi': 144, // 2.25x
  'mipmap-xxxhdpi': 192, // 3x
};

// Adaptive icon foreground sizes (safe zone is 108dp, but we render full icon)
const adaptiveSizes = {
  'mipmap-mdpi': 108,   // 0.75x = 81px
  'mipmap-hdpi': 162,   // 1.125x = 121.5px
  'mipmap-xhdpi': 216,  // 1.5x = 162px
  'mipmap-xxhdpi': 324, // 2.25x = 243px
  'mipmap-xxxhdpi': 432, // 3x = 324px
};

const svgPath = path.join(__dirname, '../brand-kit/logos/svg/icon-app.svg');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Read SVG
const svgContent = fs.readFileSync(svgPath, 'utf-8');

// Generate regular launcher icons
Object.entries(sizes).forEach(([folder, size]) => {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  const outputDir = path.join(androidResPath, folder);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write ic_launcher.png
  fs.writeFileSync(path.join(outputDir, 'ic_launcher.png'), pngBuffer);
  // Write ic_launcher_round.png (same as regular)
  fs.writeFileSync(path.join(outputDir, 'ic_launcher_round.png'), pngBuffer);
  
  console.log(`✓ Generated ${folder}/ic_launcher.png (${size}x${size})`);
});

// Generate adaptive icon foregrounds
Object.entries(adaptiveSizes).forEach(([folder, size]) => {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  const outputDir = path.join(androidResPath, folder);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write ic_launcher_foreground.png
  fs.writeFileSync(path.join(outputDir, 'ic_launcher_foreground.png'), pngBuffer);
  
  console.log(`✓ Generated ${folder}/ic_launcher_foreground.png (${size}x${size})`);
});

// Update background color to match brand kit (#101622)
const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#101622</color>
</resources>`;

fs.writeFileSync(
  path.join(androidResPath, 'values/ic_launcher_background.xml'),
  backgroundXml
);

// Also update drawable version
const drawableBackgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#101622" />
</shape>`;

fs.writeFileSync(
  path.join(androidResPath, 'drawable/ic_launcher_background.xml'),
  drawableBackgroundXml
);

console.log('✓ Updated launcher background color to #101622');
console.log('\n✅ All Android icons generated successfully!');
