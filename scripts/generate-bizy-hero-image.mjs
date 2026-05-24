import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const outputSvg = resolve("frontend/public/bizy-live-commerce-hero.svg");
const outputPng = resolve("frontend/public/bizy-live-commerce-hero.png");
const sourcePng = process.env.BIZY_HERO_SOURCE ?? "/home/carlos/Imagens/evento/e0dbdbb5-93c4-42f5-8fae-818d0359f26e.png";

try {
  await mkdir(dirname(outputPng), { recursive: true });
  await copyFile(sourcePng, outputPng);
  console.log(`Imagem Bizy copiada: ${outputPng}`);
  process.exit(0);
} catch {
  console.warn("Imagem fonte da hero não encontrada. A gerar ilustração fallback.");
}

const svg = String.raw`
<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1600" viewBox="0 0 2400 1600">
  <defs>
    <linearGradient id="room" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8d8e8"/>
      <stop offset="0.42" stop-color="#c74883"/>
      <stop offset="1" stop-color="#21141d"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff4f8"/>
      <stop offset="1" stop-color="#e8c3d6"/>
    </linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7a3f29"/>
      <stop offset="1" stop-color="#3f1f17"/>
    </linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff7fba"/>
      <stop offset="1" stop-color="#971a58"/>
    </linearGradient>
    <linearGradient id="phone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2e2630"/>
      <stop offset="1" stop-color="#0c0c10"/>
    </linearGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#160b13" flood-opacity="0.28"/>
    </filter>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="grain" width="140" height="140" patternUnits="userSpaceOnUse">
      <circle cx="18" cy="22" r="1.5" fill="#fff" opacity="0.08"/>
      <circle cx="96" cy="74" r="1.2" fill="#21141d" opacity="0.08"/>
      <circle cx="52" cy="118" r="1.1" fill="#fff" opacity="0.06"/>
    </pattern>
  </defs>

  <rect width="2400" height="1600" fill="url(#room)"/>
  <rect width="2400" height="1600" fill="url(#grain)" opacity="0.72"/>
  <path d="M0 1120 C460 960 760 1180 1180 1010 C1590 845 1890 910 2400 720 L2400 1600 L0 1600 Z" fill="url(#floor)" opacity="0.92"/>
  <circle cx="1840" cy="280" r="300" fill="#ffffff" opacity="0.12" filter="url(#glow)"/>
  <circle cx="350" cy="320" r="250" fill="#ffffff" opacity="0.15" filter="url(#glow)"/>

  <g opacity="0.42">
    <path d="M220 415 C560 260 780 470 1120 330 S1680 250 2090 430" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <path d="M180 510 C520 355 800 555 1170 430 S1650 360 2150 560" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  </g>

  <g transform="translate(125,640)" filter="url(#softShadow)">
    <rect x="0" y="0" width="575" height="440" rx="44" fill="#fff" opacity="0.88"/>
    <rect x="40" y="48" width="210" height="24" rx="12" fill="#971a58" opacity="0.22"/>
    <rect x="40" y="96" width="410" height="34" rx="17" fill="#21141d" opacity="0.86"/>
    <rect x="40" y="164" width="310" height="28" rx="14" fill="#971a58" opacity="0.8"/>
    <rect x="40" y="224" width="470" height="18" rx="9" fill="#21141d" opacity="0.18"/>
    <rect x="40" y="264" width="420" height="18" rx="9" fill="#21141d" opacity="0.13"/>
    <rect x="40" y="342" width="190" height="56" rx="28" fill="#971a58"/>
    <path d="M270 370 h190" stroke="#166534" stroke-width="10" stroke-linecap="round"/>
  </g>

  <g transform="translate(1510,415)" filter="url(#softShadow)">
    <path d="M0 0 H415" stroke="#21141d" stroke-width="24" stroke-linecap="round"/>
    <path d="M50 15 V600 M360 15 V600" stroke="#21141d" stroke-width="18" stroke-linecap="round"/>
    <g transform="translate(66,20)">
      <path d="M46 0 C20 64 0 136 0 225 h132 C126 130 96 62 46 0Z" fill="#f8d8e8"/>
      <path d="M180 0 C142 86 126 176 134 274 h142 C270 164 238 76 180 0Z" fill="#166534"/>
      <path d="M318 0 C284 72 268 150 276 240 h128 C398 140 360 70 318 0Z" fill="#f59e0b"/>
    </g>
  </g>

  <g transform="translate(760,210)" filter="url(#softShadow)">
    <ellipse cx="390" cy="1120" rx="430" ry="75" fill="#21141d" opacity="0.24"/>
    <path d="M285 590 C180 720 126 880 128 1110 H650 C662 890 610 726 500 590 Z" fill="url(#top)"/>
    <path d="M265 1060 C230 1185 210 1290 178 1450" stroke="#3f1f17" stroke-width="58" stroke-linecap="round"/>
    <path d="M545 1060 C590 1190 618 1300 658 1455" stroke="#3f1f17" stroke-width="58" stroke-linecap="round"/>
    <path d="M310 610 C228 690 164 780 102 900" stroke="url(#skin)" stroke-width="70" stroke-linecap="round"/>
    <path d="M505 610 C650 690 750 782 855 920" stroke="url(#skin)" stroke-width="70" stroke-linecap="round"/>
    <path d="M856 918 C912 952 967 964 1022 948" stroke="#3f1f17" stroke-width="38" stroke-linecap="round"/>
    <path d="M100 900 C75 940 48 968 18 980" stroke="#3f1f17" stroke-width="38" stroke-linecap="round"/>
    <path d="M285 592 C340 690 455 695 505 592 C462 565 333 565 285 592Z" fill="#fff" opacity="0.32"/>
    <path d="M335 475 C338 548 372 602 420 602 C468 602 506 548 512 475 Z" fill="url(#skin)"/>
    <ellipse cx="425" cy="345" rx="155" ry="168" fill="url(#skin)"/>
    <path d="M278 330 C220 214 314 92 452 96 C580 100 650 222 592 350 C568 285 522 232 448 214 C374 198 316 235 278 330Z" fill="#1a1215"/>
    <circle cx="292" cy="282" r="54" fill="#1a1215"/>
    <circle cx="566" cy="286" r="58" fill="#1a1215"/>
    <circle cx="350" cy="328" r="14" fill="#1a1215"/>
    <circle cx="487" cy="328" r="14" fill="#1a1215"/>
    <path d="M396 382 C418 396 444 396 468 382" fill="none" stroke="#2b1612" stroke-width="9" stroke-linecap="round"/>
    <path d="M355 432 C402 468 456 468 510 432" fill="none" stroke="#f6c2b8" stroke-width="14" stroke-linecap="round"/>
    <circle cx="305" cy="380" r="20" fill="#bd6f5c" opacity="0.35"/>
    <circle cx="532" cy="380" r="20" fill="#bd6f5c" opacity="0.35"/>
  </g>

  <g transform="translate(1590,760)" filter="url(#softShadow)">
    <path d="M128 0 H442 C510 0 560 50 560 118 V690 C560 758 510 808 442 808 H128 C60 808 10 758 10 690 V118 C10 50 60 0 128 0Z" fill="url(#phone)"/>
    <rect x="52" y="58" width="466" height="692" rx="54" fill="#121217"/>
    <rect x="80" y="96" width="410" height="612" rx="38" fill="#2b1824"/>
    <rect x="104" y="124" width="145" height="48" rx="24" fill="#ef4444"/>
    <text x="132" y="156" fill="#fff" font-family="Arial, sans-serif" font-size="25" font-weight="800">LIVE</text>
    <circle cx="410" cy="148" r="20" fill="#ff5aa5"/>
    <circle cx="454" cy="148" r="20" fill="#166534"/>
    <rect x="104" y="205" width="355" height="260" rx="36" fill="#f8d8e8"/>
    <path d="M160 404 C230 310 314 320 400 402" fill="none" stroke="#971a58" stroke-width="24" stroke-linecap="round"/>
    <path d="M178 250 L262 220 L348 250 L318 422 H208 Z" fill="#971a58"/>
    <path d="M340 254 L410 232 L466 264 L438 424 H352 Z" fill="#166534"/>
    <g font-family="Arial, sans-serif" font-size="24" font-weight="700">
      <rect x="104" y="502" width="340" height="58" rx="29" fill="#fff" opacity="0.16"/>
      <text x="128" y="540" fill="#fff">@maria 923 456 789 01</text>
      <rect x="104" y="578" width="300" height="58" rx="29" fill="#fff" opacity="0.13"/>
      <text x="128" y="616" fill="#fff">@ana quero o 02</text>
      <rect x="104" y="654" width="356" height="58" rx="29" fill="#971a58"/>
      <text x="128" y="692" fill="#fff">Reserva criada no Bizy</text>
    </g>
  </g>

  <g transform="translate(1900,250)" opacity="0.9">
    <path d="M42 84 C-18 32 18 -42 86 22 C152 -42 194 32 132 84 L86 130 Z" fill="#ff77b8"/>
    <path d="M110 190 C50 138 86 64 154 128 C220 64 262 138 200 190 L154 236 Z" fill="#fff" opacity="0.8"/>
    <path d="M20 260 C-28 218 0 162 54 210 C108 162 142 218 92 260 L54 292 Z" fill="#ff77b8" opacity="0.78"/>
  </g>

  <g transform="translate(320,215)" opacity="0.9">
    <rect x="0" y="0" width="390" height="128" rx="64" fill="#21141d" opacity="0.72"/>
    <circle cx="70" cy="64" r="34" fill="#166534"/>
    <path d="M54 65 l12 13 l24 -30" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="128" y="55" fill="#fff" font-family="Arial, sans-serif" font-size="26" font-weight="800">Comentarios viram</text>
    <text x="128" y="91" fill="#ffc9df" font-family="Arial, sans-serif" font-size="26" font-weight="800">reservas no WhatsApp</text>
  </g>
</svg>`;

await mkdir(dirname(outputPng), { recursive: true });
await writeFile(outputSvg, svg, "utf8");
await sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(outputPng);

console.log(`Imagem Bizy gerada: ${outputPng}`);
