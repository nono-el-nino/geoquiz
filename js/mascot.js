// Mascotte : un petit oiseau aviateur complètement perdu.
// mood : 'lost' (par défaut), 'happy', 'dizzy'
const INK = '#1f2a48', ORANGE = '#ff8a1f', CREAM = '#fff4e0', SKY = '#8fd3ff', CAP = '#2d4a8a';

function eyes(mood) {
  if (mood === 'happy') {
    return `<path d="M72 112q10-12 20 0M108 112q10-12 20 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  }
  if (mood === 'dizzy') {
    const spiral = (x) => `<path d="M${x} 110m-3 0a3 3 0 1 1 6 0a6 6 0 1 1-12 0a9 9 0 1 1 18 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    return spiral(82) + spiral(118);
  }
  // Perdu : grands yeux qui regardent chacun ailleurs
  return `
    <ellipse cx="82" cy="110" rx="10" ry="12" fill="${INK}"/><ellipse cx="118" cy="110" rx="10" ry="12" fill="${INK}"/>
    <circle cx="78" cy="105" r="3.5" fill="#fff"/><circle cx="121" cy="106" r="3.5" fill="#fff"/>`;
}

export function mascot(mood = 'lost', cls = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mascot ${cls}" viewBox="0 0 200 200" role="img" aria-label="Flagada, l'oiseau aviateur">
  <ellipse cx="100" cy="188" rx="50" ry="7" fill="${INK}" opacity=".12"/>
  ${mood === 'lost' ? `<g fill="${INK}" font-family="M PLUS Rounded 1c, system-ui, sans-serif" font-weight="900">
    <text x="150" y="40" font-size="30" transform="rotate(14 150 40)">?</text>
    <text x="34" y="52" font-size="22" transform="rotate(-16 34 52)">?</text></g>` : ''}
  ${mood === 'happy' ? `<g fill="${ORANGE}"><path d="M40 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M162 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>` : ''}
  <!-- écharpe -->
  <path d="M120 150c20 2 38-6 52-20-4 14-10 22-22 28 8 2 14 0 22-4-10 12-30 16-50 8z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <!-- pattes -->
  <path d="M84 176v10M116 176v10M78 188h12M110 188h12" stroke="${ORANGE}" stroke-width="5" stroke-linecap="round"/>
  <!-- corps -->
  <circle cx="100" cy="118" r="60" fill="${ORANGE}" stroke="${INK}" stroke-width="5"/>
  <ellipse cx="100" cy="142" rx="34" ry="28" fill="${CREAM}"/>
  <!-- casquette d'aviateur -->
  <path d="M42 108c0-40 26-58 58-58s58 18 58 58c-8-6-14-8-20-8-6-22-20-30-38-30s-32 8-38 30c-6 0-12 2-20 8z" fill="${CAP}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M42 108c-2 12 2 22 8 28l6-30zM158 108c2 12-2 22-8 28l-6-30z" fill="${CAP}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <!-- lunettes relevées -->
  <path d="M58 76h84" stroke="${INK}" stroke-width="5"/>
  <circle cx="82" cy="74" r="13" fill="${SKY}" stroke="${INK}" stroke-width="5"/>
  <circle cx="118" cy="74" r="13" fill="${SKY}" stroke="${INK}" stroke-width="5"/>
  <path d="M76 70l5-4M112 70l5-4" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
  <!-- visage -->
  ${eyes(mood)}
  <ellipse cx="66" cy="128" rx="8" ry="5" fill="#ff6b6b" opacity=".35"/><ellipse cx="134" cy="128" rx="8" ry="5" fill="#ff6b6b" opacity=".35"/>
  <path d="M92 124h16l-8 10z" fill="#ffc93c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  ${mood === 'lost' ? `<path d="M146 92c4 6 6 10 2 13s-8 0-7-5z" fill="${SKY}" stroke="${INK}" stroke-width="3"/>` : ''}
  <!-- carte tenue à l'envers -->
  ${mood !== 'happy' ? `<g transform="rotate(${mood === 'dizzy' ? 18 : -10} 70 160)">
    <path d="M40 140l20-6 20 6 20-6v40l-20 6-20-6-20 6z" fill="#fffdf7" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 134v40M80 140v40" stroke="${INK}" stroke-width="2.5"/>
    <path d="M48 168c8-10 16 4 24-8s14-2 20-12" fill="none" stroke="${ORANGE}" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round"/>
    <path d="M86 146l6 6m0-6l-6 6" stroke="#ff5c5c" stroke-width="3" stroke-linecap="round"/>
  </g>` : `<path d="M44 130c-14-10-16-26-10-34 8 6 14 18 14 30zM156 130c14-10 16-26 10-34-8 6-14 18-14 30z" fill="${ORANGE}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`}
</svg>`;
}
