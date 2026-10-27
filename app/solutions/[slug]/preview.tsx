'use client';
import {useState} from 'react';
import {DashboardShowcase,ControlTowerShowcase,DocumentShowcase} from './showcases';
import {VisionShowcase} from './vision';
export function SolutionPreview({slug}:{slug:string}){
 const [run,setRun]=useState(false);
 if(slug==='computer-vision')return <VisionShowcase/>;
 if(slug==='dashboards'||slug==='machine-learning')return <DashboardShowcase variant={slug==='dashboards'?'executive':'predictive'}/>;
 if(slug==='supply-chain')return <ControlTowerShowcase/>;
 if(slug==='document-intelligence'||slug==='generative-ai')return <DocumentShowcase variant={slug==='generative-ai'?'assistant':'extract'}/>;
 return <div className="automation-demo"><h3>{slug==='ai-agents'?'Agent orchestration preview':'Intelligent workflow preview'}</h3><div className="flow-nodes">{['📥 Incoming request','🧠 AI analysis','✓ Human approval','⚡ Business action'].map((v,i)=><div key={v} className={run?'flow-on':''}><small>STEP 0{i+1}</small><strong>{v}</strong></div>)}</div><button className="detail-primary" onClick={()=>setRun(!run)}>{run?'Reset simulation':'Run workflow simulation →'}</button>{run&&<p className="analysis-result">Simulation complete: request classified, review checkpoint reached, and action queued. No external systems were changed.</p>}<p className="demo-disclaimer">Illustrative workflow; no autonomous agent or third-party integrations are running.</p></div>;
}
