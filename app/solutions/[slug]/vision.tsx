'use client';
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import type {LucideIcon} from 'lucide-react';
import {User,BoxSelect,HardHat,Truck,Activity,Gauge,PackageX,ShieldAlert,Radio,BarChart3,SlidersHorizontal,ClipboardList,ArrowRight,Check,Send} from 'lucide-react';

type RuleId='person'|'zone'|'ppe'|'vehicle'|'fall'|'speed'|'spill';
type Sev='critical'|'warning'|'info';
type Status='Open'|'Acknowledged'|'Resolved';
type Box={x:number;y:number;w:number;h:number};
type Alert={id:number;type:RuleId;title:string;detail:string;time:string;sev:Sev};
type Incident=Alert&{status:Status;conf:number};
type RuleState=Record<RuleId,{on:boolean;sens:number}>;

const SEV:Record<Sev,{label:string;color:string}>={critical:{label:'Critical',color:'#f87171'},warning:{label:'Warning',color:'#fbbf24'},info:{label:'Info',color:'#a78bfa'}};

// Boxes are percentages of the camera frame and are illustrative.
const RULES:{id:RuleId;name:string;desc:string;sev:Sev;icon:LucideIcon;model:string;ms:number;box:Box}[]=[
 {id:'person',name:'Person detection',desc:'Detect and track people in view',sev:'info',icon:User,model:'Person detector',ms:12,box:{x:34,y:15.5,w:18.5,h:75}},
 {id:'zone',name:'Restricted zone breach',desc:'Alert when someone enters a marked exclusion zone',sev:'critical',icon:BoxSelect,model:'Zone intrusion',ms:9,box:{x:52,y:54,w:38,h:32}},
 {id:'ppe',name:'PPE compliance',desc:'Hard hat and hi-vis vest verification',sev:'warning',icon:HardHat,model:'PPE classifier',ms:18,box:{x:37,y:19,w:14,h:38}},
 {id:'vehicle',name:'Vehicle & forklift detection',desc:'Track vehicles and loading bay activity',sev:'info',icon:Truck,model:'Vehicle detector',ms:15,box:{x:53,y:27,w:6.5,h:18}},
 {id:'fall',name:'Fall & slip detection',desc:'Detect a person down or an abnormal posture',sev:'critical',icon:Activity,model:'Pose estimation',ms:21,box:{x:34,y:15.5,w:18.5,h:75}},
 {id:'speed',name:'Forklift speed limits',desc:'Flag vehicles above the zone speed limit',sev:'warning',icon:Gauge,model:'Motion tracking',ms:14,box:{x:48,y:30,w:28,h:50}},
 {id:'spill',name:'Spill & obstruction',desc:'Detect pallets, debris or liquids in walkways',sev:'warning',icon:PackageX,model:'Floor scan',ms:17,box:{x:38,y:78,w:32,h:18}}
];
const ruleOf=(id:RuleId)=>RULES.find(r=>r.id===id)!;

const TEMPLATES:Record<RuleId,{title:string;detail:string}[]>={
 person:[{title:'Person Detected',detail:'Warehouse – Aisle 3'},{title:'Person Detected',detail:'Warehouse – Aisle 5'}],
 zone:[{title:'Zone Breach',detail:'Restricted Area – Bay 2'}],
 ppe:[{title:'PPE Violation',detail:'No hi-vis vest · Dock 1'},{title:'PPE Violation',detail:'No hard hat · Aisle 4'}],
 vehicle:[{title:'Vehicle Detected',detail:'Loading Bay'},{title:'Forklift Detected',detail:'Aisle 2'}],
 fall:[{title:'Fall Detected',detail:'Aisle 5 – person down'}],
 speed:[{title:'Speed Limit Exceeded',detail:'Forklift 8.4 km/h in a 5 km/h zone'}],
 spill:[{title:'Obstruction Detected',detail:'Pallet in walkway · Aisle 2'}]
};

