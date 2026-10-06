import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./styles.css";

const SAVE_KEY = "forge-a-nation-v1";

const TERRAIN = {
  plains: { name:"Plains", icon:"▰", food:18, minerals:3, energy:5, stability:4, coast:0, desc:"Fertile and easy to develop." },
  mountains: { name:"Mountains", icon:"△", food:-3, minerals:20, energy:9, stability:-2, coast:0, desc:"Rich in minerals and hydropower." },
  desert: { name:"Desert", icon:"◇", food:-12, minerals:8, energy:18, stability:-3, coast:0, desc:"Harsh, but excellent for solar energy." },
  tropical: { name:"Tropical", icon:"✦", food:14, minerals:7, energy:6, stability:-4, coast:1, desc:"Productive, biodiverse and disaster-prone." },
  island: { name:"Island", icon:"◌", food:2, minerals:2, energy:8, stability:2, coast:20, desc:"Trade and maritime power come naturally." },
  tundra: { name:"Tundra", icon:"❄", food:-14, minerals:10, energy:4, stability:0, coast:4, desc:"Cold, remote and resource-rich." }
};

const GOVERNMENTS = {
  republic: { name:"Parliamentary Republic", approval:5, stability:4, corruption:2, tax:20 },
  presidential: { name:"Presidential Republic", approval:2, stability:2, corruption:4, tax:19 },
  monarchy: { name:"Constitutional Monarchy", approval:4, stability:7, corruption:1, tax:18 },
  federation: { name:"Federal Union", approval:6, stability:3, corruption:3, tax:21 },
  council: { name:"Civic Council", approval:9, stability:-1, corruption:-3, tax:22 }
};

const RESOURCES = ["Oil","Iron","Rare Earths","Freshwater","Timber","Natural Gas","Fisheries","Lithium"];

const EVENTS = [
  {
    title:"COASTAL STORM",
    text:"A severe storm has damaged ports and coastal infrastructure.",
    test:s=>s.coast>35,
    choices:[
      {label:"Emergency reconstruction", effects:{treasury:-5, infrastructure:5, stability:2}},
      {label:"Let private firms handle it", effects:{treasury:2, infrastructure:-3, approval:-3}}
    ]
  },
  {
    title:"COMMODITY BOOM",
    text:"Global demand for one of your resources suddenly rises.",
    test:s=>s.resources.length>=2,
    choices:[
      {label:"Export aggressively", effects:{treasury:8, gdp:3, environment:-3}},
      {label:"Limit exports", effects:{treasury:3, environment:2, food:1}}
    ]
  },
  {
    title:"CAMPUS PROTESTS",
    text:"Students demand more funding for universities and research.",
    test:s=>s.education<55,
    choices:[
      {label:"Fund universities", effects:{treasury:-5, education:9, approval:4, gdp:1}},
      {label:"Reject the demand", effects:{approval:-7, stability:-2}}
    ]
  },
  {
    title:"BANKING SHOCK",
    text:"A major lender is close to collapse. Contagion could spread.",
    test:s=>s.debt>45,
    choices:[
      {label:"Bail out the bank", effects:{treasury:-7, stability:5, debt:5}},
      {label:"Let it fail", effects:{gdp:-4, approval:-5, stability:-7}}
    ]
  },
  {
    title:"HARVEST SURPLUS",
    text:"Excellent weather has produced a bumper harvest.",
    test:s=>s.food>55,
    choices:[
      {label:"Export the surplus", effects:{treasury:5, gdp:2}},
      {label:"Build reserves", effects:{food:8, stability:3}}
    ]
  },
  {
    title:"BORDER DISPUTE",
    text:"A neighboring state disputes a small strip of your northern border.",
    test:s=>s.neighbors>0,
    choices:[
      {label:"Open negotiations", effects:{relations:8, treasury:-1}},
      {label:"Mobilize troops", effects:{military:6, relations:-10, treasury:-3}}
    ]
  }
];

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=n=>Math.round(n).toLocaleString();
const pick=(arr)=>arr[Math.floor(Math.random()*arr.length)];

