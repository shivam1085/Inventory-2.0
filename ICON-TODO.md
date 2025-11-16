# Icon Generation TODO

## Current Status
- Using temporary logooo.PNG placeholder
- Need proper icon assets for production

## Required Icons

### For Electron Desktop App (Windows)
- **icon.ico** - Multi-resolution .ico file containing:
  - 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 sizes
  - Place in `icons/icon.ico`

### For PWA (Progressive Web App)
- **icon-192.png** - 192x192 PNG
- **icon-512.png** - 512x512 PNG
- Place in `icons/` directory

## How to Generate

### Option 1: Online Converter
1. Create a 512x512 PNG logo with transparent background
2. Use https://www.icoconverter.com/ to convert to .ico
3. Download and save as `icons/icon.ico`
4. Export 192x192 and 512x512 versions as PNG

### Option 2: ImageMagick (Command Line)
```bash
# Install ImageMagick first
magick convert logooo.PNG -resize 512x512 icon-512.png
magick convert logooo.PNG -resize 192x192 icon-192.png
magick convert logooo.PNG -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Option 3: GIMP (Free Software)
1. Open logooo.PNG in GIMP
2. Scale image to 512x512 (Image → Scale Image)
3. Export as PNG for PWA icons
4. For .ico: Export As → Save as .ico format (GIMP will ask for sizes)

## After Generation
1. Replace `icons/logooo.PNG` references in `package.json` with `icons/icon.ico`
2. Update `manifest.json` to reference `icons/icon-192.png` and `icons/icon-512.png`
3. Rebuild Electron app: `npm run pack:win`

## Current Build Configuration
- See `package.json` → `build.win.icon`
- Electron-builder prefers .ico for Windows
- PNG will work but won't have multiple resolutions
