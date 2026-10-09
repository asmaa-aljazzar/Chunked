// Dashboard: widgets are objects, state.widgets decides which render (show/hide ready)
import { t } from '../utils/i18n.js';
import { getState } from '../state.js';
import { chunks, tasks, goal, habits, user, nextPrayer } from '../../data/mock.js';
import { ChunkCard } from '../components/chunkCard.js';
import { GoalCard } from '../components/goalCard.js';
import { ReadinessBadge } from '../components/readinessBadge.js';

const card = (id, size, titleKey, body) =>
  `<article class="card w-${size}" data-widget="${id}"><h2 class="card__title">${t(titleKey)}</h2>${body}</article>`;

const widgets = {
  chunks: { module: 'day', render: () => card('chunks', 'lg', 'w.chunks', `<ul class="chunks">${chunks.map(ChunkCard).join('')}</ul>`) },
  tasks: { module: 'day', render: () => card('tasks', 'md', 'w.tasks', `<ul>${tasks.map((k) => `
      <li class="task ${k.done ? 'task--done' : ''}"><input type="checkbox" data-task="${k.id}" ${k.done ? 'checked' : ''} aria-label="${k.title}">
      <span>${k.title}</span><time class="chip">${k.min}m</time></li>`).join('')}</ul><button class="btn btn--ghost">${t('addTask')}</button>`) },
  goal: { module: 'grow', render: () => card('goal', 'sm', 'w.goal', GoalCard(goal)) },
  readiness: { module: 'focus', render: () => card('readiness', 'sm', 'w.readiness', `${ReadinessBadge({ status: 'ready' })}<p class="muted">${t('readyWhy')}</p>`) },
  habits: { module: 'grow', render: () => card('habits', 'sm', 'w.habits', habits.map((h) => `
      <div class="habit"><label><input type="checkbox" ${h.done ? 'checked' : ''}> ${h.title}</label><span class="chip">🔥 ${h.streak}</span></div>`).join('')) },
  workload: { module: 'day', render: () => card('workload', 'sm', 'w.workload', `<span class="chip">◐ ${t('balanced')}</span><p class="muted">${t('workloadText')}</p>`) },
  ai: { module: 'ai', render: () => card('ai', 'sm', 'w.ai', `<p class="suggestion">${t('aiText')}</p>
      <div class="actions"><button class="btn btn--primary">${t('accept')}</button><button class="btn">${t('dismiss')}</button></div>`) }
};

const greetingKey = () => { const h = new Date().getHours(); return h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening'; };

export const renderDashboard = () => {
  const { widgets: visible, modules, ai } = getState();
  const enabled = (m) => (m === 'ai' ? ai : modules[m]);
  return `<header class="greeting"><h1>${t(greetingKey())}, ${user.name}</h1><p class="muted">${t('greet.sub')}</p></header>
    <div class="widget-grid">${visible.filter((id) => widgets[id] && enabled(widgets[id].module)).map((id) => widgets[id].render()).join('')}</div>`;
};
export const renderPrayerBox = () =>
  `<p class="muted">${t('next.prayer')}</p><p><strong>${t('p.' + nextPrayer.id)}</strong> ${t('in')} ${nextPrayer.left}</p><p class="muted">${nextPrayer.time}</p>`;
export const toggleTask = (id) => { const k = tasks.find((x) => x.id === Number(id)); if (k) k.done = !k.done; };
