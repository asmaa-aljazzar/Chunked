// ReadinessBadge: icon + label + color (never color alone)
import { t } from '../utils/i18n.js';
const MAP = { ready: ['✔', 'ready'], wait: ['◐', 'wait'], stay: ['■', 'stay'] };
export const ReadinessBadge = ({ status }) => {
  const [icon, cls] = MAP[status] ?? MAP.wait;
  return `<span class="readiness readiness--${cls}"><span aria-hidden="true">${icon}</span>${t(status)}</span>`;
};