function makeState(seed={}){
  const terrain = seed.terrain || "plains";
  const gov = seed.government || "republic";
  const t=TERRAIN[terrain], g=GOVERNMENTS[gov];
  const resources = seed.resources || RESOURCES.filter(()=>Math.random()>.57).slice(0,4);
  const pop = seed.population || Math.round((3+Math.random()*35)*10)/10;
  const area = seed.area || Math.round(35+Math.random()*420);
  const s={
    name:seed.name||"New Nation", capital:seed.capital||"Nova",
    terrain, government:gov, resources, population:pop, area,
    year:1, treasury:seed.treasury??Math.round(18+Math.random()*30),
    gdp:seed.gdp??Math.round(pop*(2.7+Math.random()*4)),
    growth:2.4, approval:clamp(61+g.approval+t.stability,10,95),
    stability:clamp(67+g.stability+t.stability,15,95),
    corruption:clamp(36+g.corruption-(resources.length*2),5,85),
    infrastructure:clamp(42+t.stability,15,90),
    education:clamp(52+(terrain==="plains"?8:0),15,90),
    health:clamp(64+(terrain==="tropical"?-7:2),15,95),
    military:clamp(30+Math.random()*18,5,90),
    food:clamp(56+t.food,5,95),
    energy:clamp(48+t.energy,5,95),
    environment:clamp(70-(terrain==="desert"?-5:0),15,95),
    debt:Math.round(24+Math.random()*20),
    relations:52,
    neighbors:2+Math.floor(Math.random()*4),
    coast:Math.round(12+t.coast*4+Math.random()*38),
    cities:1,
    log:["Year 1 — The nation is founded."],
    pendingEvent:null,
    flags:{}
  };
  return s;
}

function applyEffects(s,effects){
  const n={...s};
  for(const [k,v] of Object.entries(effects)){
    if(typeof n[k]==="number") n[k]+=v;
  }
  for(const k of ["approval","stability","corruption","infrastructure","education","health","military","food","energy","environment","relations"])
    n[k]=clamp(n[k],0,100);
  n.treasury=Math.max(-30,n.treasury);
  n.debt=clamp(n.debt,0,150);
  n.gdp=Math.max(1,n.gdp);
  return n;
}

function advanceYear(s, policy){
  let n={...s, year:s.year+1, pendingEvent:null, log:[...s.log]};
  const tax=policy.tax/20;
  const invest=policy.investment/10;
  const welfare=policy.welfare/10;
  const trade=(n.resources.length*0.55);
  const growth=clamp(1.4+invest+trade-tax*0.8+(n.education-50)*.025-(n.debt-40)*.015, -7, 8);
  n.growth=Number(growth.toFixed(1));
  n.gdp=Math.max(1,n.gdp*(1+growth/100));
  n.population=Number(Math.max(.1,n.population*(1+(0.7+n.health*.012)/100)).toFixed(1));
  n.treasury += Math.round((n.gdp*0.085*tax) - (n.gdp*0.055) + investmentReturn(policy));
  n.debt += Math.round((20-policy.tax)*0.08 - invest*.25 + welfare*.15);
  n.infrastructure=clamp(n.infrastructure+invest*.7-1.5,0,100);
  n.education=clamp(n.education+invest*.55+welfare*.35-0.5,0,100);
  n.health=clamp(n.health+welfare*.5-0.4,0,100);
  n.food=clamp(n.food+(n.terrain==="plains"?1.1:.2)-Math.max(0,n.population-20)*.05,0,100);
  n.energy=clamp(n.energy+invest*.25-0.5,0,100);
  n.environment=clamp(n.environment-(n.gdp>120?1.4:.4)+(policy.green?2:0),0,100);
  n.approval=clamp(n.approval+(growth*.45)-(n.debt>80?2:0)+welfare*.4-(tax>1.2?1:0),0,100);
  n.stability=clamp(n.stability+(n.approval-50)*.035-(n.debt>90?2.5:0),0,100);
  n.corruption=clamp(n.corruption-(policy.transparency?1.5:0)+(n.treasury<0?1.2:0),0,100);
  n.cities=Math.max(1,Math.round(1+(n.population/7)+(n.infrastructure/35)));
  n.log.unshift(`Year ${n.year} — GDP ${growth>=0?"+":""}${growth.toFixed(1)}%; population ${n.population}M.`);
  const eligible=EVENTS.filter(e=>!e.test||e.test(n));
  if(Math.random()<.82 && eligible.length) n.pendingEvent=pick(eligible);
  return n;
}
function investmentReturn(p){ return p.investment*0.35 + (p.trade?3:0); }

function save(s){ localStorage.setItem(SAVE_KEY,JSON.stringify(s)); }
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
    if(!saved || typeof saved!=="object" || !saved.name || !saved.terrain || !GOVERNMENTS[saved.government]) return null;
    return saved;
  }catch{return null}
}

