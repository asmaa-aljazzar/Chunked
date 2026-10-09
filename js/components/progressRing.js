// ProgressRing: SVG ring showing a percentage
export const ProgressRing = ({ value }) => {
  const r = 40, c = 2 * Math.PI * r;
  return `<div class="ring" role="img" aria-label="${value}%">
    <svg width="96" height="96" viewBox="0 0 96 96"><circle class="track" cx="48" cy="48" r="${r}"/>
    <circle class="value" cx="48" cy="48" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - value / 100)}"/></svg>
    <span>${value}%</span></div>`;
};
