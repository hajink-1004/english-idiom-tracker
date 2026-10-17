export const CONFIG = { startDate: '2026-10-17', duration: 7, statuses: ['complete','minimum','missed'] } as const;
export const STORAGE_KEY = 'habit-challenge-idioms-v1';
export type Status = 'complete' | 'minimum' | 'missed';
export type Entry = { idioms: [string,string]; status: Status | null };
export type Records = Record<string,Entry>;
export type Store = { version: 1; config: typeof CONFIG; records: Records };
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
// Calendar arithmetic avoids DST's 23/25-hour local days.
export function addDays(key: string, days: number): string {
  const [y,m,d] = key.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d+days)).toISOString().slice(0,10);
}
export function dayNumber(start: string, today: string): number {
  return Math.round((Date.parse(today+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000)+1;
}
export function challengeDays(start: string = CONFIG.startDate, duration: number = CONFIG.duration) {
  return Array.from({length:duration},(_,i)=>addDays(start,i));
}
export const DAYS = challengeDays();
export function canEdit(selected: string, today: string) { return selected===today && DAYS.includes(today); }
export function validStatus(status: Status | null, idioms: [string,string]) {
  const count = idioms.filter(s=>s.trim()).length;
  return status==='complete' ? count===2 : status==='minimum' ? count>=1 : true;
}
export function success(entry?: Entry) { return entry?.status==='complete' || entry?.status==='minimum'; }
export function statistics(records: Records, today: string) {
  const completed = DAYS.filter(day=>day<=today && success(records[day])).length;
  let cursor = today < DAYS[0] ? '' : today>DAYS[6] ? DAYS[6] : today;
  if(cursor && DAYS.includes(cursor) && !success(records[cursor]) && cursor===today && records[cursor]?.status!=='missed') cursor=addDays(cursor,-1);
  let streak=0;
  while(DAYS.includes(cursor) && success(records[cursor])) { streak++; cursor=addDays(cursor,-1); }
  return {completed, percent: Math.round(completed/CONFIG.duration*100), streak};
}
export function emptyStore(): Store { return {version:1,config:CONFIG,records:{}}; }
export function decodeStore(raw: string | null): Store {
  if(!raw) return emptyStore();
  const data = JSON.parse(raw);
  if(data?.version!==1 || data?.config?.startDate!==CONFIG.startDate || data?.config?.duration!==CONFIG.duration || !data.records || typeof data.records!=='object' || Array.isArray(data.records)) throw new Error('저장된 기록을 읽을 수 없습니다.');
  const records: Records = {};
  for(const day of DAYS) {
    const entry=data.records[day];
    if(!entry) continue;
    if(!Array.isArray(entry.idioms) || entry.idioms.length!==2 || !entry.idioms.every((s:unknown)=>typeof s==='string') || (entry.status!==null && !CONFIG.statuses.includes(entry.status)) || !validStatus(entry.status,entry.idioms)) throw new Error('저장된 기록 형식을 확인해주세요.');
    records[day]={idioms:entry.idioms,status:entry.status};
  }
  return {version:1,config:CONFIG,records};
}
export function updateRecord(store: Store, selected: string, today: string, entry: Entry): Store {
  if(!canEdit(selected,today)) throw new Error('오늘 기록만 수정할 수 있습니다.');
  if(!validStatus(entry.status,entry.idioms)) throw new Error(entry.status==='complete' ? '완료하려면 숙어 2개를 입력해주세요.' : '최소 수행에는 숙어 1개가 필요합니다.');
  return {...store,records:{...store.records,[selected]:entry}};
}
