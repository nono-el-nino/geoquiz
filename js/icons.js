// Icônes au trait, épaisses et arrondies (dans l'esprit de la mascotte)
const P = {
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h1m4 0h1m4 0h1M6 13h1m4 0h1m4 0h1M8 16h8"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4.5L17 13H5"/>',
  landmark: '<path d="M3 21h18M5 18h14M6 10v8M10 10v8M14 10v8M18 10v8"/><path d="M3 10h18L12 3z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  heart: '<path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8 2.4C20 15.4 12 20 12 20z"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 2M9.5 2.5h5M12 2.5V6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M19 12H5M11 5l-7 7 7 7"/>',
  flame: '<path d="M12 21.5c3.9 0 6.5-2.7 6.5-6.3 0-3.6-2.4-5.6-3.6-8.7-1 1.9-1.9 2.8-3.1 3.2.2-2.6-.4-5-1.8-7.2C7.3 5 5.5 8.7 5.5 15.2c0 3.6 2.6 6.3 6.5 6.3z"/>',
  medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.8 7 22l5-2.8 5 2.8-1.5-8.2"/>',
  sound: '<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  replay: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 3.5V9H9"/>',
  bulb: '<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5A6.5 6.5 0 0 0 8 14.2V16h8v-1.8a6.5 6.5 0 0 0-4-11.7z"/>',
  skip: '<path d="M5 5l9 7-9 7z"/><path d="M18.5 5v14"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  star: '<path d="M12 2.8l2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3-4.6-4.4 6.3-.8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
  trophy: '<path d="M8 21h8M12 16.5V21M7 3.5h10V9a5 5 0 0 1-10 0z"/><path d="M7 5.5H4A3.5 3.5 0 0 0 7.5 10M17 5.5h3A3.5 3.5 0 0 1 16.5 10"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  plane: '<path d="M21.5 2.5 2.5 9.5l7.5 3 3 7.5z"/><path d="M10 12.5l11.5-10"/>',
  map: '<path d="M3 6.5l6-3 6 3 6-3v14l-6 3-6-3-6 3z"/><path d="M9 3.5v14M15 6.5v14"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  sunrise: '<path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v5M4.6 11.6l2 2M19.4 11.6l-2 2"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/>',
  play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
};

export function icon(name, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}
