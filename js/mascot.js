// Migo : géométrie constante, quatre éléments animables, aucun accessoire.
export const MIGO_STATES = Object.freeze(['neutral', 'happy', 'focused', 'missed', 'sleeping']);
export function mascot(mood = 'neutral', cls = '') {
  const state = ({ lost: 'neutral', dizzy: 'missed' })[mood] || mood;
  const safe = MIGO_STATES.includes(state) ? state : 'neutral';
  const colors = { neutral: ['#7FB8FF','#FF9466','#F3F6FA'], happy: ['#7FB8FF','#FF9466','#F3F6FA'], focused: ['#FF9466','#F3F6FA','#23324A'], missed: ['#8592A6','#B9C3D3','#F3F6FA'], sleeping: ['#7FB8FF','#FF9466','#F3F6FA'] }[safe];
  const label = { neutral: 'neutre', happy: 'content', focused: 'concentré', missed: 'raté', sleeping: 'endormi' }[safe];
  const closed = ['happy','focused','sleeping'].includes(safe);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mascot migo ${safe} ${cls}" viewBox="0 0 200 180" role="img" aria-label="Migo ${label}"><circle class="migo-body" cx="86" cy="90" r="68" fill="${colors[0]}"/><rect class="migo-beak" x="143" y="77" width="27" height="27" rx="3" transform="rotate(45 156.5 90.5)" fill="${colors[1]}"/><path class="migo-wing" d="M38 92H98A30 30 0 0 1 38 92Z" fill="${colors[2]}"/><g class="migo-gaze">${closed ? '<path class="migo-eye" d="M111 65h13" fill="none" stroke="#23324A" stroke-width="7" stroke-linecap="round"/>' : `<circle class="migo-eye" cx="118" cy="65" r="${safe === 'missed' ? 7 : 5}" fill="${safe === 'missed' ? 'none' : '#23324A'}" stroke="#23324A" stroke-width="${safe === 'missed' ? 3 : 0}"/>`}</g></svg>`;
}
