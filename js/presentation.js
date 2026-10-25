import { mascot } from './mascot.js';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function feedbackCard(good, title, detail, combo = 0) {
  const previous = document.querySelector('.question-migo .migo')?.getBoundingClientRect();
  if (previous && !reduced()) requestAnimationFrame(() => {
    const migo = document.querySelector('.feedback-panel .migo');
    if (!migo) return;
    const next = migo.getBoundingClientRect();
    migo.animate([{ transform: `translate(${previous.x-next.x}px,${previous.y-next.y}px)` }, { transform: 'translate(0,0)' }], { duration:260, easing:'cubic-bezier(.2,.8,.2,1)' });
  });
  return `${mascot(good ? 'happy' : 'missed', good && combo > 1 ? 'combo-spin' : '')}<div><strong>${good ? '✓' : '✕'} ${title}</strong><small>${detail}</small>${good && combo > 1 ? `<small>${combo} d’affilée.</small>` : ''}</div>`;
}
let lastAction = Date.now();
const wake = () => {
  lastAction = Date.now();
  document.querySelectorAll('.migo.sleeping').forEach(el => {
    const fresh = document.createElement('div'); fresh.innerHTML = mascot(); el.replaceWith(fresh.firstElementChild);
  });
};
for (const event of ['pointerdown', 'keydown']) document.addEventListener(event, wake, { passive: true });
document.addEventListener('pointerover', e => {
  const answer = e.target.closest('.answer');
  document.querySelectorAll('.migo').forEach(el => {
    const rect = answer?.getBoundingClientRect();
    el.style.setProperty('--look-x', rect ? `${rect.x + rect.width / 2 > innerWidth / 2 ? 2 : -2}px` : '0px');
    el.style.setProperty('--look-y', rect ? '2px' : '0px');
  });
});
setInterval(() => {
  document.querySelectorAll('.migo.neutral').forEach(el => {
    if (Date.now() - lastAction > 20000) {
      const holder = document.createElement('div'); holder.innerHTML = mascot('sleeping'); el.replaceWith(holder.firstElementChild);
    } else if (!reduced()) {
      el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 120);
    }
  });
}, 3000 + Math.random() * 3000);
setInterval(() => {
  if (reduced()) return;
  document.querySelectorAll('.migo.neutral').forEach(el => { el.classList.add('beak-twitch'); setTimeout(() => el.classList.remove('beak-twitch'), 150); });
}, 8000);
const observer = new MutationObserver(() => {
  const timer = document.querySelector('.timer');
  const urgent = timer?.classList.contains('danger');
  const el = document.querySelector('.question-migo .migo');
  if (!el || el.classList.contains('focused') === !!urgent) return;
  const box = document.createElement('div'); box.innerHTML = mascot(urgent ? 'focused' : 'neutral'); el.replaceWith(box.firstElementChild);
});
let previousMigo;
export function captureScreen(app) {
  previousMigo = app.querySelector('.hero .bird .migo, .question-migo .migo')?.getBoundingClientRect();
}
export function presentScreen(app) {
  const migo = app.querySelector('.question-migo .migo');
  if (previousMigo && migo && !reduced()) {
    const next = migo.getBoundingClientRect();
    migo.animate([{ transform: `translate(${previousMigo.x-next.x}px,${previousMigo.y-next.y}px) scale(${previousMigo.width/next.width})` }, { transform:'none' }], { duration:420,easing:'cubic-bezier(.2,.8,.2,1)' });
  }
  previousMigo = null;
  for (const el of app.querySelectorAll('.stat b')) {
    if (reduced() || !/^\+?\d+[ %]*$/.test(el.textContent)) continue;
    const final = el.textContent, value = parseInt(final.replace(/\s/g,''),10), start = performance.now();
    const frame = now => {
      if (!el.isConnected) return;
      const t = Math.min(1,(now-start)/600);
      el.textContent = final.replace(/\d[\d ]*/, String(Math.round(value*(1-(1-t)**3))));
      if(t<1) requestAnimationFrame(frame); else el.textContent=final;
    };
    requestAnimationFrame(frame);
  }
  observer.disconnect();
  const timer = app.querySelector('.timer');
  if (timer) observer.observe(timer, { attributes: true, attributeFilter: ['class'] });
}
// L'ouverture disparaît en moins de 900 ms et ne capte aucun toucher.
const intro = document.createElement('div'); intro.className = 'intro'; intro.setAttribute('aria-hidden','true');
intro.innerHTML = `${mascot()}<div>${[...'Migo'].map((c,i) => `<span style="--n:${i}">${c}</span>`).join('')}</div>`;
document.body.appendChild(intro);
const dismiss = () => intro.remove();
document.addEventListener('pointerdown', dismiss, { once:true });
setTimeout(dismiss, 850);
