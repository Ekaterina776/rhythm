import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Base SVG Design: Poetic Quill Feather & Harmonic Rhythm Waves
const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background with subtle border -->
  <rect width="512" height="512" rx="104" fill="url(#bgGrad)"/>
  <rect width="504" height="504" x="4" y="4" rx="100" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-opacity="0.3"/>

  <!-- Harmonic Rhythm Beats Background Grid -->
  <g opacity="0.22" stroke="#f59e0b" stroke-width="2" stroke-linecap="round">
    <line x1="80" y1="256" x2="432" y2="256" stroke-dasharray="8 12"/>
    <line x1="120" y1="200" x2="120" y2="312"/>
    <line x1="180" y1="160" x2="180" y2="352" stroke-width="3"/>
    <line x1="240" y1="220" x2="240" y2="292"/>
    <line x1="300" y1="140" x2="300" y2="372" stroke-width="4"/>
    <line x1="360" y1="210" x2="360" y2="302"/>
    <line x1="400" y1="180" x2="400" y2="332" stroke-width="3"/>
  </g>

  <!-- Central Poetic Lyre & Golden Quill -->
  <g transform="translate(256, 256)" filter="url(#glow)">
    <!-- Elegant Lyre Outline -->
    <path d="M -90,-80 C -120,-30 -110,60 -40,110 C -20,125 20,125 40,110 C 110,60 120,-30 90,-80 C 70,-115 50,-115 40,-90 C 30,-50 20,-20 0,-15 C -20,-20 -30,-50 -40,-90 C -50,-115 -70,-115 -90,-80 Z"
          fill="none" stroke="url(#goldGrad)" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Lyre Strings (Rhythm Meters) -->
    <line x1="-30" y1="-50" x2="-30" y2="90" stroke="url(#goldGrad)" stroke-width="4" opacity="0.8"/>
    <line x1="0" y1="-25" x2="0" y2="100" stroke="url(#cyanGrad)" stroke-width="5"/>
    <line x1="30" y1="-50" x2="30" y2="90" stroke="url(#goldGrad)" stroke-width="4" opacity="0.8"/>

    <!-- Poetic Quill Pen diagonal overlay -->
    <g transform="rotate(-32)">
      <path d="M 0,-160 C 25,-120 30,-50 15,40 C 8,80 2,120 0,150 C -2,120 -8,80 -15,40 C -30,-50 -25,-120 0,-160 Z"
            fill="url(#goldGrad)" opacity="0.95"/>
      <path d="M 0,-150 L 0,150" stroke="#0f172a" stroke-width="3" opacity="0.7"/>
      <!-- Feather barbs -->
      <path d="M 0,-100 Q 20,-85 24,-70 M 0,-60 Q 22,-45 23,-30 M 0,-20 Q 20,-5 18,10" stroke="#0f172a" stroke-width="2.5" fill="none" opacity="0.5"/>
      <path d="M 0,-100 Q -20,-85 -24,-70 M 0,-60 Q -22,-45 -23,-30 M 0,-20 Q -20,-5 -18,10" stroke="#0f172a" stroke-width="2.5" fill="none" opacity="0.5"/>
      <!-- Nib tip -->
      <polygon points="0,150 -5,135 5,135" fill="#fef08a"/>
    </g>

    <!-- Rhythmic accent stars -->
    <circle cx="-110" cy="-40" r="5" fill="#fef08a"/>
    <circle cx="110" cy="-40" r="5" fill="#fef08a"/>
    <circle cx="0" cy="130" r="6" fill="#38bdf8"/>
  </g>

  <!-- Typography monogram "Р" in poetic serif at bottom -->
  <text x="256" y="445" font-family="'Cinzel', 'Cormorant Garamond', serif" font-size="34" font-weight="700"
        fill="url(#goldGrad)" text-anchor="middle" letter-spacing="8">РИТМОСТИХ</text>
</svg>`;

// 2. Maskable SVG Design (Central 75% safe area with generous padding)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="goldGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="cyanGradMask" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>

  <!-- Full Bleed Background -->
  <rect width="512" height="512" fill="url(#bgGradMask)"/>

  <!-- Centered Safe Zone Graphic (Scale 0.72) -->
  <g transform="translate(256, 256) scale(0.72) translate(-256, -256)">
    <!-- Harmonic Rhythm Beats Background Grid -->
    <g opacity="0.3" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round">
      <line x1="80" y1="256" x2="432" y2="256" stroke-dasharray="8 12"/>
      <line x1="120" y1="190" x2="120" y2="322"/>
      <line x1="180" y1="150" x2="180" y2="362" stroke-width="4"/>
      <line x1="240" y1="210" x2="240" y2="302"/>
      <line x1="300" y1="130" x2="300" y2="382" stroke-width="5"/>
      <line x1="360" y1="200" x2="360" y2="312"/>
      <line x1="400" y1="170" x2="400" y2="342" stroke-width="4"/>
    </g>

    <!-- Lyre & Quill -->
    <g transform="translate(256, 256)">
      <path d="M -90,-80 C -120,-30 -110,60 -40,110 C -20,125 20,125 40,110 C 110,60 120,-30 90,-80 C 70,-115 50,-115 40,-90 C 30,-50 20,-20 0,-15 C -20,-20 -30,-50 -40,-90 C -50,-115 -70,-115 -90,-80 Z"
            fill="none" stroke="url(#goldGradMask)" stroke-width="14" stroke-linejoin="round"/>
      <line x1="-30" y1="-50" x2="-30" y2="90" stroke="url(#goldGradMask)" stroke-width="5" opacity="0.8"/>
      <line x1="0" y1="-25" x2="0" y2="100" stroke="url(#cyanGradMask)" stroke-width="6"/>
      <line x1="30" y1="-50" x2="30" y2="90" stroke="url(#goldGradMask)" stroke-width="5" opacity="0.8"/>

      <g transform="rotate(-32)">
        <path d="M 0,-160 C 25,-120 30,-50 15,40 C 8,80 2,120 0,150 C -2,120 -8,80 -15,40 C -30,-50 -25,-120 0,-160 Z"
              fill="url(#goldGradMask)"/>
        <path d="M 0,-150 L 0,150" stroke="#0f172a" stroke-width="4" opacity="0.7"/>
        <polygon points="0,150 -5,135 5,135" fill="#fef08a"/>
      </g>
    </g>

    <text x="256" y="445" font-family="'Cinzel', 'Cormorant Garamond', serif" font-size="36" font-weight="700"
          fill="url(#goldGradMask)" text-anchor="middle" letter-spacing="8">РИТМОСТИХ</text>
  </g>
</svg>`;

async function generate() {
  console.log('Generating PWA assets...');

  // 1. Write SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), baseSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), baseSvg.trim());

  // 2. Render 512x512 PNG
  await sharp(Buffer.from(baseSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Render 192x192 PNG
  await sharp(Buffer.from(baseSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 4. Render Apple Touch Icon (180x180 PNG)
  await sharp(Buffer.from(baseSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 5. Render Maskable 512x512 PNG (Safe zone padded)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 6. Favicon 32x32 / 48x48 PNG (as favicon.ico)
  await sharp(Buffer.from(baseSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Successfully generated all PWA icons in /public:');
  console.log('- icon.svg');
  console.log('- apple-touch-icon.png (180x180)');
  console.log('- pwa-192x192.png (192x192)');
  console.log('- pwa-512x512.png (512x512)');
  console.log('- pwa-maskable-512x512.png (512x512 maskable)');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
