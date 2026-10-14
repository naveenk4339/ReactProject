// Generates the showroom car illustrations in src/main/resources/static/images.
// Run: node scripts/generate-car-images.mjs
// Replace any .svg with a real photo (and update the imageUrl in DataSeeder) whenever you like.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../src/main/resources/static/images');

const shapes = {
  sedan: {
    body: 'M95,330 L95,292 Q98,268 140,262 L265,248 Q320,188 400,182 L500,182 Q565,186 625,246 L700,258 Q728,266 730,296 L730,330 Q730,342 716,342 L110,342 Q95,342 95,330 Z',
    glass: 'M290,246 Q335,198 400,194 L455,194 L455,246 Z M470,194 L500,194 Q555,198 600,246 L470,246 Z',
    wheels: [235, 605], lamp: [700, 280], tail: [100, 285],
  },
  coupe: {
    body: 'M90,332 L90,300 Q92,276 140,268 L280,250 Q350,196 430,192 L500,194 Q560,202 620,252 L705,266 Q735,274 738,302 L738,332 Q738,344 722,344 L104,344 Q90,344 90,332 Z',
    glass: 'M305,250 Q362,206 430,203 L490,204 Q540,212 585,250 Z',
    wheels: [230, 610], lamp: [710, 288], tail: [96, 292],
  },
  suv: {
    body: 'M95,330 L95,262 Q98,236 140,230 L220,222 Q262,150 330,146 L560,146 Q610,148 650,222 L705,234 Q732,242 734,272 L734,330 Q734,344 718,344 L110,344 Q95,344 95,330 Z',
    glass: 'M245,222 Q280,162 335,160 L425,160 L425,222 Z M440,160 L555,160 Q595,162 625,222 L440,222 Z',
    wheels: [240, 600], lamp: [708, 258], tail: [100, 255],
  },
};

const cars = [
  ['tesla-model-3', 'sedan', '#e8ecf1', '#0f172a', '#334155'],
  ['bmw-m4', 'coupe', '#2f6b4f', '#0b2e22', '#14532d'],
  ['toyota-rav4', 'suv', '#2c4a7a', '#0c1a33', '#1e3a8a'],
  ['ford-mustang', 'coupe', '#c81e2b', '#3f0a0e', '#7f1d1d'],
  ['honda-civic', 'sedan', '#7b8494', '#1e2430', '#374151'],
  ['porsche-911', 'coupe', '#d0202e', '#2b0508', '#991b1b'],
  ['jeep-wrangler', 'suv', '#5c6b48', '#1c2214', '#3f4a2c'],
  ['mercedes-e350', 'sedan', '#1d2128', '#000000', '#111827'],
  ['hyundai-ioniq5', 'suv', '#5aa6c8', '#0e2c3d', '#0e7490'],
];

for (const [file, type, paint, shade, bg] of cars) {
  const s = shapes[type];
  const wheel = (x) => `
    <circle cx="${x}" cy="338" r="54" fill="#0b0f17"/>
    <circle cx="${x}" cy="338" r="36" fill="url(#rim)"/>
    ${[0, 72, 144, 216, 288].map((a) => `<rect x="${x - 4}" y="306" width="8" height="30" rx="3" fill="#94a3b8" transform="rotate(${a} ${x} 338)"/>`).join('')}
    <circle cx="${x}" cy="338" r="9" fill="#1f2937"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 460" width="820" height="460">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${paint}"/><stop offset="0.55" stop-color="${paint}"/><stop offset="1" stop-color="${shade}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#cbd5e1" stop-opacity="0.9"/><stop offset="1" stop-color="#1e293b" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="rim"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#475569"/></radialGradient>
    <radialGradient id="spot" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="820" height="460" fill="url(#bg)"/>
  <rect width="820" height="460" fill="url(#spot)"/>
  <rect y="380" width="820" height="80" fill="#000" opacity="0.25"/>
  <ellipse cx="412" cy="392" rx="340" ry="22" fill="#000" opacity="0.55"/>
  <path d="${s.body}" fill="url(#paint)"/>
  <path d="${s.glass}" fill="url(#glass)"/>
  <path d="M120,300 L715,300" stroke="#ffffff" stroke-opacity="0.18" stroke-width="3"/>
  <ellipse cx="${s.lamp[0]}" cy="${s.lamp[1]}" rx="22" ry="8" fill="#fef9c3"/>
  <ellipse cx="${s.tail[0] + 8}" cy="${s.tail[1]}" rx="10" ry="7" fill="#ef4444"/>
  ${s.wheels.map(wheel).join('')}
</svg>
`;
  writeFileSync(join(out, `${file}.svg`), svg);
}
console.log(`wrote ${cars.length} images to ${out}`);