const fmt=(s:number)=>[Math.floor(s/3600)%24,Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');
const T0=10*3600+24*60+32;
const seedAlerts:Alert[]=[
 {id:4,type:'person',...TEMPLATES.person[0],time:fmt(T0),sev:'info'},
 {id:3,type:'zone',...TEMPLATES.zone[0],time:fmt(T0-4),sev:'critical'},
 {id:2,type:'ppe',...TEMPLATES.ppe[0],time:fmt(T0-34),sev:'warning'},
 {id:1,type:'vehicle',...TEMPLATES.vehicle[0],time:fmt(T0-51),sev:'info'}
];
const seedIncidents:Incident[]=[
 {id:106,type:'zone',...TEMPLATES.zone[0],time:fmt(T0-4),sev:'critical',status:'Open',conf:97},
 {id:105,type:'ppe',...TEMPLATES.ppe[0],time:fmt(T0-34),sev:'warning',status:'Acknowledged',conf:94},
 {id:104,type:'speed',...TEMPLATES.speed[0],time:fmt(T0-1260),sev:'warning',status:'Resolved',conf:91},
 {id:103,type:'fall',...TEMPLATES.fall[0],time:fmt(T0-3900),sev:'critical',status:'Resolved',conf:96},
 {id:102,type:'spill',...TEMPLATES.spill[0],time:fmt(T0-7800),sev:'warning',status:'Resolved',conf:89},
 {id:101,type:'ppe',...TEMPLATES.ppe[1],time:fmt(T0-10200),sev:'warning',status:'Resolved',conf:93}
];

const ANALYTICS={
 Today:{labels:['06:00','08:00','10:00','12:00','14:00','16:00','18:00'],people:[22,38,60,74,68,82,46],vehicles:[14,28,42,55,50,62,32],violations:[4,8,14,24,18,20,9]},
 '7D':{labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],people:[62,70,66,78,74,40,28],vehicles:[48,52,50,60,58,30,20],violations:[16,12,18,14,20,6,4]},
 '30D':{labels:['W1','W2','W3','W4'],people:[64,68,72,76],vehicles:[50,53,57,60],violations:[22,18,14,10]}
} as const;
type Period=keyof typeof ANALYTICS;
const HEAT_ZONES=['Aisle 1','Aisle 3','Aisle 5','Loading bay','Dock 1'];
const HEAT=[[10,25,40,55,50,60,25],[14,38,62,80,72,66,30],[8,20,35,48,44,52,20],[5,30,70,64,58,76,40],[2,12,28,34,30,38,15]];
const BY_TYPE:[RuleId,number][]=[['ppe',11],['zone',6],['spill',5],['speed',4],['fall',1]];
const CHANNELS=['Dashboard','Email','SMS','Webhook'];

function Spark({data,color}:{data:number[];color:string}){
 const max=Math.max(...data),min=Math.min(...data);
 const pts=data.map((v,i)=>`${(i/(data.length-1))*100},${26-((v-min)/(max-min||1))*22}`).join(' ');
 return <svg viewBox="0 0 100 30" className="cv-spark" preserveAspectRatio="none" aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke"/></svg>;
}

function Trend({labels,series}:{labels:string[];series:{name:string;data:number[];color:string}[]}){
 const [hover,setHover]=useState<number|null>(null);
 const W=640,H=240,P=30,n=labels.length;
 const x=(i:number)=>P+(i*(W-2*P))/(n-1),y=(v:number)=>H-P-(v/100)*(H-2*P);
 const path=(d:readonly number[])=>d.map((v,i)=>`${i?'L':'M'}${x(i)} ${y(v)}`).join(' ');
 return <div className="cv-trend"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Detections over time">
  {[0,25,50,75,100].map(g=><line key={g} x1={P} x2={W-P} y1={y(g)} y2={y(g)} stroke="#ffffff12"/>)}
  {series.map(s=><g key={s.name}><path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>{s.data.map((v,j)=><circle key={j} cx={x(j)} cy={y(v)} r={hover===j?5:2.5} fill="#0f0a2e" stroke={s.color} strokeWidth="2"/>)}</g>)}
  {labels.map((l,i)=><text key={i} x={x(i)} y={H-8} textAnchor="middle" fontSize="10" fill="#8d87b5">{l}</text>)}
  {hover!==null&&<line x1={x(hover)} x2={x(hover)} y1={P-8} y2={H-P} stroke="#ffffff30" strokeDasharray="4 4"/>}
  {labels.map((_,i)=><rect key={i} x={x(i)-(W-2*P)/(n-1)/2} y={0} width={(W-2*P)/(n-1)} height={H} fill="transparent" onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}/>)}
 </svg>
 {hover!==null&&<div className="cv-tip"><b>{labels[hover]}</b>{series.map(s=><span key={s.name}><i style={{background:s.color}}/>{s.name}: {s.data[hover]}</span>)}</div>}
 <div className="cv-legend">{series.map(s=><span key={s.name}><i style={{background:s.color}}/>{s.name}</span>)}</div></div>;
}

