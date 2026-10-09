// Mock data. Later replaced by Laravel API calls through js/api/mock-api.js
export const chunks = [
  { id:'fajr', start:'5:12', end:'6:28', done:2, total:2 },
  { id:'duha', start:'6:28', end:'12:08', done:1, total:3, current:true },
  { id:'dhuhr', start:'12:08', end:'15:18', done:0, total:4 },
  { id:'asr', start:'15:18', end:'17:58', done:0, total:2 },
  { id:'maghrib', start:'17:58', end:'19:28', done:0, total:1 },
  { id:'isha', start:'19:28', end:'5:12', done:0, total:3 }
];
export const tasks = [
  { id:1, title:'Finish proposal draft', min:60, done:true },
  { id:2, title:'Review design feedback', min:30, done:false },
  { id:3, title:'Send project update', min:15, done:false },
  { id:4, title:'Read chapter 5', min:45, done:false }
];
export const goal = { title:'Launch my UX portfolio', progress:68, next:'Finalize case study 3' };
export const habits = [
  { id:1, title:'Quran recitation', streak:14, done:true },
  { id:2, title:'Morning walk', streak:8, done:true },
  { id:3, title:'Read 30 min', streak:5, done:false }
];
export const user = { name:'Ahmad' };
export const nextPrayer = { id:'dhuhr', time:'12:08', left:'1:34' };
