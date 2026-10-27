'use client';
import {useEffect,useState} from 'react';
import {LayoutDashboard,Database,ShieldCheck,Table2,TrendingUp,Bell,FileText,Settings,Search,Send,Check,AlertTriangle,Truck,Package,Play,Sparkles,ArrowRight} from 'lucide-react';

const BLUE='#6d4aff',TEAL='#14b8a6',VIOLET='#a78bfa',AMBER='#f59e0b',ROSE='#ef4444';

function Spark({data,color}:{data:number[];color:string}){
 const max=Math.max(...data),min=Math.min(...data);
 const pts=data.map((v,i)=>`${(i/(data.length-1))*100},${28-((v-min)/(max-min||1))*24}`).join(' ');
 return <svg viewBox="0 0 100 30" className="sx-spark" preserveAspectRatio="none" aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>;
}

function LineChart({labels,series}:{labels:string[];series:{name:string;data:number[];color:string}[]}){
 const [hover,setHover]=useState<number|null>(null);
 const W=620,H=230,P=28,n=labels.length;
 const x=(i:number)=>P+(i*(W-2*P))/(n-1),y=(v:number)=>H-P-(v/100)*(H-2*P);
 const path=(d:number[])=>d.map((v,i)=>`${i?'L':'M'}${x(i)} ${y(v)}`).join(' ');
 return <div className="sx-chart"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trend chart">
  <defs>{series.map((s,i)=><linearGradient key={i} id={`g${i}${s.color.slice(1)}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity=".18"/><stop offset="1" stopColor={s.color} stopOpacity="0"/></linearGradient>)}</defs>
  {[0,25,50,75,100].map(g=><line key={g} x1={P} x2={W-P} y1={y(g)} y2={y(g)} stroke="#e6edf5"/>)}
  {series.map((s,i)=><g key={s.name}><path d={`${path(s.data)} L${x(n-1)} ${y(0)} L${x(0)} ${y(0)}Z`} fill={`url(#g${i}${s.color.slice(1)})`}/><path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>{s.data.map((v,j)=><circle key={j} cx={x(j)} cy={y(v)} r={hover===j?5:2.5} fill="#fff" stroke={s.color} strokeWidth="2"/>)}</g>)}
  {labels.map((l,i)=><text key={i} x={x(i)} y={H-8} textAnchor="middle" fontSize="10" fill="#7b8aa0">{l}</text>)}
  {hover!==null&&<line x1={x(hover)} x2={x(hover)} y1={P-8} y2={H-P} stroke="#b9cde0" strokeDasharray="4 4"/>}
  {labels.map((_,i)=><rect key={i} x={x(i)-(W-2*P)/(n-1)/2} y={0} width={(W-2*P)/(n-1)} height={H} fill="transparent" onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}/>)}
 </svg>
 {hover!==null&&<div className="sx-tip"><b>{labels[hover]}</b>{series.map(s=><span key={s.name}><i style={{background:s.color}}/>{s.name}: {s.data[hover]}</span>)}</div>}
 <div className="sx-legend">{series.map(s=><span key={s.name}><i style={{background:s.color}}/>{s.name}</span>)}</div></div>;
}

function Donut({parts,center,sub}:{parts:{name:string;value:number;color:string}[];center:string;sub:string}){
 const total=parts.reduce((a,b)=>a+b.value,0);let acc=0;const R=52,C=2*Math.PI*R;
 return <div className="sx-donut"><svg viewBox="0 0 140 140" role="img" aria-label="Distribution chart"><circle cx="70" cy="70" r={R} fill="none" stroke="#eef3f9" strokeWidth="18"/>{parts.map(p=>{const len=(p.value/total)*C;const el=<circle key={p.name} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${len-2} ${C-len+2}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)"/>;acc+=len;return el})}<text x="70" y="68" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0d203d">{center}</text><text x="70" y="84" textAnchor="middle" fontSize="9" fill="#7b8aa0">{sub}</text></svg>
 <ul>{parts.map(p=><li key={p.name}><i style={{background:p.color}}/><span>{p.name}</span><b>{Math.round((p.value/total)*100)}%</b></li>)}</ul></div>;
}

const periods={
 '7D':{labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],rev:[38,46,43,58,55,72,78],ord:[30,38,36,47,45,60,64],kpis:[['Total revenue','$412K','+8.2%',[4,5,4,6,6,7,8]],['Orders','12,840','+5.1%',[5,4,6,6,7,7,8]],['Avg. order value','$32.10','+2.9%',[6,6,7,6,7,8,8]],['New customers','1,512','+6.4%',[3,5,4,6,7,6,9]]],channels:[38,28,18,10,6]},
 '30D':{labels:['W1','W2','W3','W4','W5'],rev:[34,48,52,66,81],ord:[28,40,47,55,69],kpis:[['Total revenue','$1.68M','+14.8%',[3,4,5,6,7,9,10]],['Orders','54,210','+11.3%',[4,5,5,7,8,8,10]],['Avg. order value','$31.02','+3.1%',[6,6,7,7,7,8,8]],['New customers','6,204','+12.7%',[2,4,5,6,7,9,10]]],channels:[37,29,18,10,6]},
 '90D':{labels:['Jan','Feb','Mar','Apr','May','Jun'],rev:[30,41,52,58,74,90],ord:[26,36,45,52,63,76],kpis:[['Total revenue','$4.9M','+21.6%',[2,3,5,6,8,10,12]],['Orders','158,430','+18.3%',[3,4,5,7,9,10,12]],['Avg. order value','$30.94','+2.8%',[6,6,7,7,8,8,9]],['New customers','18,420','+24.7%',[2,3,5,6,8,10,12]]],channels:[38,28,17,11,6]}
} as const;
type Period=keyof typeof periods;
const channelMeta=[['Website',BLUE],['Mobile app',VIOLET],['Marketplace',TEAL],['Retail partners',AMBER],['Other','#94a3b8']] as const;
const products=[['Wireless headphones',92,BLUE],['Smart watch',78,VIOLET],['Laptop stand',64,TEAL],['Bluetooth speaker',52,AMBER],['Portable charger',41,'#94a3b8']] as const;
const pipeline=['Collect data','Clean & validate','Analyze','Generate reports','Update dashboard'];

export function DashboardShowcase({variant}:{variant:'executive'|'predictive'}){
 const [period,setPeriod]=useState<Period>('30D');
 const [step,setStep]=useState(5),[running,setRunning]=useState(false);
 const d=periods[period];const predictive=variant==='predictive';
 useEffect(()=>{if(!running)return;const t=setInterval(()=>setStep(s=>s+1),650);return()=>clearInterval(t)},[running]);
 useEffect(()=>{if(step>=5)setRunning(false)},[step]);
 const run=()=>{setStep(0);setRunning(true)};
 const nav=[[LayoutDashboard,'Overview'],[Database,'Data sources'],[ShieldCheck,'Data health'],[Table2,'SQL explorer'],[TrendingUp,'Forecasting'],[Bell,'Alerts'],[FileText,'Reports'],[Settings,'Settings']] as const;
 const forecast=[...d.rev.slice(-3),Math.min(98,d.rev[d.rev.length-1]+6),Math.min(99,d.rev[d.rev.length-1]+11)];
 return <div className="sx-app">
  <aside className="sx-side"><div className="sx-logo"><Sparkles size={16}/> Command Center</div>{nav.map(([Icon,t],i)=><button type="button" key={t} className={i===(predictive?4:0)?'on':''}><Icon size={15}/>{t}</button>)}</aside>
  <div className="sx-main">
   <div className="sx-bar"><div className="sx-cmd"><Search size={14}/><span>{predictive?'Forecast next quarter demand with confidence bands':'Run complete analytics on this month’s e-commerce data'}</span><button type="button" onClick={run} disabled={running}><Play size={12}/> {running?'Running…':'Run analytics'}</button></div>
    <div className="scene-tabs">{(Object.keys(periods) as Period[]).map(p=><button type="button" key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
   <div className="sx-kpis">{d.kpis.map(([k,v,dl,sp],i)=><div key={k}><small>{k}</small><strong>{v}</strong><span className="up">↗ {dl}</span><Spark data={[...sp]} color={[VIOLET,TEAL,AMBER,BLUE][i]}/></div>)}</div>
   <div className="sx-row r21">
    <section className="sx-card"><h4>{predictive?'Demand forecast':'Revenue & orders trend'}</h4><LineChart labels={predictive?[...d.labels.slice(-3),'+1','+2']:[...d.labels]} series={predictive?[{name:'Forecast',data:forecast,color:VIOLET},{name:'Baseline',data:forecast.map(v=>Math.max(10,v-12)),color:'#94a3b8'}]:[{name:'Revenue',data:[...d.rev],color:VIOLET},{name:'Orders',data:[...d.ord],color:TEAL}]}/></section>
    <section className="sx-card"><h4>Revenue by channel</h4><Donut center="100%" sub="Total revenue" parts={channelMeta.map(([name,color],i)=>({name,color,value:d.channels[i]}))}/></section>
   </div>
   <div className="sx-row r111">
    <section className="sx-card"><h4>Top products</h4><ul className="sx-list">{products.map(([n,v,c],i)=><li key={n}><span>{i+1}</span><div><b>{n}</b><div className="sx-meter"><i style={{width:v+'%',background:c}}/></div></div></li>)}</ul></section>
    <section className="sx-card"><h4>Data health</h4><div className="sx-gauge"><svg viewBox="0 0 120 120" aria-label="Data quality score 93 out of 100"><circle cx="60" cy="60" r="46" fill="none" stroke="#e8f1ec" strokeWidth="12"/><circle cx="60" cy="60" r="46" fill="none" stroke={TEAL} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${0.93*289} 289`} transform="rotate(-90 60 60)"/><text x="60" y="64" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0d203d">93</text><text x="60" y="80" textAnchor="middle" fontSize="9" fill="#7b8aa0">/ 100</text></svg><ul><li><i style={{background:ROSE}}/>2 critical</li><li><i style={{background:AMBER}}/>1 warning</li><li><i style={{background:TEAL}}/>28 passed</li></ul></div></section>
    <section className="sx-card"><h4>Anomaly alerts</h4><ul className="sx-alerts"><li><AlertTriangle size={14} color={ROSE}/><span>West region revenue dipped <b>12.6%</b></span><em className="hi">High</em></li><li><AlertTriangle size={14} color={AMBER}/><span>Order spike on Oct 10 <b>+58%</b></span><em>Medium</em></li><li><AlertTriangle size={14} color={AMBER}/><span>Refund rate above average</span><em>Medium</em></li></ul></section>
   </div>
   <div className="sx-pipe"><b>Analytics pipeline</b><ol>{pipeline.map((p,i)=><li key={p} className={i<step?'done':i===step&&running?'live':''}><span>{i<step?<Check size={12}/>:i+1}</span>{p}</li>)}</ol><em>{step>=5?'Completed':'Running…'}</em></div>
  </div>
  <p className="demo-disclaimer sx-note">Interactive synthetic data for illustration, not real business analytics or model predictions.</p>
 </div>;
}

const shipments=[
 {id:'SH-4821',route:'Rotterdam → Chicago',status:'In transit',eta:'Nov 3',progress:64,a:[88,88],b:[170,70],c:[130,40]},
 {id:'SH-4822',route:'Shenzhen → Los Angeles',status:'Delayed',eta:'Nov 9',progress:41,a:[520,120],b:[40,100],c:[280,30]},
 {id:'SH-4823',route:'Hamburg → New York',status:'In transit',eta:'Nov 1',progress:82,a:[330,60],b:[145,80],c:[240,30]},
 {id:'SH-4824',route:'Mumbai → Dubai',status:'Delivered',eta:'Oct 26',progress:100,a:[430,140],b:[395,115],c:[410,110]},
 {id:'SH-4825',route:'Singapore → Sydney',status:'In transit',eta:'Nov 6',progress:37,a:[490,175],b:[545,215],c:[530,170]},
 {id:'SH-4826',route:'Santos → Lisbon',status:'Delayed',eta:'Nov 12',progress:28,a:[190,205],b:[310,95],c:[230,130]}
];
const statusColor:Record<string,string>={'In transit':BLUE,Delayed:ROSE,Delivered:TEAL};
const stock=[['SKU-1042 · Wireless sensor',3,5],['SKU-2210 · Pallet wrap',4,6],['SKU-3307 · Barcode labels',2,4],['SKU-4150 · Carton 40L',9,5],['SKU-5088 · Scanner battery',12,7]] as const;
const timeline=['Picked up','Departed origin','In transit','Customs cleared','Delivered'];

export function ControlTowerShowcase(){
 const [filter,setFilter]=useState('All'),[sel,setSel]=useState(shipments[0].id);
 const rows=shipments.filter(s=>filter==='All'||s.status===filter);
 const cur=shipments.find(s=>s.id===sel)||shipments[0];
 const at=(s:typeof shipments[number],t:number)=>{const u=1-t;return [u*u*s.a[0]+2*u*t*s.c[0]+t*t*s.b[0],u*u*s.a[1]+2*u*t*s.c[1]+t*t*s.b[1]]};
 const mk=at(cur,cur.progress/100);
 return <div className="sx-app sx-flat">
  <div className="sx-main">
   <div className="sx-bar"><div><span className="detail-eyebrow">BEACON / CONTROL TOWER</span><h3 className="sx-title">Global fulfillment overview</h3></div><div className="scene-tabs">{['All','In transit','Delayed','Delivered'].map(f=><button type="button" key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div></div>
   <div className="sx-kpis">{[['Orders shipped','1,284','+6.2%',[4,5,5,6,7,7,9],BLUE],['On-time delivery','97.8%','+1.1%',[7,7,8,7,8,9,9],TEAL],['Stockout risk','3 SKUs','-2 vs last wk',[9,8,8,6,5,4,3],ROSE],['Warehouse utilization','84%','+3.0%',[5,6,6,7,7,8,8],AMBER]].map(([k,v,dl,sp,c])=><div key={k as string}><small>{k as string}</small><strong>{v as string}</strong><span className="up">↗ {dl as string}</span><Spark data={sp as number[]} color={c as string}/></div>)}</div>
   <div className="sx-row r21">
    <section className="sx-card"><h4>Shipment network <small className="sx-sub">illustrative</small></h4>
     <svg viewBox="0 0 600 250" className="sx-map" role="img" aria-label="Illustrative shipment routes">
      <defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#d3deea"/></pattern></defs>
      <rect width="600" height="250" fill="url(#dots)" rx="12"/>
      {shipments.map(s=><g key={s.id} opacity={rows.includes(s)?1:.15}><path d={`M${s.a[0]} ${s.a[1]} Q${s.c[0]} ${s.c[1]} ${s.b[0]} ${s.b[1]}`} fill="none" stroke={s.id===cur.id?statusColor[s.status]:'#9fb4c9'} strokeWidth={s.id===cur.id?3:1.5} strokeDasharray={s.id===cur.id?'':'5 5'}/><circle cx={s.a[0]} cy={s.a[1]} r="4" fill="#0d203d"/><circle cx={s.b[0]} cy={s.b[1]} r="4" fill="#0d203d"/></g>)}
      <g><circle cx={mk[0]} cy={mk[1]} r="12" fill={statusColor[cur.status]} opacity=".2"><animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite"/></circle><circle cx={mk[0]} cy={mk[1]} r="6" fill={statusColor[cur.status]} stroke="#fff" strokeWidth="2"/></g>
     </svg>
    </section>
    <section className="sx-card"><h4>{cur.id} <em className="sx-chip" style={{color:statusColor[cur.status],background:statusColor[cur.status]+'1a'}}>{cur.status}</em></h4><p className="sx-route">{cur.route}</p><ol className="sx-timeline">{timeline.map((t,i)=><li key={t} className={cur.progress>=(i+1)*20-(i===4?0:5)?'done':''}><span/>{t}</li>)}</ol><p className="sx-eta"><Truck size={14}/> ETA {cur.eta} · {cur.progress}% complete</p></section>
   </div>
   <div className="sx-row r21">
    <section className="sx-card"><h4>Shipments</h4><table className="sx-table"><thead><tr><th>ID</th><th>Route</th><th>Status</th><th>ETA</th></tr></thead><tbody>{rows.map(s=><tr key={s.id} className={s.id===cur.id?'on':''} onClick={()=>setSel(s.id)} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')setSel(s.id)}}><td>{s.id}</td><td>{s.route}</td><td><em className="sx-chip" style={{color:statusColor[s.status],background:statusColor[s.status]+'1a'}}>{s.status}</em></td><td>{s.eta}</td></tr>)}</tbody></table></section>
    <section className="sx-card"><h4><Package size={14}/> Inventory coverage</h4><ul className="sx-list sx-stock">{stock.map(([n,days,lead])=><li key={n}><div><b>{n}</b><div className="sx-meter"><i style={{width:Math.min(100,days*8)+'%',background:days<lead?ROSE:TEAL}}/></div></div><small>{days}d / {lead}d lead</small></li>)}</ul></section>
   </div>
  </div>
  <p className="demo-disclaimer sx-note">Interactive synthetic data for illustration, not real logistics operations.</p>
 </div>;
}

const clauses=[
 {id:'c1',h:'1. Parties',t:'This Supplier Agreement is entered into by Northstar Logistics (“Supplier”) and Example Retail (“Customer”).'},
 {id:'c2',h:'2. Term',t:'The term is twelve (12) months from the Effective Date, with an option to renew for successive twelve-month periods.'},
 {id:'c3',h:'3. Payment',t:'Customer shall pay undisputed invoices within thirty (30) days of receipt (Net 30).'},
 {id:'c4',h:'4. Service levels',t:'Supplier shall meet a 98% on-time delivery target, measured monthly. Performance below 95% for two consecutive months entitles Customer to a 5% service credit.'},
 {id:'c5',h:'5. Renewal notice',t:'Either party must give written notice of non-renewal at least sixty (60) days before the end of the term.'},
 {id:'c6',h:'6. Liability',t:'Aggregate liability is capped at the fees paid in the preceding twelve (12) months.'}
];
const fields=[
 ['Parties','Northstar Logistics / Example Retail',99,'c1'],['Term','12 months, auto-renewable',98,'c2'],['Payment terms','Net 30 days',97,'c3'],
 ['On-time target','98% monthly',96,'c4'],['Service credit','5% if <95% for 2 months',91,'c4'],['Renewal notice','60 days',95,'c5'],['Liability cap','12 months of fees',84,'c6']
] as const;
const qa=[
 {q:'When must we give notice to end the agreement?',a:'Written notice of non-renewal is required at least 60 days before the end of the 12-month term.',cite:['c5','c2']},
 {q:'What happens if deliveries are late?',a:'The target is 98% on-time per month. If performance stays below 95% for two consecutive months, the customer is entitled to a 5% service credit.',cite:['c4']},
 {q:'Summarize the key obligations.',a:'Supplier: meet a 98% on-time target. Customer: pay undisputed invoices within 30 days. Both: give 60 days’ written notice to not renew. Liability is capped at 12 months of fees.',cite:['c3','c4','c5','c6']}
];

export function DocumentShowcase({variant}:{variant:'extract'|'assistant'}){
 const [tab,setTab]=useState<'extract'|'ask'>(variant==='assistant'?'ask':'extract');
 const [shown,setShown]=useState(0),[running,setRunning]=useState(false);
 const [hl,setHl]=useState<string[]>([]),[ans,setAns]=useState<number|null>(null),[text,setText]=useState('');
 useEffect(()=>{if(!running)return;const t=setInterval(()=>setShown(s=>s+1),420);return()=>clearInterval(t)},[running]);
 useEffect(()=>{if(shown>=fields.length)setRunning(false)},[shown]);
 const extract=()=>{setShown(0);setRunning(true);setHl([])};
 const ask=(i:number)=>{setAns(i);setHl([...qa[i].cite])};
 const submit=()=>{const s=text.toLowerCase();const i=s.includes('notice')||s.includes('end')?0:s.includes('late')||s.includes('deliver')||s.includes('credit')?1:2;setText('');ask(i)};
 return <div className="sx-app sx-doc">
  <div className="sx-docpane"><div className="sx-doctop"><FileText size={14}/> supplier-agreement.pdf <span>6 clauses</span></div>
   <div className="sx-page"><h3>Supplier Agreement</h3>{clauses.map(c=><p key={c.id} className={hl.includes(c.id)?'hl':''}><b>{c.h}</b> {c.t}</p>)}</div></div>
  <div className="sx-aipane">
   <div className="sx-tabs"><button type="button" className={tab==='extract'?'on':''} onClick={()=>setTab('extract')}>Extract fields</button><button type="button" className={tab==='ask'?'on':''} onClick={()=>setTab('ask')}>Ask the document</button></div>
   {tab==='extract'?<div>
    <div className="sx-cmd"><Sparkles size={14}/><span>Extract key terms and obligations</span><button type="button" onClick={extract} disabled={running}><Play size={12}/> {running?'Extracting…':shown?'Re-run':'Extract'}</button></div>
    <ul className="sx-fields">{fields.map(([k,v,conf,c],i)=>i<shown?<li key={k} onMouseEnter={()=>setHl([c])} onMouseLeave={()=>setHl([])} onFocus={()=>setHl([c])} onBlur={()=>setHl([])} tabIndex={0}><small>{k}</small><b>{v}</b><em className={conf<90?'warn':''}>{conf<90?'Review · ':''}{conf}%</em></li>:<li key={k} className="skeleton"><small>{k}</small><i/></li>)}</ul>
   </div>:<div>
    <div className="sx-chips">{qa.map((x,i)=><button type="button" key={x.q} onClick={()=>ask(i)} className={ans===i?'on':''}>{x.q}</button>)}</div>
    {ans!==null&&<div className="sx-answer"><b><Sparkles size={13}/> Answer</b><p>{qa[ans].a}</p><div className="sx-cites">{qa[ans].cite.map(c=><span key={c}>{clauses.find(x=>x.id===c)?.h}</span>)}</div></div>}
    <form className="sx-ask" onSubmit={e=>{e.preventDefault();submit()}}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Ask about notice, late deliveries, obligations…" aria-label="Ask a question about the document"/><button type="submit" aria-label="Send"><Send size={14}/></button></form>
   </div>}
   <p className="demo-disclaimer">Prewritten demonstration responses, not live LLM output. <ArrowRight size={11} style={{verticalAlign:'middle'}}/> A real build cites your own documents.</p>
  </div>
 </div>;
}
