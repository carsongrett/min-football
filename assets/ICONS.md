# PWA Icons

This directory needs two icon files for PWA support:

## Required Files

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## Quick Creation Options

### Option 1: Online Generator
Use a service like [RealFaviconGenerator](https://realfavicongenerator.net/) or [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)

### Option 2: Simple SVG Conversion
Create a simple SVG first, then convert to PNG:

```svg
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1a1a1a"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="200" fill="#fff" text-anchor="middle" font-weight="bold">5MF</text>
</svg>
```

Then use an online converter or ImageMagick:
```bash
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
```

### Option 3: Use existing logo
If you have a logo file, resize it to these dimensions.

## Testing

After adding icons, check in DevTools > Application > Manifest to ensure they load correctly.


