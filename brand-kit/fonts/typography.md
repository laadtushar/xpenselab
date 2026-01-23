# XpenseLab Typography Guide

## Primary Font Family

### Manrope
- **Source**: Google Fonts
- **Weights**: 200-800 (variable)
- **Style**: Sans-serif
- **Usage**: All UI elements, headings, body text, logo text

### Font Loading
```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet"/>
```

### CSS Implementation
```css
font-family: 'Manrope', sans-serif;
```

## Logo Typography

### Specifications
- **Font**: Manrope
- **Weight**: 700 (Bold)
- **Style**: Lowercase
- **Letter Spacing**: -0.033em (tight)
- **Example**: `xpenselab`

### CSS
```css
.logo-text {
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  text-transform: lowercase;
  letter-spacing: -0.033em;
}
```

## Typography Scale

### Headings
- **H1**: 3xl-5xl (48-80px), Bold, -0.033em tracking
- **H2**: 2xl-4xl (32-64px), Bold, -0.033em tracking
- **H3**: xl-2xl (24-32px), Bold
- **H4**: lg-xl (20-24px), Semibold

### Body Text
- **Large**: lg (18px), Normal
- **Base**: base (16px), Normal
- **Small**: sm (14px), Normal
- **XSmall**: xs (12px), Normal

### UI Elements
- **Buttons**: Base-Large, Bold
- **Labels**: Small, Medium
- **Captions**: XSmall, Normal

## Usage Guidelines

### Do's
✅ Use Manrope for all text
✅ Maintain consistent letter spacing for logo
✅ Use lowercase for brand name
✅ Follow the typography scale

### Don'ts
❌ Don't use other fonts for brand elements
❌ Don't capitalize brand name (except start of sentences)
❌ Don't use excessive letter spacing
❌ Don't mix font families
