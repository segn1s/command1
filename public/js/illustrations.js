/**
 * Custom crisp SVG illustrations for the 4 thematic floating islands,
 * dynamic city growth stages, and the interactive Owl's Room.
 */

export function renderMiniIslandSVG(cityId) {
  switch (cityId) {
    case 'sport':
      return `<svg viewBox="0 0 140 110" width="118" height="96">
        <polygon points="70,88 18,62 70,38 122,62" fill="#B5D39E"/>
        <polygon points="18,62 70,88 70,98 18,72" fill="#89A972"/>
        <polygon points="70,88 122,62 122,72 70,98" fill="#769660"/>
        <ellipse cx="64" cy="60" rx="30" ry="16" fill="#D56C63"/>
        <ellipse cx="64" cy="60" rx="22" ry="11" fill="#4D8A5A"/>
        <line x1="48" y1="60" x2="80" y2="60" stroke="#fff" stroke-width="1.5"/>
        <circle cx="96" cy="48" r="10" fill="#E9904B"/>
        <path d="M88,44 Q96,48 104,44 M96,38 L96,58" stroke="#7E3E16" stroke-width="1.2" fill="none"/>
      </svg>`;
    case 'creativity':
      return `<svg viewBox="0 0 140 110" width="118" height="96">
        <polygon points="70,88 18,62 70,38 122,62" fill="#EBC8CE"/>
        <polygon points="18,62 70,88 70,98 18,72" fill="#C79FA6"/>
        <polygon points="70,88 122,62 122,72 70,98" fill="#B38A92"/>
        <rect x="44" y="34" width="38" height="28" rx="4" fill="#FFF7EE" stroke="#244B3A" stroke-width="2"/>
        <polygon points="40,36 63,20 86,36" fill="#244B3A"/>
        <rect x="58" y="47" width="10" height="15" rx="2" fill="#8B5A4C"/>
        <rect x="94" y="22" width="6" height="36" rx="2" fill="#F0C75E" transform="rotate(14 94 22)"/>
        <polygon points="90,56 96,58 91,64" fill="#D4746A"/>
      </svg>`;
    case 'science':
      return `<svg viewBox="0 0 140 110" width="118" height="96">
        <polygon points="70,88 18,62 70,38 122,62" fill="#D5D2EB"/>
        <polygon points="18,62 70,88 70,98 18,72" fill="#AAA4CC"/>
        <polygon points="70,88 122,62 122,72 70,98" fill="#958FB8"/>
        <path d="M40,62 L40,48 C40,34 74,34 74,48 L74,62 Z" fill="#B8B0E3"/>
        <path d="M54,38 C59,44 59,54 59,62" stroke="#244B3A" stroke-width="3" fill="none"/>
        <rect x="52" y="51" width="9" height="11" rx="2" fill="#244B3A"/>
        <line x1="88" y1="45" x2="105" y2="34" stroke="#F0E199" stroke-width="6" stroke-linecap="round"/>
        <line x1="94" y1="44" x2="88" y2="62" stroke="#244B3A" stroke-width="2.5"/>
        <line x1="94" y1="44" x2="101" y2="62" stroke="#244B3A" stroke-width="2.5"/>
      </svg>`;
    case 'social':
    default:
      return `<svg viewBox="0 0 140 110" width="118" height="96">
        <polygon points="70,88 18,62 70,38 122,62" fill="#C7DDA9"/>
        <polygon points="18,62 70,88 70,98 18,72" fill="#99B578"/>
        <polygon points="70,88 122,62 122,72 70,98" fill="#84A164"/>
        <rect x="44" y="38" width="38" height="24" rx="3" fill="#F9E596"/>
        <polygon points="40,39 63,22 86,39" fill="#244B3A"/>
        <rect x="59" y="48" width="8" height="14" fill="#244B3A"/>
        <circle cx="98" cy="44" r="10" fill="#5D8C5A"/>
        <rect x="96" y="52" width="4" height="10" fill="#6F4E37"/>
      </svg>`;
  }
}

