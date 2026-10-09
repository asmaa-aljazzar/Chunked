// GoalCard: main goal with progress ring
import { ProgressRing } from './progressRing.js';
import { t } from '../utils/i18n.js';
export const GoalCard = ({ title, progress, next }) => `
  <div class="goal">${ProgressRing({ value: progress })}
    <div class="goal__body"><h3>${title}</h3><p class="muted">${t('next')}: ${next}</p>
    <div class="bar" aria-hidden="true"><div class="bar__fill" style="width:${progress}%"></div></div></div></div>`;