function Starfield(){
  const ref=useRef();
  const pts=useMemo(()=>{
    const g=new THREE.BufferGeometry();
    const a=new Float32Array(900*3);
    for(let i=0;i<a.length;i++) a[i]=(Math.random()-.5)*80;
    g.setAttribute("position",new THREE.BufferAttribute(a,3)); return g;
  },[]);
  useFrame((_,d)=>{if(ref.current) ref.current.rotation.y+=d*.006});
  return <points ref={ref} geometry={pts}><pointsMaterial size={0.035} color="#7da4ad" transparent opacity={.65}/></points>
}

function World({state,onOpenMap}){
  const ref=useRef();
  const [hovered,setHovered]=useState(false);
  useFrame((_,d)=>{if(ref.current){ref.current.rotation.y+=d*.035; ref.current.rotation.x=Math.sin(Date.now()/4000)*.04}});
  const tint=state.terrain==="desert"?"#9c8256":state.terrain==="tropical"?"#557e68":state.terrain==="mountains"?"#71808b":"#547b82";
  return <button type="button" className={`world ${hovered?"world-hover":""}`} onClick={onOpenMap} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} aria-label="Open the world map and diplomacy view">
    <Canvas camera={{position:[0,0,5.2],fov:42}}>
      <ambientLight intensity={1.5}/>
      <directionalLight position={[4,4,5]} intensity={2.2}/>
      <Starfield/>
      <mesh ref={ref} rotation={[.15,-.45,.1]}>
        <icosahedronGeometry args={[1.65,32]}/>
        <meshStandardMaterial color={tint} roughness={.75} metalness={.12} wireframe={false}/>
      </mesh>
      <mesh rotation={[.15,-.45,.1]} scale={1.012}>
        <icosahedronGeometry args={[1.65,16]}/>
        <meshBasicMaterial color="#9ad6d7" wireframe transparent opacity={.11}/>
      </mesh>
      <mesh rotation={[.15,-.45,.1]} scale={1.035}>
        <icosahedronGeometry args={[1.65,2]}/>
        <meshBasicMaterial color="#c4ffff" wireframe transparent opacity={.09}/>
      </mesh>
    </Canvas>
    <div className="world-overlay">
      <span className="world-corner">LIVE / SIMULATION</span>
      <span className="world-ring ring-a" />
      <span className="world-ring ring-b" />
    </div>
    <div className="world-label">
      <span>LIVE NATIONAL MODEL</span>
      <strong>{state.name}</strong>
      <small>YEAR {state.year} · OPEN DIPLOMACY MAP ↗</small>
    </div>
  </button>
}

function Metric({label,value,suffix="",tone=""}){
  return <div className="metric">
    <span>{label}</span><strong className={tone}>{typeof value==="number"&&label!=="GDP"&&label!=="POPULATION"?Math.round(value):value}{suffix}</strong>
  </div>
}

function Bar({label,value}){return <div className="barrow"><div><span>{label}</span><b>{Math.round(value)}</b></div><i><em style={{width:`${clamp(value,0,100)}%`}}/></i></div>}