export function renderCityDetailSVG(cityId, unlockedDistricts) {
  const palette = {
    sport: { top: '#C4DFAF', left: '#95B77E', right: '#80A16A', accent: '#D96B61' },
    creativity: { top: '#F0D4DA', left: '#C9A2AB', right: '#B58D96', accent: '#9B72AA' },
    science: { top: '#DAD6F0', left: '#AEA8D1', right: '#9892BD', accent: '#6D5DB3' },
    social: { top: '#D1E4B8', left: '#A2BD82', right: '#8CA86D', accent: '#E0B44C' }
  }[cityId] || { top: '#DAD6F0', left: '#AEA8D1', right: '#9892BD', accent: '#6D5DB3' };

  const b1 = unlockedDistricts >= 1 ? 1 : 0.25;
  const b2 = unlockedDistricts >= 2 ? 1 : 0.25;
  const b3 = unlockedDistricts >= 3 ? 1 : 0.25;
  const b4 = unlockedDistricts >= 4 ? 1 : 0.25;

  return `<svg viewBox="0 0 280 220" width="260" height="205">
    <ellipse cx="140" cy="126" rx="110" ry="76" fill="rgba(255,255,255,0.45)"/>
    <polygon points="140,185 32,130 140,76 248,130" fill="${palette.top}"/>
    <polygon points="32,130 140,185 140,204 32,148" fill="${palette.left}"/>
    <polygon points="140,185 248,130 248,148 140,204" fill="${palette.right}"/>

    <!-- Base Mascot Owl House (always unlocked) -->
    <g transform="translate(115, 96)">
      <rect x="0" y="14" width="48" height="32" rx="4" fill="#FFF8E8" stroke="#244B3A" stroke-width="2"/>
      <polygon points="-4,16 24,-4 52,16" fill="#244B3A"/>
      <rect x="19" y="28" width="11" height="18" rx="2" fill="#8B5A4C"/>
      <circle cx="24" cy="9" r="4" fill="#F0E199"/>
    </g>

    <!-- District 1 -->
    <g opacity="${b1}" transform="translate(58, 108)">
      <rect x="0" y="10" width="32" height="22" rx="4" fill="#FFFFFF" stroke="#244B3A" stroke-width="1.8"/>
      <polygon points="-2,11 16,-2 34,11" fill="${palette.accent}"/>
    </g>

    <!-- District 2 -->
    <g opacity="${b2}" transform="translate(182, 108)">
      <path d="M0,30 L0,16 C0,2 34,2 34,16 L34,30 Z" fill="${palette.accent}"/>
      <rect x="12" y="18" width="10" height="12" rx="2" fill="#244B3A"/>
    </g>

    <!-- District 3 -->
    <g opacity="${b3}" transform="translate(92, 62)">
      <rect x="0" y="6" width="30" height="22" rx="3" fill="#F1E39C" stroke="#244B3A" stroke-width="1.8"/>
      <circle cx="15" cy="16" r="5" fill="#244B3A"/>
    </g>

    <!-- District 4 -->
    <g opacity="${b4}" transform="translate(154, 62)">
      <rect x="0" y="4" width="34" height="26" rx="4" fill="#FFFFFF" stroke="#244B3A" stroke-width="1.8"/>
      <polygon points="0,4 17,-8 34,4" fill="#244B3A"/>
      <circle cx="17" cy="16" r="5" fill="${palette.accent}"/>
    </g>
  </svg>`;
}

