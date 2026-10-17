import {useEffect,useRef,useState} from 'react';
import {LockClosedIcon, CrossCircledIcon, CheckIcon} from '@radix-ui/react-icons';
import * as Dialog from '@radix-ui/react-dialog';
import {Circle,Triangle,X} from 'lucide-react';
import {CONFIG,DAYS,STORAGE_KEY,canEdit,dateKey,dayNumber,decodeStore,emptyStore,statistics,updateRecord,validStatus,type Store,type Status,type Entry} from './model';
import './prototype.css';
import {currentDate} from './qa';
const labels: Record<Status,string> = {complete:'완료',minimum:'최소 수행',missed:'미완료'};
const week=['일','월','화','수','목','금','토'];
const dayDate=(key:string)=>new Date(key+'T12:00:00');
function StatusIcon({status}:{status:Status|null}) {
  const Icon=status==='minimum'?Triangle:status==='missed'?X:Circle;
  return <Icon className="status-icon" data-status={status??'unrecorded'} size={24} strokeWidth={2} fill="none" aria-hidden="true"/>;
}
function load() { try {return {store:decodeStore(localStorage.getItem(STORAGE_KEY)),error:''};} catch {return {store:emptyStore(),error:'저장된 기록을 읽을 수 없습니다. 초기화 전에 브라우저 저장 설정을 확인해주세요.'};} }
export default function Prototype() {
  const [initial]=useState(load);
  const [store,setStore]=useState<Store>(initial.store);
  const [today,setToday]=useState(()=>dateKey(currentDate()));
  const [selected,setSelected]=useState(()=>{const t=dateKey(currentDate());return t<DAYS[0]?DAYS[0]:t>DAYS[6]?DAYS[6]:t;});
  const [error,setError]=useState(initial.error);
  const [resetOpen,setResetOpen]=useState(false);
  const ref=useRef(store);
  const storageBlocked=useRef(!!initial.error);
  const previousToday=useRef(today);
  useEffect(()=>{
    const refresh=()=>setToday(dateKey(currentDate()));
    const timer=window.setInterval(refresh,1000);
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    const sync=(event:StorageEvent)=>{
      if(event.key!==STORAGE_KEY && event.key!==null) return;
      try {const next=decodeStore(event.newValue);ref.current=next;setStore(next);storageBlocked.current=false;setError('');}
      catch {storageBlocked.current=true;setError('다른 창의 저장 기록을 읽을 수 없습니다.');}
    };
    window.addEventListener('storage',sync);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('storage',sync);};
  },[]);
  useEffect(()=>{
    const previous=previousToday.current;
    if(previous!==today) {setSelected(current=>current===previous?(today<DAYS[0]?DAYS[0]:today>DAYS[6]?DAYS[6]:today):current);previousToday.current=today;setError('');}
  },[today]);
  const entry:Entry=store.records[selected]??{idioms:['',''],status:null};
  const editable=canEdit(selected,today);
  const stats=statistics(store.records,today);
  const day=dayNumber(CONFIG.startDate,today);
  const phase=day<1?'챌린지 시작 전':day>7?'챌린지 종료':`Day ${day} / 7`;
  const persist=(next:Store)=>{
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));ref.current=next;setStore(next);setError('');return true;}
    catch {setError('저장하지 못했습니다. 브라우저 저장 공간과 설정을 확인해주세요.');return false;}
  };
  useEffect(()=>{
    if(storageBlocked.current) return;
    try {if(localStorage.getItem(STORAGE_KEY)===null) persist(ref.current);}
    catch {setError('브라우저 저장소를 사용할 수 없습니다.');}
  },[]);
  const change=(next:Entry)=>{
    if(storageBlocked.current) {setError('기존 기록을 읽을 수 없어 덮어쓰기를 중단했습니다.');return;}
    const actual=dateKey(currentDate());setToday(actual);
    try {
      const latest=decodeStore(localStorage.getItem(STORAGE_KEY));
      persist(updateRecord(latest,selected,actual,next));
    } catch(e) {setError(e instanceof Error?e.message:'기록을 저장하지 못했습니다.');}
  };
  const input=(index:number,value:string)=>{
    const idioms:[string,string]=[...entry.idioms];idioms[index]=value;
    const status=validStatus(entry.status,idioms)?entry.status:null;
    change({idioms,status});
  };
  const reset=()=>{if(persist(emptyStore())) {storageBlocked.current=false;setResetOpen(false);}};
  const selectedDate=dayDate(selected);
  const short=`${selectedDate.getMonth()+1}.${String(selectedDate.getDate()).padStart(2,'0')}`;
  return <main className="tracker">
    <header className="heading"><h1>Habit Tracker</h1><span data-testid="phase">{phase}</span></header>
    <section className="overview" aria-label="챌린지 개요">
      <p className="today-date" data-testid="today-date">{today.replaceAll('-','.')} {week[dayDate(today).getDay()]}요일</p>
      <p className="goal-label">오늘의 목표</p>
      <h2>숙어 2개로 영어 대화 1회</h2>
      <p className="minimum-hint">최소 수행: 숙어 1개로 대화 1회</p>
      <div className="progress-summary">
        <div className="progress-dots" role="progressbar" aria-label="전체 챌린지 진행률" aria-valuenow={stats.percent} aria-valuemin={0} aria-valuemax={100}>
          {DAYS.map(key=><span key={key} className={key<=today&&store.records[key]?.status==='complete'?'dot complete':key<=today&&store.records[key]?.status==='minimum'?'dot minimum':'dot'}><StatusIcon status={key<=today?store.records[key]?.status??null:null}/></span>)}
        </div>
        <div className="metrics"><strong data-testid="progress">{stats.completed} / 7일 · {stats.percent}%</strong><span data-testid="streak">연속 {stats.streak}일</span></div>
      </div>
    </section>
    <section className="ledger" aria-label="날짜별 숙어 기록">
      <nav className="date-rail" aria-label="챌린지 날짜">
        <h2>10월</h2>
        {DAYS.map((key,index)=>{
          const date=dayDate(key),record=store.records[key];
          return <button key={key} className={`date-row ${selected===key?'selected':''} ${key>today?'future':''}`} aria-label={`${date.getMonth()+1}월 ${date.getDate()}일 ${week[date.getDay()]}요일, Day ${index+1}${key===today?', 오늘':''}${key>today?', 기록 불가':''}`} aria-pressed={selected===key} aria-current={key===today?'date':undefined} onClick={()=>{setSelected(key);setError('');}}>
            <span className="date-number">{date.getDate()}<small>{week[date.getDay()]}</small></span>
            <span className={`date-status ${record?.status??''}`} aria-label={key>today?'미래 날짜':record?.status?labels[record.status]:'미기록'}>{key>today?<LockClosedIcon/>:record?.status?<StatusIcon status={record.status}/>:<StatusIcon status={null}/>}</span>
          </button>;
        })}
      </nav>
      <div className="record-pane">
        <div className="record-heading"><h2>{selected===today?'오늘':short}</h2><span className={entry.status?'status-label '+entry.status:'status-label'} data-testid="record-status">{entry.status?labels[entry.status]:'아직 기록 없음'}</span></div>
        <div className="idiom-fields">
          {entry.idioms.map((text,index)=><label className="idiom-field" key={index}><span>숙어 {index+1}</span><div className="input-wrap"><input aria-label={`숙어 ${index+1}`} value={text} readOnly={!editable} autoComplete="off" placeholder={editable?'숙어 입력':'기록 없음'} onChange={e=>input(index,e.target.value)}/>{editable&&text&&<button type="button" aria-label={`숙어 ${index+1} 지우기`} onClick={()=>input(index,'')}><CrossCircledIcon/></button>}</div></label>)}
        </div>
        <div className="record-actions" role="group" aria-label="수행 상태 기록">
          {(['complete','minimum','missed'] as const).map(status=><button key={status} type="button" className={`action ${status} ${entry.status===status?'active':''}`} disabled={!editable} aria-pressed={entry.status===status} onClick={()=>change({...entry,status})}>{entry.status===status&&<CheckIcon/>}{labels[status]}</button>)}
        </div>
        <p className="record-footnote">{selected>today?'미래 날짜는 기록할 수 없습니다.':!editable?'지난 기록 · 보기만 가능':'날짜를 눌러 숙어 보기'}</p>
        {error&&<p role="alert" className="error">{error}</p>}
      </div>
    </section>
    <footer className="footer"><span>10.17 — 10.23 · 7일</span><Dialog.Root open={resetOpen} onOpenChange={setResetOpen}><Dialog.Trigger asChild><button className="reset-trigger">기록 초기화</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="reset-dialog"><Dialog.Title>기록을 초기화할까요?</Dialog.Title><Dialog.Description>7일의 숙어와 수행 기록이 모두 삭제됩니다.</Dialog.Description><div className="dialog-actions"><Dialog.Close asChild><button>취소</button></Dialog.Close><button className="confirm-reset" onClick={reset}>초기화</button></div>{error&&<p role="alert" className="error">{error}</p>}</Dialog.Content></Dialog.Portal></Dialog.Root></footer>
  </main>;
}