function App(){
  const [state,setState]=useState(()=>load());
  const [screen,setScreen]=useState(state?"dashboard":"create");
  const [tab,setTab]=useState("overview");
  const [form,setForm]=useState({name:"Aurelia",capital:"Novara",terrain:"plains",government:"republic"});
  const [toast,setToast]=useState("");

  useEffect(()=>{if(state) save(state)},[state]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(""),2600);return()=>clearTimeout(t)}},[toast]);

  const create=()=>{
    if(!form.name.trim()) return;
    const s=makeState(form); setState(s); save(s); setScreen("dashboard"); setToast("Nation founded.");
  };
  const reset=()=>{localStorage.removeItem(SAVE_KEY);setState(null);setScreen("create")};
  const act=(fn,msg)=>{setState(s=>{const n=fn(s);save(n);return n}); if(msg)setToast(msg)};
  const nextYear=(policy)=>act(s=>advanceYear(s,policy),"A new year begins.");
  const chooseEvent=(choice)=>{
    act(s=>{
      const n=applyEffects(s,choice.effects);
      n.pendingEvent=null; n.log=[`${s.year} — ${choice.label}.`,...s.log];
      return n;
    },"Decision enacted.");
  };

  if(screen==="create") return <Create form={form} setForm={setForm} create={create}/>;

  const s=state;
  return <div className="app">
    <header className="topbar">
      <div className="brand"><span className="brandmark">✦</span><div><b>FORGE A NATION</b><small>GEOPOLITICAL SIMULATION</small></div></div>
      <div className="top-actions">
        <button onClick={()=>{save(s);setToast("Game saved locally.")}}>SAVE</button>
        <button className="danger" onClick={reset}>NEW NATION</button>
      </div>
    </header>

    <main className="shell">
      <aside className="sidebar">
        <div className="country-mini"><div className="flag">{s.name.slice(0,1)}</div><div><b>{s.name}</b><span>{GOVERNMENTS[s.government].name}</span></div></div>
        <nav>
          {[["overview","◈","Overview"],["economy","◫","Economy"],["people","◎","People"],["government","◇","Government"],["diplomacy","⇄","Diplomacy"],["history","≡","History"]].map(([id,ic,label])=>
            <button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><i>{ic}</i>{label}</button>)}
        </nav>
        <div className="side-bottom">
          <span>SIMULATION STATUS</span><b><em/> LIVE</b>
          <small>All changes are stored in this browser.</small>
        </div>
      </aside>

      <section className="content">
        <div className="hero-strip">
          <div><span>YEAR {s.year} / AGE OF THE NATION</span><h1>{tab==="overview"?"Your country is alive.":tab[0].toUpperCase()+tab.slice(1)}</h1></div>
          <div className="turn"><span>NEXT YEAR</span><button onClick={()=>nextYear({tax:20,investment:5,welfare:5,trade:true,green:false,transparency:false})}>ADVANCE <b>→</b></button></div>
        </div>

        <div key={tab} className="view-transition">
          {tab==="overview" && <Overview s={s} setTab={setTab} openMap={()=>setTab("diplomacy")}/>}
          {tab==="economy" && <Economy s={s} nextYear={nextYear}/>}
          {tab==="people" && <People s={s}/>}
          {tab==="government" && <Government s={s} act={act}/>}
          {tab==="diplomacy" && <Diplomacy s={s} act={act}/>}
          {tab==="history" && <History s={s}/>}
        </div>
      </section>
    </main>

    {s.pendingEvent && <EventModal event={s.pendingEvent} onChoose={chooseEvent}/>}
    {toast && <div className="toast">{toast}</div>}
  </div>
}

function Create({form,setForm,create}){
  return <div className="create">
    <div className="create-bg"><Canvas camera={{position:[0,0,6]}}><Starfield/><ambientLight intensity={2}/><mesh rotation={[.3,.2,.1]}><icosahedronGeometry args={[1.6,2]}/><meshBasicMaterial color="#7aaeb2" wireframe transparent opacity={.16}/></mesh></Canvas></div>
    <div className="create-card">
      <div className="eyebrow">A NEW WORLD AWAITS</div>
      <h1>FORGE<br/><span>A NATION</span></h1>
      <p>You decide the borders, the system, the economy — then you live with the consequences.</p>
      <div className="fields">
        <label>COUNTRY NAME<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>CAPITAL<input value={form.capital} onChange={e=>setForm({...form,capital:e.target.value})}/></label>
      </div>
      <label className="blocklabel">CHOOSE YOUR TERRAIN</label>
      <div className="choices">{Object.entries(TERRAIN).map(([id,t])=><button type="button" className={form.terrain===id?"chosen":""} onClick={()=>setForm({...form,terrain:id})} key={id}><b>{t.icon}</b><span>{t.name}</span><small>{t.desc}</small></button>)}</div>
      <label className="blocklabel">CHOOSE YOUR GOVERNMENT</label>
      <div className="govchoices">{Object.entries(GOVERNMENTS).map(([id,g])=><button type="button" className={form.government===id?"chosen":""} onClick={()=>setForm({...form,government:id})} key={id}>{g.name}</button>)}</div>
      <button type="button" className="forge" onClick={create}>FOUND MY NATION <span>↗</span></button>
    </div>
  </div>
}

