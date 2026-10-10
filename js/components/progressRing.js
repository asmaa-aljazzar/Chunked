// progressRing.js — progressRing(72) -> HTML string for an SVG ring with a % label.
export function progressRing(percent, { size = 88, stroke = 9, label = `${Math.round(percent)}%` } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(percent, 0), 100) / 100);
  return `
    <div class="ring" style="width:${size}px;height:${size}px" role="img" aria-label="${label}">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
        <circle class="ring-bar" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
      </svg>
      <span class="ring-label">${label}</span>
    </div>`;
}
