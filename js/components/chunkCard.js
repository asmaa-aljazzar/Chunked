// ChunkCard: one prayer-based time chunk
import { t } from '../utils/i18n.js';
export const ChunkCard = ({ id, start, end, done, total, current }) => {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<li class="chunk ${current ? 'chunk--current' : ''} ${total && done === total ? 'chunk--done' : ''}" ${current ? 'aria-current="true"' : ''}>
    <h3>${t('p.' + id)}</h3><p class="muted">${start} – ${end}</p>
    <p><strong>${done}/${total} ${t('tasks')}</strong></p>
    <div class="bar" aria-hidden="true"><div class="bar__fill" style="width:${pct}%"></div></div></li>`;
};