function Overview({s,setTab,openMap}){
  return <div className="overview">
    <div className="main-grid">
      <div className="panel world-panel"><World state={s} onOpenMap={openMap}/></div>
      <div className="panel stat-panel">
        <div className="panel-head"><span>NATIONAL VITALS</span><b>01</b></div>
        <div className="metrics">
          <Metric label="GDP" value={`$${s.gdp.toFixed(1)}B`} />
          <Metric label="POPULATION" value={`${s.population.toFixed(1)}M`} />
          <Metric label="GROWTH" value={`${s.growth>0?"+":""}${s.growth}%`} tone={s.growth>=0?"good":"bad"}/>
          <Metric label="APPROVAL" value={s.approval} suffix="/100"/>
        </div>
        <div className="bars"><Bar label="Stability" value={s.stability}/><Bar label="Infrastructure" value={s.infrastructure}/><Bar label="Education" value={s.education}/><Bar label="Health" value={s.health}/></div>
      </div>
    </div>
    <div className="lower-grid">
      <div className="panel">
        <div className="panel-head"><span>STATE OF THE NATION</span><b>02</b></div>
        <div className="big-status"><strong>{s.stability>70?"STABLE":s.stability>45?"WATCHFUL":"FRAGILE"}</strong><p>{s.name} is a {TERRAIN[s.terrain].name.toLowerCase()} nation with {s.resources.length} exploitable resources and {s.neighbors} neighbors.</p></div>
        <div className="chips">{s.resources.map(r=><span key={r}>{r}</span>)}</div>
      </div>
      <div className="panel log-panel"><div className="panel-head"><span>LATEST DISPATCHES</span><b>03</b></div>{s.log.slice(0,5).map((x,i)=><div className="log" key={i}><em>{String(i+1).padStart(2,"0")}</em><span>{x}</span></div>)}<button type="button" className="link" onClick={()=>setTab("history")}>VIEW FULL HISTORY →</button></div>
    </div>
  </div>
}

function Economy({s,nextYear}){
  const [tax,setTax]=useState(20),[investment,setInvestment]=useState(5),[welfare,setWelfare]=useState(5),[green,setGreen]=useState(false),[trade,setTrade]=useState(true),[transparency,setTransparency]=useState(false);
  return <div className="section-grid">
    <div className="panel controls"><div className="panel-head"><span>FISCAL POLICY</span><b>ECON</b></div>
      <Slider label="Tax rate" value={tax} set={setTax} min={5} max={35} unit="%"/>
      <Slider label="Infrastructure investment" value={investment} set={setInvestment} min={0} max={15} unit="%"/>
      <Slider label="Welfare spending" value={welfare} set={setWelfare} min={0} max={15} unit="%"/>
      <Toggle label="Green transition" on={green} set={setGreen}/><Toggle label="Trade expansion" on={trade} set={setTrade}/><Toggle label="Anti-corruption drive" on={transparency} set={setTransparency}/>
      <button type="button" className="forge small" onClick={()=>nextYear({tax,investment,welfare,green,trade,transparency})}>PASS BUDGET & ADVANCE YEAR →</button>
    </div>
    <div className="panel"><div className="panel-head"><span>ECONOMIC ENGINE</span><b>LIVE</b></div>
      <div className="econ-cards"><Metric label="GDP" value={`$${s.gdp.toFixed(1)}B`}/><Metric label="DEBT" value={`${Math.round(s.debt)}%`} tone={s.debt>70?"bad":""}/><Metric label="TREASURY" value={`$${s.treasury}B`} tone={s.treasury<0?"bad":"good"}/></div>
      <Bar label="Energy security" value={s.energy}/><Bar label="Food security" value={s.food}/><Bar label="Environment" value={s.environment}/><div className="resource-list"><h3>RESOURCE BASE</h3>{s.resources.map((r,i)=><div key={r}><span>{r}</span><b>{45+(i*13)%45}</b></div>)}</div>
    </div>
  </div>
}
function Slider({label,value,set,min,max,unit}){return <div className="slider"><div><span>{label}</span><b>{value}{unit}</b></div><input type="range" min={min} max={max} value={value} onChange={e=>set(+e.target.value)}/></div>}
function Toggle({label,on,set}){return <button type="button" className="toggle" onClick={()=>set(!on)}><span>{label}</span><b className={on?"on":""}>{on?"ON":"OFF"}</b></button>}