function Switch({on,onChange,label}:{on:boolean;onChange:()=>void;label:string}){
 return <button type="button" role="switch" aria-checked={on} aria-label={label} className={on?'cv-switch on':'cv-switch'} onClick={onChange}><i/></button>;
}

export function VisionShowcase(){
 const [tab,setTab]=useState<'live'|'analytics'|'rules'|'incidents'>('live');
 const [rules,setRules]=useState<RuleState>(()=>Object.fromEntries(RULES.map(r=>[r.id,{on:true,sens:r.id==='fall'?80:85}])) as RuleState);
 const [alerts,setAlerts]=useState<Alert[]>(seedAlerts);
 const [incidents,setIncidents]=useState<Incident[]>(seedIncidents);
 const [clock,setClock]=useState(T0+8),[tick,setTick]=useState(0);
 const [series,setSeries]=useState(()=>({people:Array.from({length:24},(_,i)=>23+Math.round(Math.sin(i/2)*3)),vehicles:Array.from({length:24},(_,i)=>12+Math.round(Math.cos(i/3)*2)),viol:Array.from({length:24},(_,i)=>2+Math.round(Math.sin(i)*1.5)),falls:Array.from({length:24},(_,i)=>(i%7===3?1:0)+Math.round(Math.abs(Math.sin(i/2))))}));
 const [focus,setFocus]=useState<{type:RuleId;n:number}|null>(null);
 const [layers,setLayers]=useState({heat:false,ppe:true,zones:false,track:false});
 const [sevFilter,setSevFilter]=useState<'all'|Sev>('all');
 const [statusFilter,setStatusFilter]=useState<'All'|Status>('All');
 const [sel,setSel]=useState(106),[period,setPeriod]=useState<Period>('Today');
 const [routing,setRouting]=useState<Record<Sev,boolean[]>>({critical:[true,true,true,true],warning:[true,true,false,false],info:[true,false,false,false]});
 const [note,setNote]=useState('');
 const rulesRef=useRef(rules),clockRef=useRef(clock),idRef=useRef(5),incRef=useRef(107),tplRef=useRef(0),focusN=useRef(0);
 rulesRef.current=rules;clockRef.current=clock;

 const fire=(type:RuleId)=>{
  const rule=ruleOf(type),list=TEMPLATES[type],tpl=list[tplRef.current++%list.length];
  const time=fmt(clockRef.current),id=idRef.current++,iid=incRef.current++,conf=Math.round(88+Math.random()*10);
  setAlerts(a=>[{id,type,...tpl,time,sev:rule.sev},...a].slice(0,30));
  if(rule.sev!=='info')setIncidents(i=>[{id:iid,type,...tpl,time,sev:rule.sev,status:'Open' as Status,conf},...i].slice(0,30));
  setFocus({type,n:++focusN.current});
 };

 useEffect(()=>{const t=setInterval(()=>setTick(n=>n+1),1000);return()=>clearInterval(t)},[]);
 useEffect(()=>{
  if(tick===0)return;
  setClock(c=>c+1);
  if(tick%2===0)setSeries(s=>{const nx=(a:number[],lo:number,hi:number,st:number)=>[...a.slice(-23),Math.min(hi,Math.max(lo,a[a.length-1]+Math.round((Math.random()*2-1)*st)))];return{people:nx(s.people,18,30,2),vehicles:nx(s.vehicles,9,15,1),viol:nx(s.viol,0,6,2),falls:nx(s.falls,0,3,1)}});
  if(tick%5===0){
   const on=RULES.filter(r=>rulesRef.current[r.id].on);if(!on.length)return;
   const r=on[Math.floor(Math.random()*on.length)];
   if(Math.random()<0.4+rulesRef.current[r.id].sens/200)fire(r.id);
  }
 },[tick]);
 useEffect(()=>{if(!focus)return;const t=setTimeout(()=>setFocus(null),3200);return()=>clearTimeout(t)},[focus]);

 const on=(id:RuleId)=>rules[id].on;
 const enabled=RULES.filter(r=>on(r.id));
 const acc=enabled.length?Math.floor(90+enabled.reduce((a,r)=>a+rules[r.id].sens,0)/enabled.length*0.1):0;
 const openCount=incidents.filter(i=>i.status==='Open').length;
 const violations=incidents.filter(i=>['zone','ppe','speed','spill'].includes(i.type)).length;
 const falls=incidents.filter(i=>i.type==='fall').length;
 const insight=[
  ['People Detected Live',on('person')?series.people[series.people.length-1]:null,User,'#a78bfa',series.people],
  ['Safety Violations Detected',on('zone')||on('ppe')?violations:null,ShieldAlert,'#f87171',series.viol],
  ['Falls Detected',on('fall')?falls:null,Activity,'#fbbf24',series.falls],
  ['Vehicles Detected Live',on('vehicle')?series.vehicles[series.vehicles.length-1]:null,Truck,'#60a5fa',series.vehicles]
 ] as const;
 const shownAlerts=alerts.filter(a=>sevFilter==='all'||a.sev===sevFilter).slice(0,6);
 const selected=incidents.find(i=>i.id===sel)||incidents[0];
 const setStatus=(id:number,status:Status)=>setIncidents(l=>l.map(i=>i.id===id?{...i,status}:i));
 const toggleRule=(id:RuleId)=>setRules(r=>({...r,[id]:{...r[id],on:!r[id].on}}));
 const sendTest=()=>{const r=enabled.find(x=>x.sev==='critical')||enabled[0];if(!r){setNote('Enable at least one detection first.');return}fire(r.id);setNote(`Test alert sent: ${ruleOf(r.id).name}. See Live alerts and Incidents.`)};
 const A=ANALYTICS[period];
 const trendSeries=[
  ...(on('person')?[{name:'People',data:[...A.people],color:'#a78bfa'}]:[]),
  ...(on('vehicle')?[{name:'Vehicles',data:[...A.vehicles],color:'#60a5fa'}]:[]),
  ...(enabled.some(r=>r.sev!=='info')?[{name:'Violations',data:[...A.violations],color:'#f87171'}]:[])
 ];
 const hl=focus?ruleOf(focus.type):null;
 const tabs=[['live','Live monitoring',Radio],['analytics','Analytics',BarChart3],['rules','Detection rules',SlidersHorizontal],['incidents','Incidents',ClipboardList]] as const;

 return <div className="cv-app">
  <div className="cv-top"><span className="cv-title"><i/> LIVE MONITORING</span>
   <div className="cv-tabs" role="tablist">{tabs.map(([id,l,Icon])=><button type="button" role="tab" aria-selected={tab===id} key={id} className={tab===id?'on':''} onClick={()=>setTab(id)}><Icon size={14}/>{l}{id==='incidents'&&openCount>0&&<b>{openCount}</b>}</button>)}</div>
   <span className="cv-liveflag"><i/> LIVE</span></div>

  {tab==='live'&&<div className="cv-grid">
   <section className="cv-panel cv-feedwrap"><div className="cv-feed">
    <Image src="/images/computer-vision-feed.webp" alt="Warehouse aisle camera feed with a detected person wearing a hard hat and hi-vis vest and a highlighted restricted zone" width={870} height={510} priority/>
    <svg className="cv-ov" viewBox="0 0 870 510" preserveAspectRatio="none" aria-hidden="true">
     <defs><radialGradient id="cvheat"><stop offset="0" stopColor="#ff3b30" stopOpacity=".7"/><stop offset=".55" stopColor="#ffb020" stopOpacity=".3"/><stop offset="1" stopColor="#ffb020" stopOpacity="0"/></radialGradient></defs>
     {layers.heat&&<g style={{mixBlendMode:'screen'}}>{[[470,390,170],[560,330,120],[380,440,130],[640,420,100]].map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r} fill="url(#cvheat)"/>)}</g>}
     {layers.zones&&<g fontSize="12" fontWeight="700"><polygon points="190,505 700,505 530,240 468,240" fill="#34d39922" stroke="#34d399" strokeDasharray="6 5" strokeWidth="2"/><text x="215" y="490" fill="#6ee7b7">AISLE WALKWAY · PEDESTRIAN</text><polygon points="455,150 515,150 515,232 455,232" fill="#fbbf2422" stroke="#fbbf24" strokeDasharray="6 5" strokeWidth="2"/><text x="446" y="142" fill="#fcd34d">LOADING BAY</text></g>}
     {layers.track&&<g><line x1="228" y1="190" x2="298" y2="210" stroke="#c4b5fd" strokeWidth="1.5"/><circle cx="298" cy="210" r="3.5" fill="#c4b5fd"/></g>}
    </svg>
    {layers.track&&<div className="cv-chip" style={{left:'6%',top:'30%'}}>ID #4821 · 1.1 m/s<small>Aisle 3 · tracked 00:42</small></div>}
    {layers.ppe&&<div className="cv-chips" style={{left:'54%',top:'20%'}}><span><Check size={11}/> Hard hat 98%</span><span><Check size={11}/> Hi-vis vest 97%</span></div>}
    {hl&&focus&&<div className="cv-hl" key={focus.n} style={{left:hl.box.x+'%',top:hl.box.y+'%',width:hl.box.w+'%',height:hl.box.h+'%'}}><span>{hl.name}</span></div>}
    <div className="cv-time">{fmt(clock)} · 30 FPS · 1080p</div>
    <div className="cv-layers" role="group" aria-label="Overlay layers">{([['heat','Heatmap'],['ppe','PPE'],['zones','Zones'],['track','Tracking']] as const).map(([k,l])=><button type="button" key={k} aria-pressed={layers[k]} className={layers[k]?'on':''} onClick={()=>setLayers(s=>({...s,[k]:!s[k]}))}>{l}</button>)}</div>
   </div></section>

   <section className="cv-panel cv-alerts"><div className="cv-head"><h4>Live alerts</h4><div className="cv-filter">{(['all','critical','warning','info'] as const).map(s=><button type="button" key={s} className={sevFilter===s?'on':''} onClick={()=>setSevFilter(s)}>{s==='all'?'All':SEV[s].label}</button>)}</div></div>
    <ul>{shownAlerts.map(a=>{const R=ruleOf(a.type);return <li key={a.id}><button type="button" onClick={()=>setFocus({type:a.type,n:++focusN.current})}><span className="cv-ico" style={{color:SEV[a.sev].color,background:SEV[a.sev].color+'1f'}}><R.icon size={18}/></span><span className="cv-atext"><b style={{color:SEV[a.sev].color}}>{a.title}</b><small>{a.detail}</small></span><time>{a.time}</time></button></li>})}{!shownAlerts.length&&<li className="cv-empty">No alerts for this filter.</li>}</ul>
    <button type="button" className="cv-wide" onClick={()=>setTab('incidents')}>View all alerts <ArrowRight size={14}/></button></section>

   <section className="cv-panel cv-insights"><div className="cv-head"><h4>Real-time insights</h4></div><div className="cv-cards">{insight.map(([label,val,Icon,color,data])=><div key={label}><span className="cv-ico" style={{color,background:color+'1f'}}><Icon size={17}/></span><strong>{val===null?'—':String(val).padStart(2,'0')}</strong><small>{label}</small><Spark data={[...data]} color={color}/></div>)}</div></section>

   <section className="cv-panel cv-status"><div className="cv-head"><h4>AI detection status</h4></div><div className="cv-acc"><svg viewBox="0 0 120 120" role="img" aria-label={`Accuracy ${acc} percent`}><circle cx="60" cy="60" r="48" fill="none" stroke="#ffffff14" strokeWidth="12"/><circle cx="60" cy="60" r="48" fill="none" stroke="#a78bfa" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${acc/100*301.6} 301.6`} transform="rotate(-90 60 60)"/><text x="60" y="67" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">{acc}%</text></svg>
     <div><b>Accuracy rate</b><p><i className="g"/> High confidence</p><p><i className="g"/> {enabled.length}/{RULES.length} AI models active</p></div></div>
     <ul className="cv-models">{RULES.map(r=><li key={r.id} className={on(r.id)?'':'off'}><i/>{r.model}<em>{on(r.id)?r.ms+' ms':'paused'}</em></li>)}</ul></section>
  </div>}

  {tab==='analytics'&&<div className="cv-stack">
   <div className="cv-row"><div className="cv-filter">{(Object.keys(ANALYTICS) as Period[]).map(p=><button type="button" key={p} className={period===p?'on':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
   <div className="cv-kpis">{[['Compliance rate','96.4%','+1.8%'],['Avg. response time','38 s','-6 s'],['Incidents resolved','92%','+4%'],['Near-misses detected','7','-2']].map(([k,v,d])=><div className="cv-panel" key={k}><small>{k}</small><strong>{v}</strong><em>{d} vs previous</em></div>)}</div>
   <div className="cv-two"><section className="cv-panel"><div className="cv-head"><h4>Detections over time</h4></div>{trendSeries.length?<Trend labels={[...A.labels]} series={trendSeries}/>:<p className="cv-empty">Enable a detection rule to see data.</p>}</section>
    <section className="cv-panel"><div className="cv-head"><h4>Violations by type</h4></div><ul className="cv-bars">{BY_TYPE.filter(([id])=>on(id)).map(([id,v])=>{const R=ruleOf(id);return <li key={id}><span><R.icon size={14}/> {R.name}</span><div><i style={{width:(v/11)*100+'%',background:SEV[R.sev].color}}/></div><b>{v}</b></li>})}</ul></section></div>
   <section className="cv-panel"><div className="cv-head"><h4>Zone activity heatmap</h4><small>People per zone, by hour</small></div><div className="cv-heat"><div className="cv-heatrow"><span/>{['06','08','10','12','14','16','18'].map(h=><span key={h} className="hh">{h}:00</span>)}</div>{HEAT_ZONES.map((z,r)=><div key={z} className="cv-heatrow"><span className="hz">{z}</span>{HEAT[r].map((v,c)=><span key={c} className="hc" title={`${z} · ${v}`} style={{background:`rgba(167,139,250,${0.08+v/100*0.85})`}}>{v}</span>)}</div>)}</div></section>
  </div>}

  {tab==='rules'&&<div className="cv-two cv-rules">
   <section className="cv-panel"><div className="cv-head"><h4>Detection rules</h4><small>{enabled.length} of {RULES.length} active</small></div><ul>{RULES.map(r=><li key={r.id} className={on(r.id)?'':'off'}><span className="cv-ico" style={{color:SEV[r.sev].color,background:SEV[r.sev].color+'1f'}}><r.icon size={17}/></span><div className="cv-rtext"><b>{r.name}</b><small>{r.desc}</small></div><label className="cv-sens"><span>Sensitivity {rules[r.id].sens}%</span><input type="range" min={50} max={99} value={rules[r.id].sens} disabled={!on(r.id)} aria-label={`${r.name} sensitivity`} onChange={e=>{const v=Number(e.target.value);setRules(s=>({...s,[r.id]:{...s[r.id],sens:v}}))}}/></label><em style={{color:SEV[r.sev].color}}>{SEV[r.sev].label}</em><Switch on={on(r.id)} label={`Toggle ${r.name}`} onChange={()=>toggleRule(r.id)}/></li>)}</ul></section>
   <section className="cv-panel"><div className="cv-head"><h4>Alert routing</h4></div><table className="cv-route"><thead><tr><th/>{CHANNELS.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{(['critical','warning','info'] as const).map(s=><tr key={s}><td style={{color:SEV[s].color}}>{SEV[s].label}</td>{routing[s].map((v,i)=><td key={i}><Switch on={v} label={`${SEV[s].label} via ${CHANNELS[i]}`} onChange={()=>setRouting(r=>({...r,[s]:r[s].map((x,j)=>j===i?!x:x)}))}/></td>)}</tr>)}</tbody></table>
    <button type="button" className="cv-wide primary" onClick={sendTest}><Send size={14}/> Send test alert</button>{note&&<p className="cv-note" role="status">{note}</p>}
    <p className="cv-hint">Turning a detection off pauses its model, removes its insight on the live view and stops new alerts.</p></section>
  </div>}

  {tab==='incidents'&&<div className="cv-two cv-inc">
   <section className="cv-panel"><div className="cv-head"><h4>Incident log</h4><div className="cv-filter">{(['All','Open','Acknowledged','Resolved'] as const).map(s=><button type="button" key={s} className={statusFilter===s?'on':''} onClick={()=>setStatusFilter(s)}>{s}</button>)}</div></div>
    <table className="cv-table"><thead><tr><th>Time</th><th>Incident</th><th>Severity</th><th>Status</th></tr></thead><tbody>{incidents.filter(i=>statusFilter==='All'||i.status===statusFilter).map(i=><tr key={i.id} className={i.id===selected.id?'on':''} tabIndex={0} onClick={()=>setSel(i.id)} onKeyDown={e=>{if(e.key==='Enter')setSel(i.id)}}><td>{i.time}</td><td><b>{i.title}</b><small>{i.detail}</small></td><td style={{color:SEV[i.sev].color}}>{SEV[i.sev].label}</td><td><span className={'cv-st '+i.status}>{i.status}</span></td></tr>)}</tbody></table></section>
   <section className="cv-panel">{selected&&(()=>{const R=ruleOf(selected.type),b=R.box,asp=(b.w*870)/(b.h*510);return <>
    <div className="cv-head"><h4>{selected.title}</h4><span className={'cv-st '+selected.status}>{selected.status}</span></div>
    <div className="cv-snap" style={{aspectRatio:String(asp),width:`min(100%,${Math.round(asp*210)}px)`,backgroundImage:'url(/images/computer-vision-feed.webp)',backgroundSize:`${10000/b.w}% auto`,backgroundPosition:`${b.x/(100-b.w)*100}% ${b.y/(100-b.h)*100}%`}} role="img" aria-label="Incident snapshot"><span>{selected.time} · {Math.round(selected.conf)}%</span></div>
    <dl className="cv-dl"><dt>Camera</dt><dd>CAM 02 – Warehouse</dd><dt>Location</dt><dd>{selected.detail}</dd><dt>Model</dt><dd>{R.model}</dd><dt>Confidence</dt><dd>{selected.conf}%</dd></dl>
    <ol className="cv-line">{(['Detected','Alert sent','Acknowledged','Resolved'] as const).map((s,i)=>{const lvl=selected.status==='Open'?1:selected.status==='Acknowledged'?2:3;return <li key={s} className={i<=lvl?'done':''}><span/>{s}</li>})}</ol>
    <div className="cv-actions"><button type="button" disabled={selected.status!=='Open'} onClick={()=>setStatus(selected.id,'Acknowledged')}>Acknowledge</button><button type="button" className="primary" disabled={selected.status==='Resolved'} onClick={()=>setStatus(selected.id,'Resolved')}>Resolve</button></div></>})()}</section>
  </div>}
  <p className="demo-disclaimer cv-note2">Illustrative visualization. Detections, counts and alerts are simulated—not real camera inference or validated safety monitoring.</p>
 </div>;
}