export function renderOwlRoomSVG(equipped, decorCatalog, owlMood = 'happy') {
  const chairItem = decorCatalog.chair.items.find((i) => i.id === equipped.chair) || decorCatalog.chair.items[0];
  const plantItem = decorCatalog.plant.items.find((i) => i.id === equipped.plant) || decorCatalog.plant.items[0];
  const lampItem = decorCatalog.lamp.items.find((i) => i.id === equipped.lamp) || decorCatalog.lamp.items[0];
  const posterItem = decorCatalog.poster.items.find((i) => i.id === equipped.poster) || decorCatalog.poster.items[0];

  const isWarmLamp = equipped.lamp === 'lamp-warm';
  const isStars = equipped.lamp === 'lamp-stars';

  return `<svg viewBox="0 0 320 280" width="320" height="280">
    <!-- Isometric Walls & Floor -->
    <polygon points="160,18 286,82 286,204 160,140" fill="#F6EAC2"/>
    <polygon points="160,18 34,82 34,204 160,140" fill="#FBF2D5"/>
    <polygon points="160,264 34,204 160,140 286,204" fill="#D2AC84"/>
    <polygon points="160,264 34,204 34,216 160,276" fill="#AF8760"/>
    <polygon points="160,264 286,204 286,216 160,276" fill="#9A734E"/>

    <!-- Rug -->
    <ellipse cx="160" cy="204" rx="74" ry="38" fill="#E38E8C"/>
    <ellipse cx="160" cy="204" rx="58" ry="29" fill="#ECA3A1"/>

    <!-- Window -->
    <g transform="translate(64, 72)">
      <path d="M0,58 L0,22 C0,4 44,-8 44,12 L44,44 Z" fill="${lampItem.color}" stroke="#C5A36E" stroke-width="4"/>
      <line x1="22" y1="5" x2="22" y2="51" stroke="#FFFDF5" stroke-width="2.5"/>
      <line x1="0" y1="33" x2="44" y2="22" stroke="#FFFDF5" stroke-width="2.5"/>
    </g>

    ${isWarmLamp ? `<circle cx="96" cy="116" r="36" fill="rgba(255, 210, 125, 0.35)"/>` : ''}
    ${isStars ? `<text x="90" y="64" font-size="16">✨ ⭐ ✨</text>` : ''}

    <!-- Poster / Wall Decor -->
    <g transform="translate(206, 76)">
      <rect x="0" y="0" width="36" height="42" rx="4" fill="#FFFDF7" stroke="${posterItem.color}" stroke-width="4"/>
      <text x="18" y="27" text-anchor="middle" font-size="18">${posterItem.icon}</text>
    </g>

    <!-- Chair -->
    <g transform="translate(46, 146)">
      <rect x="0" y="18" width="46" height="32" rx="8" fill="${chairItem.color}"/>
      <rect x="8" y="4" width="34" height="22" rx="6" fill="${chairItem.color}" opacity="0.88"/>
      <line x1="8" y1="50" x2="8" y2="58" stroke="#4D423A" stroke-width="3"/>
      <line x1="38" y1="50" x2="38" y2="58" stroke="#4D423A" stroke-width="3"/>
    </g>

    <!-- Bookshelf & Plant -->
    <g transform="translate(216, 134)">
      <rect x="0" y="22" width="48" height="36" rx="4" fill="#B58963"/>
      <rect x="6" y="28" width="36" height="10" fill="#7D5A3C"/>
      <rect x="6" y="42" width="36" height="10" fill="#7D5A3C"/>
      <!-- Plant pot -->
      <polygon points="16,22 32,22 29,8 19,8" fill="#EFE8DA"/>
      <circle cx="24" cy="2" r="11" fill="${plantItem.color}"/>
      <text x="24" y="6" text-anchor="middle" font-size="13">${plantItem.icon}</text>
    </g>

    <!-- Mascot Owl -->
    <g class="owl-character" transform="translate(118, 112)">
      <!-- Body -->
      <ellipse cx="42" cy="56" rx="34" ry="38" fill="#7A563E"/>
      <ellipse cx="42" cy="64" rx="22" ry="26" fill="#F2E4CC"/>
      <!-- Ears -->
      <polygon points="14,24 22,12 30,24" fill="#63422E"/>
      <polygon points="54,24 62,12 70,24" fill="#63422E"/>
      <!-- Eyes -->
      <circle cx="29" cy="40" r="12" fill="#FFFDF7"/>
      <circle cx="55" cy="40" r="12" fill="#FFFDF7"/>
      ${
        owlMood === 'excited'
          ? `<path d="M22,40 Q29,33 36,40" stroke="#1E3A2F" stroke-width="3" fill="none" stroke-linecap="round"/>
             <path d="M48,40 Q55,33 62,40" stroke="#1E3A2F" stroke-width="3" fill="none" stroke-linecap="round"/>`
          : `<circle cx="30" cy="40" r="7" fill="#1E3A2F"/>
             <circle cx="54" cy="40" r="7" fill="#1E3A2F"/>
             <circle cx="32" cy="37" r="2.4" fill="#FFFFFF"/>
             <circle cx="56" cy="37" r="2.4" fill="#FFFFFF"/>`
      }
      <!-- Beak -->
      <polygon points="38,48 46,48 42,56" fill="#F0B342"/>
      <!-- Cheeks -->
      <ellipse cx="18" cy="49" rx="5" ry="3" fill="#E89999" opacity="0.7"/>
      <ellipse cx="66" cy="49" rx="5" ry="3" fill="#E89999" opacity="0.7"/>
      <!-- Feet -->
      <ellipse cx="30" cy="94" rx="7" ry="4" fill="#E6A13B"/>
      <ellipse cx="54" cy="94" rx="7" ry="4" fill="#E6A13B"/>
    </g>
  </svg>`;
}