function People({s}){return <div className="section-grid"><div className="panel"><div className="panel-head"><span>DEMOGRAPHICS</span><b>PEOPLE</b></div><div className="metrics"><Metric label="POPULATION" value={`${s.population.toFixed(1)}M`}/><Metric label="CITIES" value={s.cities}/><Metric label="LIFE QUALITY" value={Math.round((s.health+s.education+s.infrastructure)/3)}/><Metric label="LITERACY" value={`${Math.round(s.education)}%`}/></div><div className="bars"><Bar label="Health" value={s.health}/><Bar label="Education" value={s.education}/><Bar label="Food security" value={s.food}/></div></div><div className="panel demographic"><div className="panel-head"><span>POPULATION PROFILE</span><b>01</b></div><div className="age"><span>0–17</span><i style={{width:"24%"}}/><b>24%</b></div><div className="age"><span>18–64</span><i style={{width:"64%"}}/><b>64%</b></div><div className="age"><span>65+</span><i style={{width:"12%"}}/><b>12%</b></div><div className="note">Your demographic structure will change as the simulation advances. Education and health investment improve long-term productivity.</div></div></div>}

function Government({s,act}){return <div className="section-grid"><div className="panel"><div className="panel-head"><span>POLITICAL SYSTEM</span><b>GOV</b></div><h2 className="display">{GOVERNMENTS[s.government].name}</h2><p className="muted">The political system shapes stability, taxation and public confidence.</p><div className="metrics"><Metric label="APPROVAL" value={s.approval} suffix="/100"/><Metric label="STABILITY" value={s.stability} suffix="/100"/><Metric label="CORRUPTION" value={s.corruption} suffix="/100"/></div></div><div className="panel"><div className="panel-head"><span>EXECUTIVE ACTIONS</span><b>02</b></div><Action title="National transparency audit" text="Reduce corruption at the cost of administrative capacity." onClick={()=>act(x=>applyEffects(x,{corruption:-8,treasury:-3,approval:2}),"Audit commissioned.")}/><Action title="Public works program" text="Spend treasury to create jobs and strengthen infrastructure." onClick={()=>act(x=>applyEffects(x,{treasury:-5,infrastructure:7,approval:3}),"Public works launched.")}/><Action title="Increase military readiness" text="Strengthen the armed forces, but divert money from civilian priorities." onClick={()=>act(x=>applyEffects(x,{treasury:-4,military:8,approval:-1}),"Readiness increased.")}/></div></div>}
function Action({title,text,onClick}){return <button type="button" className="action" onClick={onClick}><div><b>{title}</b><span>{text}</span></div><strong>→</strong></button>}
function Diplomacy({s,act}){return <div className="section-grid"><div className="panel"><div className="panel-head"><span>FOREIGN RELATIONS</span><b>WORLD</b></div><div className="worldcards">{["Norvak","Eldoria","Vesper","Caldera"].slice(0,s.neighbors+1).map((n,i)=><div className="worldcard" key={n}><span className="dot"/><div><b>{n}</b><small>{i%2?"Trade partner":"Regional power"}</small></div><strong>{clamp(s.relations+(i*7-10),0,100)}</strong></div>)}</div></div><div className="panel"><div className="panel-head"><span>DIPLOMATIC ACTIONS</span><b>02</b></div><Action title="Sign trade agreement" text="Improve relations and unlock additional economic growth." onClick={()=>act(x=>applyEffects(x,{relations:8,gdp:2,treasury:2}),"Trade agreement signed.")}/><Action title="Send humanitarian aid" text="Build goodwill abroad at a cost to the treasury." onClick={()=>act(x=>applyEffects(x,{relations:14,treasury:-4,approval:2}),"Aid package delivered.")}/><Action title="Military exercise" text="Improve readiness while making neighbors nervous." onClick={()=>act(x=>applyEffects(x,{military:6,relations:-8,stability:1}),"Exercise completed.")}/></div></div>}
function History({s}){return <div className="panel history"><div className="panel-head"><span>NATIONAL ARCHIVES</span><b>{s.log.length}</b></div>{s.log.map((x,i)=><div className="history-row" key={i}><b>{String(s.year-i>0?s.year-i:1).padStart(3,"0")}</b><span>{x}</span></div>)}</div>}
function EventModal({event,onChoose}){return <div className="modal"><div className="event"><span className="eyebrow">NATIONAL EMERGENCY / DECISION REQUIRED</span><h2>{event.title}</h2><p>{event.text}</p><div>{event.choices.map((c,i)=><button type="button" className="eventchoice" key={i} onClick={()=>onChoose(c)}><span>{String.fromCharCode(65+i)}</span><div><b>{c.label}</b><small>{Object.entries(c.effects).map(([k,v])=>`${k} ${v>0?"+":""}${v}`).join(" · ")}</small></div><strong>→</strong></button>)}</div></div></div>}

createRoot(document.getElementById("root")).render(<App/>);