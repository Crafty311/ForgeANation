import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import './style.css';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
const money=n=>n>=1000?'$'+(n/1000).toFixed(1)+'T':'$'+n.toFixed(1)+'B';
const pick=a=>a[Math.floor(Math.random()*a.length)];

const presets={
 'Small Island':{area:8,pop:2,urban:72,edu:78,health:76,industry:28,agri:18,tech:18,terrain:'Island Archipelago'},
 'Industrial Power':{area:780,pop:90,urban:78,edu:82,health:80,industry:68,agri:8,tech:52,terrain:'Temperate Mixed'},
 'Agricultural Giant':{area:1450,pop:120,urban:48,edu:58,health:60,industry:25,agri:72,tech:14,terrain:'River Basin'},
 'Desert Kingdom':{area:620,pop:28,urban:82,edu:72,health:74,industry:44,agri:5,tech:34,terrain:'Desert Coast'},
 'Mountain Republic':{area:410,pop:16,urban:55,edu:74,health:70,industry:28,agri:32,tech:21,terrain:'Mountainous'},
 'Resource Superpower':{area:1900,pop:70,urban:63,edu:65,health:66,industry:48,agri:22,tech:22,terrain:'Forest Frontier'},
 'Developing Democracy':{area:520,pop:45,urban:51,edu:55,health:58,industry:22,agri:43,tech:9,terrain:'Tropical Coast'},
 'Technological State':{area:180,pop:12,urban:91,edu:96,health:92,industry:38,agri:3,tech:86,terrain:'Temperate Mixed'}
};
const governments=['Parliamentary Democracy','Presidential Republic','Constitutional Monarchy','Absolute Monarchy','Military Government','Socialist State','Federal Republic','Technocratic Republic'];
const terrains=['Temperate Mixed','Tropical Coast','Arid Plateau','Mountainous','River Basin','Island Archipelago','Northern Cold','Mediterranean','Desert Coast','Forest Frontier'];
const features={
 WORLD:['Provinces','Cities','Climate','Weather','Natural Resources','Exploration','Disasters','Terrain Evolution'],
 SOCIETY:['Demographics','Social Groups','Migration','Immigration','Housing','Education','Healthcare','Culture','Inequality','Public Safety'],
 ECONOMY:['Industries','Supply Chains','Trade','Banking','Currency','Inflation','Labor Market','Public Finance','Tourism'],
 GOVERNMENT:['Political Parties','Elections','Parliament','Political Figures','Media','Protests','Regional Government','Corruption','Civil Liberties','Political Crises'],
 DIPLOMACY:['AI Neighbors','Embassies','Alliances','Sanctions','Foreign Aid','Intelligence','International Organizations','Border Negotiations'],
 MILITARY:['Army','Navy','Air Force','Military Bases','Defense Industry','Military Doctrine','Veterans','Strategic Technology'],
 DEVELOPMENT:['Road Network','Rail Network','High-Speed Rail','Ports','Airports','Power Grid','Water Systems','Megaprojects'],
 SCIENCE:['Universities','Research','Innovation','Breakthroughs','Space Program'],
 ENVIRONMENT:['Forests','Pollution','Carbon Economy','Renewable Energy','Conservation','Climate Adaptation'],
 CULTURE:['National Newspaper','National Memory','National Museum','Historical Figures','National Showcase']
};

const state={nation:null,view:'world',layer:'political',selected:null,year:1,playing:false,modal:null,toast:null,zoom:0,transitioning:false};
const progression=[
 {level:1,name:'New Nation',xp:0,unlock:'Basic infrastructure, industry, education and diplomacy'},
 {level:2,name:'Emerging Nation',xp:250,unlock:'Urban development, trade agreements and city projects'},
 {level:3,name:'Regional Power',xp:650,unlock:'Military modernization, advanced diplomacy and national projects'},
 {level:4,name:'Global Power',xp:1400,unlock:'Space program, global alliances and megaprojects'},
 {level:5,name:'World Power',xp:2600,unlock:'Megaprojects, advanced technology and prestige events'}
];
const missionPool=[
 {id:'roads',title:'Connect the Nation',text:'Raise infrastructure to 65.',reward:90,check:n=>n.infrastructure>=65},
 {id:'cities',title:'Urban Network',text:'Grow to 7 cities.',reward:120,check:n=>n.cities.length>=7},
 {id:'people',title:'Human Capital',text:'Raise education to 75.',reward:110,check:n=>n.edu>=75},
 {id:'green',title:'Green Balance',text:'Keep environment above 70.',reward:100,check:n=>n.environment>=70},
 {id:'wealth',title:'Build Prosperity',text:'Reach $100B GDP.',reward:160,check:n=>n.gdp>=100}
];
const create={name:'Aurelia',capital:'Nova Aurelia',terrain:'Temperate Mixed',government:'Parliamentary Democracy',area:520,pop:45,urban:51,edu:65,health:65,industry:35,agri:35,tech:25};

const decisionDefs={
 infrastructure:{label:'Build infrastructure',cost:2.4,actions:1,desc:'Upgrade roads, utilities and logistics.',kind:'development'},
 rail:{label:'Build national rail',cost:4.8,actions:1,desc:'Connect cities; pays back through trade.',kind:'development'},
 megaproject:{label:'Launch megaproject',cost:8.5,actions:2,desc:'A landmark investment with long-term payoff.',kind:'development'},
 energy:{label:'Expand energy',cost:3.6,actions:1,desc:'Increase reliable power before shortages hit.',kind:'development'},
 culture:{label:'Fund culture',cost:1.2,actions:1,desc:'Grow participation and national prestige.',kind:'culture'},
 museum:{label:'Open national museum',cost:3.0,actions:1,desc:'Create a permanent cultural institution.',kind:'culture'},
 festival:{label:'Host world festival',cost:2.0,actions:1,desc:'Boost tourism and international prestige.',kind:'culture'},
 'tax-cut':{label:'Cut taxes',cost:0,actions:1,desc:'Trade immediate revenue for private demand.',kind:'economy'},
 industry:{label:'Back industry',cost:3.2,actions:1,desc:'Create productive capacity at an environmental cost.',kind:'economy'},
 trade:{label:'Expand trade',cost:1.0,actions:1,desc:'Open a commercial corridor.',kind:'economy'},
 research:{label:'Fund research',cost:2.2,actions:1,desc:'Build knowledge that compounds over time.',kind:'science'},
 housing:{label:'Build housing',cost:3.4,actions:1,desc:'Relieve urban housing pressure.',kind:'people'},
 education:{label:'Invest in education',cost:2.6,actions:1,desc:'Raise human capital over several years.',kind:'people'},
 health:{label:'Expand healthcare',cost:2.4,actions:1,desc:'Improve health and resilience.',kind:'people'},
 migration:{label:'Welcome migrants',cost:.8,actions:1,desc:'Add people and skills, but increase housing pressure.',kind:'people'},
 welfare:{label:'Expand welfare',cost:2.1,actions:1,desc:'Protect households at a fiscal cost.',kind:'government'},
 'tax-up':{label:'Raise taxes',cost:0,actions:1,desc:'Increase revenue and political friction.',kind:'government'},
 reform:{label:'Institutional reform',cost:1.4,actions:1,desc:'Strengthen state capacity.',kind:'government'},
 green:{label:'Restore nature',cost:2.0,actions:1,desc:'Repair ecosystems and reduce future damage.',kind:'government'},
 defense:{label:'Modernize defense',cost:3.8,actions:1,desc:'Improve deterrence and military readiness.',kind:'military'},
 cyber:{label:'Build cyber command',cost:2.5,actions:1,desc:'Protect the digital state.',kind:'military'},
 logistics:{label:'Upgrade logistics',cost:3.0,actions:1,desc:'Improve movement of goods and forces.',kind:'military'}
};
function decisionButton(type,extra=''){
 const d=decisionDefs[type]||{label:type,cost:0,actions:1,desc:''}; const n=state.nation;
 const disabled=(n?.actionPoints??3)<d.actions || (d.cost>0 && (n?.treasury??0)<d.cost);
 return `<button ${disabled?'disabled ':''}title="${d.desc}" data-action="policy" data-policy="${type}"><strong>${d.label}</strong><small>${d.cost?money(d.cost)+' · ':''}${d.actions} action${d.actions>1?'s':''}</small></button>`;
}
function turnBanner(){const n=state.nation;return `<article class="turn-banner"><div><small>YEAR ${state.year} · GOVERNMENT ACTIONS</small><h3>${n.actionPoints} of ${n.maxActions} actions remaining</h3><p>${n.pressure?.headline||'Watch your shortages, prices and public mood before committing.'}</p></div><div class="turn-stats"><span>TREASURY <b>${money(n.treasury)}</b></span><span>DEFICIT <b>${money(n.fiscalBalance||0)}</b></span><span>PRESSURE <b>${Math.round(n.pressure?.score||0)}</b></span></div></article>`;
}

function derive(){
 const n=state.nation;
 n.gdp=n.gdp||Math.max(8,n.pop*(18+n.tech*.28+n.industry*.22+n.edu*.12));
 n.approval=n.approval??67;n.infrastructure=n.infrastructure??46;n.environment=n.environment??68;n.inflation=n.inflation??4.2;n.debt=n.debt??Math.max(5,n.gdp*.28);n.food=n.food??Math.max(40,n.agri+25);n.energy=n.energy??Math.max(42,n.industry*.55+n.urban*.3);n.housing=n.housing??Math.max(42,90-n.urban*.25);n.jobs=n.jobs??92;n.stability=n.stability??74;n.happiness=n.happiness??68;n.urban=Math.round(n.urban);n.population=n.population??Math.round(n.pop*1000000*(1+(state.year-1)*.003));
 n.cities=n.cities||[]; if(!n.cities.length){
   const names=['Nova Aurelia','Riverton','Port Sol','Highland','Verdant','Eastgate','Maris','Ironvale'];
   n.cities=names.slice(0,5+Math.min(3,Math.floor(n.pop/40))).map((name,i)=>({name,pop:Math.max(.12,n.pop*(i===0?.28:.06+Math.random()*.05)),wealth:45+n.tech*.3+i*2,type:i===0?'Capital':pick(['Industrial','Agricultural','Coastal','University','Residential'])}));
 }
 n.provinces=n.provinces||['Northland','Westreach','Central','Eastmarch','South Coast','Highlands'].slice(0,Math.max(4,Math.min(6,Math.round(n.area/180))));
 n.history=n.history||[{year:1,title:'The nation is founded',text:`${n.name} begins its first year with ${n.capital} as its capital.`}];
 n.news=n.news||[{icon:'🏛',title:'A new chapter begins',text:'Your institutions are taking shape.'},{icon:'🌱',title:'Development watch',text:'The first investment cycle is underway.'}];
 n.features=n.features||Object.values(features).flat();
 n.xp=n.xp??0; n.level=n.level??1; n.xpLog=n.xpLog||[];
 n.missions=n.missions||missionPool.slice(0,3).map(m=>({id:m.id,title:m.title,text:m.text,reward:m.reward,complete:false}));
 n.achievements=n.achievements||[]; n.projects=n.projects||[];
 n.lastReport=n.lastReport||null;
 n.neighbors=n.neighbors||[{name:'Valora',relation:62},{name:'Meridia',relation:74},{name:'Kestrel Union',relation:41}];
 n.economy=n.economy||{agriculture:Math.max(5,n.agri),manufacturing:Math.max(5,n.industry),services:Math.max(10,100-n.industry-n.agri),technology:Math.max(3,n.tech*.7),energy:Math.max(4,n.energy*.7)};
 n.treasury=n.treasury??Math.max(8,n.gdp*.12);n.tax=n.tax??22;n.spending=n.spending||{education:18,health:18,infrastructure:16,defense:12,welfare:12,research:6,environment:4};
 n.groups=n.groups||[{name:'Workers',support:64},{name:'Business',support:55},{name:'Youth',support:72},{name:'Rural',support:61},{name:'Urban',support:68}];
 n.trade=n.trade||{exports:Math.max(4,n.gdp*.08),imports:Math.max(4,n.gdp*.07),tariff:8};
 n.military=n.military||{army:32,navy:18,air:22,cyber:12,logistics:30,deterrence:27};
 n.projects=n.projects||[];n.event=n.event||null; n.maxActions=n.maxActions||3; n.actionPoints=n.actionPoints??n.maxActions; n.fiscalBalance=n.fiscalBalance??0; n.pressure=n.pressure||{score:0,headline:'The country is stable enough to plan ahead.',food:0,water:0,energy:0,housing:0,unemployment:0,inflation:0}; n.prices=n.prices||{food:100,energy:100,housing:100}; n.activeProjects=n.activeProjects||[];
 const terrain=n.terrain||'Temperate Mixed';
 n.resources=n.resources||{
   food:clamp(n.agri+(terrain.includes('River')?18:terrain.includes('Forest')?8:0),5,100),
   water:clamp(terrain.includes('Desert')?38:terrain.includes('Mountain')?78:terrain.includes('River')?92:68,5,100),
   minerals:clamp(n.industry*.55+(terrain.includes('Mountain')?22:terrain.includes('Forest')?12:6),5,100),
   energy:clamp(n.energy+(terrain.includes('Desert')?8:terrain.includes('Mountain')?6:0),5,100),
   tourism:clamp((100-n.industry*.35)+n.environment*.45,5,100)
 };
 n.culture=n.culture||{creativity:clamp(n.edu*.55+n.tech*.2,0,100),participation:clamp(n.happiness*.55+n.urban*.25,0,100),prestige:clamp(n.edu*.2+n.tech*.3+n.approval*.15,0,100)};
 n.identity=n.identity||'Young Republic';
 n.generation=n.generation||{number:1,label:'Founding Generation'};
 n.goals=n.goals||[{id:'prosperity',title:'Prosperous Nation',text:'Reach $100B GDP.',done:false},{id:'green',title:'Green Future',text:'Keep environment above 80.',done:false},{id:'knowledge',title:'Knowledge Nation',text:'Reach 85% education.',done:false},{id:'connected',title:'Connected Nation',text:'Reach 75 infrastructure.',done:false}];
 n.advisors=n.advisors||[
   {role:'Finance',icon:'◒',tone:'budget',name:'Minister of Finance'},
   {role:'People',icon:'♙',tone:'society',name:'Minister of People'},
   {role:'Science',icon:'✦',tone:'science',name:'Science Minister'},
   {role:'Defense',icon:'⚔',tone:'defense',name:'Defense Minister'}
 ];
 n.figures=n.figures||[]; n.newspaper=n.newspaper||[];
 updateIdentity();
}

function updateIdentity(){
 const n=state.nation;
 const scores={Industrialist:n.economy.manufacturing,'Green Pioneer':n.environment,'Knowledge State':n.edu,'Trade Nation':n.trade.exports/Math.max(1,n.gdp)*220, 'Diplomatic Power':n.neighbors.reduce((a,b)=>a+b.relation,0)/n.neighbors.length, 'Guardian':n.military.deterrence};
 n.identity=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
}
function advisorAdvice(role){
 const n=state.nation;
 if(role==='Finance') return n.treasury<n.gdp*.05?'Treasury is tight. Avoid expensive promises until revenue catches up.':n.inflation>7?'Prices are running hot. Invest carefully and avoid overheating demand.':'The budget has room. Long-term infrastructure or education would compound well.';
 if(role==='People') return n.housing<55?'Housing is becoming a pressure point. Cities need more homes.':n.approval<55?'Public confidence is fragile. Visible improvements could rebuild trust.':'People are broadly optimistic. This is a good moment for ambitious reforms.';
 if(role==='Science') return n.tech<40?'Research capacity is a bottleneck. Universities could unlock faster future growth.':n.tech>75?'Your knowledge base is a national advantage. Protect it and commercialize discoveries.':'Research is progressing steadily; a breakthrough is plausible with sustained funding.';
 return n.military.deterrence<40?'Defense is credible but thin. Logistics and cyber resilience would improve deterrence.':n.military.deterrence>70?'Your deterrence is strong. Avoid unnecessary escalation and preserve fiscal room.':'A balanced defense posture is keeping the region stable.';
}
function nationalGoals(){const n=state.nation;const defs={prosperity:x=>x.gdp>=100,green:x=>x.environment>=80,knowledge:x=>x.edu>=85,connected:x=>x.infrastructure>=75};return n.goals.map(g=>{g.done=g.done||!!(defs[g.id]&&defs[g.id](n));return g})}
function explainModal(topic='overview'){
 const n=state.nation;
 const explanations={
  gdp:['GDP','The value of everything your economy produces in a year. Industry, services, technology, education and infrastructure all push it over time.'],
  inflation:['Inflation','How quickly prices are rising. High inflation makes money less useful and can reduce public happiness.'],
  approval:['Approval','A simple measure of how people feel about the government. Different groups react differently to taxes, jobs, services and crises.'],
  resources:['Resources','Your geography creates advantages and limits. Food, water, minerals, energy and tourism shape what your country can build and trade.'],
  identity:['National identity','A label describing the direction your choices have pushed the country. It is descriptive, not a fixed class.'],
  xp:['Nation XP','XP measures development and important decisions. Higher levels reveal deeper systems and national projects; it does not decide whether your country is successful.']
 };
 const e=explanations[topic]||explanations.gdp;
 return `<div class="modal"><div class="modalcard explain"><button class="close" data-action="close">×</button><small>LEARN THE SYSTEM</small><h2>${e[0]}</h2><p>${e[1]}</p><div class="explain-why"><b>WHY IT MATTERS</b><span>${topic==='gdp'?`GDP is currently ${money(n.gdp)} and ${n.gdp>=100?'supports a large national economy.':'has room to grow.'}`:topic==='inflation'?`Inflation is ${n.inflation.toFixed(1)}%, so ${n.inflation>6?'price pressure is significant.':'prices are relatively calm.'}`:topic==='approval'?`Approval is ${n.approval}%, with your social groups pulling it in different directions.`:topic==='resources'?`${n.terrain} gives you different natural advantages than another nation's geography would.`:topic==='identity'?`Your strongest current direction is ${n.identity}. Your choices can change it.`:`You have ${Math.round(n.xp)} XP and are Level ${n.level}.`}</span></div><div class="explain-actions"><button data-explain="gdp">GDP</button><button data-explain="inflation">Inflation</button><button data-explain="approval">Approval</button><button data-explain="resources">Resources</button><button data-explain="identity">Identity</button><button data-explain="xp">XP</button></div></div></div>`;
}
function advisorPanel(){const n=state.nation;return `<article class="panel advisor-panel"><small>CABINET BRIEF</small><h3>What your ministers see</h3><div class="advisor-grid">${n.advisors.map(a=>`<div class="advisor"><b>${a.icon}</b><div><strong>${a.name}</strong><p>${advisorAdvice(a.role)}</p></div></div>`).join('')}</div></article>`}
function goalsPanel(){const goals=nationalGoals();return `<article class="panel goals-panel"><div class="panel-title-row"><div><small>NATIONAL GOALS</small><h3>Choose what greatness means to you.</h3></div><button data-explain="identity">EXPLAIN</button></div><div class="goal-grid">${goals.map(g=>`<div class="goal ${g.done?'done':''}"><b>${g.done?'✓':'○'}</b><span><strong>${g.title}</strong><small>${g.text}</small></span></div>`).join('')}</div></article>`}
function newspaper(){const n=state.nation;const lead=n.news[0]||{icon:'🏛️',title:'A new chapter',text:'Your country is taking shape.'};return `<article class="panel newspaper"><small>THE NATIONAL HERALD · YEAR ${state.year}</small><h3>${lead.icon} ${lead.title}</h3><p>${lead.text}</p><div class="paper-columns"><span>GDP ${money(n.gdp)}</span><span>POP ${fmt(n.population/1e6)}M</span><span>APPROVAL ${n.approval}%</span><span>IDENTITY ${n.identity}</span></div></article>`}

function save(){localStorage.setItem('forgeNationV6',JSON.stringify({version:6,nation:state.nation,year:state.year}));}
function load(){try{const raw=localStorage.getItem('forgeNationV6')||localStorage.getItem('forgeNationV52');const x=raw?JSON.parse(raw):null;if(x){if(x.nation){state.nation=x.nation;state.year=x.year||1}else{state.nation=x;state.year=x.year||1}derive();return true}}catch{}return false}
function toast(msg){state.toast=msg;renderToast();setTimeout(()=>{if(state.toast===msg){state.toast=null;renderToast()}},2200)}
function renderToast(){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el)}el.textContent=state.toast||'';el.classList.toggle('show',!!state.toast)}

function levelForXP(xp){let current=progression[0];for(const l of progression){if(xp>=l.xp)current=l;}return current;}
function awardXP(amount,reason){const n=state.nation;if(!n)return;const before=levelForXP(n.xp).level;n.xp=Math.max(0,n.xp+amount);const after=levelForXP(n.xp).level;n.level=after;n.xpLog.unshift({year:state.year,amount,reason});n.xpLog=n.xpLog.slice(0,12);if(after>before){const unlocked=progression[after-1];n.news.unshift({icon:'⬆️',title:`Nation reached Level ${after}`,text:`${unlocked.name} unlocked: ${unlocked.unlock}.`});toast(`Level ${after} reached · ${unlocked.name}`)}return after>before}
function checkMissions(){const n=state.nation;(n.missions||[]).forEach(m=>{const def=missionPool.find(x=>x.id===m.id);if(def&&!m.complete&&def.check(n)){m.complete=true;awardXP(m.reward,`Mission: ${m.title}`);n.news.unshift({icon:'🎯',title:`Mission complete: ${m.title}`,text:`+${m.reward} XP. ${def.text}`})}});n.achievements=n.achievements||[];const tests=[['first-year','First Year','Advance your nation into Year 2.',state.year>=2],['five-cities','Growing Metropolis','Build a network of five or more cities.',n.cities.length>=5],['stable','Stable State','Reach 85% stability.',n.stability>=85],['educated','Knowledge Nation','Reach 85% education.',n.edu>=85]];for(const [id,title,text,ok] of tests){if(ok&&!n.achievements.some(a=>a.id===id)){n.achievements.push({id,title,year:state.year});awardXP(60,`Achievement: ${title}`)}}}
function activeProgression(){const n=state.nation;const cur=levelForXP(n.xp), next=progression.find(l=>l.level===cur.level+1);return {cur,next,pct:next?clamp(((n.xp-cur.xp)/(next.xp-cur.xp))*100,0,100):100};}
function createNation(){state.year=1;state.nation={name:create.name||'Aurelia',capital:create.capital||'Nova Aurelia',terrain:create.terrain,government:create.government,area:+create.area,pop:+create.pop,urban:+create.urban,edu:+create.edu,health:+create.health,industry:+create.industry,agri:+create.agri,tech:+create.tech};derive();save();showGame();toast('Nation forged. Welcome home.');}

function metric(label,value,sub=''){return `<div class="metric"><span>${label}</span><strong>${value}</strong>${sub?`<em>${sub}</em>`:''}</div>`}
function top(){const n=state.nation;return `<header class="top"><div class="brand"><b>FORGE</b><span>A NATION</span></div><div class="yearbox"><small>YEAR</small><b>${state.year}</b><button data-action="advance">${state.playing?'Ⅱ':'▶'}</button></div><div class="topmetrics">${metric('POP',fmt(n.population/1e6)+'M','+0.3%')} ${metric('GDP',money(n.gdp),'+'+((n.gdp/Math.max(1,n.pop))/30).toFixed(1)+'%')} ${metric('APPROVAL',n.approval+'%','▲ stable')} ${metric('STABILITY',n.stability+'%','')} ${metric('ACTIONS',n.actionPoints+'/'+n.maxActions,'this year')}</div><button class="iconbtn" data-action="save">SAVE</button></header>`}
function sidebar(){const items=[['overview','◈','Overview'],['map','⌁','World'],['cities','⌂','Cities'],['economy','◒','Economy'],['people','♙','People'],['government','♜','Politics'],['diplomacy','◎','Diplomacy'],['military','⚔','Military'],['development','⬡','Development'],['culture','✦','Culture'],['history','◷','History'],['missions','◇','Missions']];return `<aside class="sidebar"><div class="nation-mini"><div class="flag"></div><b>${state.nation.name}</b><span>${state.nation.government}</span></div>${items.map(x=>`<button class="nav ${state.view===x[0]?'active':''}" data-view="${x[0]}"><i>${x[1]}</i><span>${x[2]}</span></button>`).join('')}<div class="sidebottom"><button class="nav" data-action="features"><i>＋</i><span>Features</span></button><button class="nav" data-action="new"><i>↻</i><span>New nation</span></button></div></aside>`}
function world(){return `<section class="world"><div class="world-head"><div><small>LIVE NATION</small><h1>${state.nation.name}</h1><p>${state.nation.terrain} · Year ${state.year}</p></div><div class="world-actions"><button data-action="camera">◎ HOME</button><button data-action="report">▣ YEAR REPORT</button></div></div><div id="scene"></div><div class="layerbar">${[['political','Political'],['population','Population'],['economy','Economy'],['resources','Resources'],['infrastructure','Infrastructure'],['environment','Environment'],['military','Military']].map(x=>`<button class="${state.layer===x[0]?'active':''}" data-layer="${x[0]}">${x[1]}</button>`).join('')}</div><div class="world-hint">CLICK A CITY · DRAG TO ROTATE · SCROLL TO DIVE · 1–7 CHANGE LAYERS</div><div class="mini-legend"><span>LOW</span><i></i><i></i><i></i><i></i><i></i><span>HIGH</span></div></section>`}
function overview(){const n=state.nation,p=activeProgression();return `<div class="panelgrid">${turnBanner()}<article class="panel hero"><small>NATIONAL SNAPSHOT</small><h2>${n.name}</h2><p>Your country is not a spreadsheet. Watch geography, people, cities and institutions react to your choices.</p><div class="identity-chip"><span>NATIONAL CHARACTER</span><b>${n.identity}</b><button data-explain="identity">?</button></div><div class="metricgrid">${metric('GDP',money(n.gdp),'annual output')} ${metric('INFLATION',n.inflation.toFixed(1)+'%','consumer prices')} ${metric('JOBS',n.jobs.toFixed(0)+'%','employment')} ${metric('HAPPINESS',n.happiness.toFixed(0)+'%','public mood')}</div></article><article class="panel progression"><small>NATION PROGRESSION</small><div class="levelrow"><div><b>LEVEL ${p.cur.level}</b><strong>${p.cur.name}</strong></div><span>${Math.round(n.xp)} XP${p.next?' / '+p.next.xp+' XP':''}</span></div><div class="xpbar"><i style="width:${p.pct}%"></i></div><p>${p.next?`Next: <b>${p.next.name}</b> — ${p.next.unlock}.`:'Maximum current level reached.'}</p><button class="explain-link" data-explain="xp">What does XP do?</button><div class="missionmini"><small>ACTIVE MISSIONS</small>${n.missions.filter(m=>!m.complete).slice(0,3).map(m=>`<div><b>${m.title}</b><span>+${m.reward} XP</span></div>`).join('')}</div></article><article class="panel"><small>WHAT IS HAPPENING</small>${n.event?`<div class="eventbig active-event"><b>${n.event.icon} ${n.event.title}</b><p>${n.event.text}</p><div class="event-actions"><button data-event-choice="invest">Invest to contain</button><button data-event-choice="restrict">Use emergency powers</button><button data-event-choice="wait">Wait it out</button></div></div>`:`<div class="eventbig"><b>${n.news[0].icon} ${n.news[0].title}</b><p>${n.news[0].text}</p></div>`}<div class="eventbig"><b>${n.news[1].icon} ${n.news[1].title}</b><p>${n.news[1].text}</p></div></article><article class="panel wide"><small>VISIBLE CONSEQUENCES</small><div class="consequence-row"><div><b>🏙️</b><strong>${n.cities.length} cities</strong><span>urban network</span></div><div><b>🏭</b><strong>${Math.round(n.industry*1.7)} industry</strong><span>production base</span></div><div><b>🌾</b><strong>${Math.round(n.agri)} agriculture</strong><span>food capacity</span></div><div><b>🌳</b><strong>${n.environment}%</strong><span>environment</span></div><div><b>⚡</b><strong>${n.energy.toFixed(0)}%</strong><span>energy security</span></div></div></article>${advisorPanel()}${goalsPanel()}${newspaper()}</div>`}
function cities(){const n=state.nation;return `<div class="content"><div class="sectionhead"><div><small>SETTLEMENTS · ${n.actionPoints} ACTIONS LEFT</small><h2>Your cities are strategic assets.</h2></div><button class="primary" data-action="camera">VIEW WORLD</button></div><div class="citygrid">${n.cities.map((c,i)=>`<article class="citycard" data-city="${i}"><div class="city-art ${c.type.toLowerCase()}"><span>${c.type==='Capital'?'★':'●'}</span><div class="mini-buildings">${Array.from({length:7+i%4},(_,j)=>`<i style="height:${20+(j*13)%48}px"></i>`).join('')}</div></div><div class="citybody"><div><small>${c.type}</small><h3>${c.name}</h3></div><strong>${c.pop.toFixed(1)}M</strong><p>Wealth ${c.wealth.toFixed(0)} · ${c.type==='Industrial'?'factories and freight':c.type==='University'?'research and students':c.type==='Coastal'?'trade and ports':'housing, services and roads'}</p><button data-city-project="${i}" data-project="${c.type==='Industrial'?'industry':c.type==='University'?'research':c.type==='Coastal'?'port':'housing'}">INVEST +</button></div></article>`).join('')}</div><div class="panel city-projects"><small>CITY PIPELINE</small><div class="project-strip">${n.projects.slice(-5).reverse().map(p=>`<span><b>${p.city}</b><em>${p.title}</em><i>Year ${p.year}</i></span>`).join('')||'<span><b>No projects yet</b><em>Invest in a city to create your first landmark.</em></span>'}</div></div></div>`}

function cardsFor(view){const n=state.nation;const common={development:[['Infrastructure',n.infrastructure+'%','roads and utilities'],['Megaprojects',n.projects.length,'built landmarks'],['Energy',n.energy.toFixed(0)+'%','security'],['Housing',n.housing.toFixed(0)+'%','capacity'],['Resources',Math.round((n.resources.food+n.resources.water+n.resources.minerals)/3),'national base'],['Technology',n.tech+'%','capability']],culture:[['Creativity',Math.round(n.culture.creativity)+'%','arts and ideas'],['Participation',Math.round(n.culture.participation)+'%','civic life'],['Prestige',Math.round(n.culture.prestige)+'%','international reach'],['Education',n.edu+'%','knowledge base'],['Tourism',Math.round(n.resources.tourism)+'%','visitor appeal'],['Identity',n.identity,'national character']],economy:[['GDP',money(n.gdp),'▲ productive capacity'],['Inflation',n.inflation.toFixed(1)+'%','◆ prices'],['Treasury',money(n.treasury),'cash on hand'],['Debt',money(n.debt),'service pressure'],['Industry',n.industry+'%','of economic base'],['Agriculture',n.agri+'%','food system']],people:[['Population',fmt(n.population/1e6)+'M','growing'],['Urbanization',n.urban+'%','living in cities'],['Education',n.edu+'%','human capital'],['Healthcare',n.health+'%','access'],['Housing',n.housing.toFixed(0)+'%','capacity'],['Employment',n.jobs.toFixed(0)+'%','labor market']],government:[['Approval',n.approval+'%','national'],['Stability',n.stability+'%','institutional'],['Government',n.government,'system'],['Civil mood',n.happiness+'%','public'],['Provinces',n.provinces.length,'regions'],['Year',state.year,'term']],diplomacy:[['Neighbors',6,'generated states'],['Relations',72,'average'],['Trade partners',4,'active'],['Alliances',2,'defense'],['Influence',n.tech+30,'soft power'],['Tension',18,'regional']],military:[['Readiness',Math.round(45+n.industry*.3)+'%','forces'],['Defense',money(n.gdp*.025),'annual'],['Army',Math.round(n.pop*.8)+'k','personnel'],['Navy',n.terrain.includes('Coast')?'Active':'Limited','maritime'],['Air force',n.tech>45?'Modern':'Developing','capability'],['Logistics',n.infrastructure+'%','network']]};return common[view]||common.economy}
function dashboard(view){
 const n=state.nation;
 const cards=cardsFor(view);
 const actions=view==='development'?`${decisionButton('infrastructure')}${decisionButton('rail')}${decisionButton('megaproject')}${decisionButton('energy')}`:
 view==='culture'?`${decisionButton('culture')}${decisionButton('museum')}${decisionButton('festival')}${decisionButton('research')}`:
 view==='economy'?`${decisionButton('tax-cut')}${decisionButton('industry')}${decisionButton('trade')}${decisionButton('research')}`:
 view==='people'?`${decisionButton('housing')}${decisionButton('education')}${decisionButton('health')}${decisionButton('migration')}`:
 view==='government'?`${decisionButton('welfare')}${decisionButton('tax-up')}${decisionButton('reform')}${decisionButton('green')}`:
 view==='diplomacy'?`<button data-action="diplomacy" data-diplomacy="trade"><strong>Propose trade pact</strong><small>1 action</small></button><button data-action="diplomacy" data-diplomacy="alliance"><strong>Build alliance</strong><small>1 action</small></button><button data-action="diplomacy" data-diplomacy="aid"><strong>Send aid</strong><small>1 action</small></button>`:
 view==='military'?`${decisionButton('defense')}${decisionButton('cyber')}${decisionButton('logistics')}`:
 `${decisionButton('infrastructure')} ${decisionButton('industry')} ${decisionButton('education')} ${decisionButton('green')}`;
 const system=view==='development'?`<div class="systems-grid"><div><small>NATIONAL RESOURCES</small><div class="bars">${[['Food',n.resources.food],['Water',n.resources.water],['Minerals',n.resources.minerals],['Energy',n.resources.energy],['Tourism',n.resources.tourism]].map(x=>`<label><span>${x[0]} <b>${x[1].toFixed(0)}</b></span><i><em style="width:${clamp(x[1],0,100)}%"></em></i></label>`).join('')}</div></div><div class="deterrence-card"><small>GENERATION</small><strong>${n.generation.number}</strong><span>${n.generation.label}</span></div></div>`:
 view==='culture'?`<div class="systems-grid"><div><small>CULTURAL FIELD</small><div class="bars">${[['Creativity',n.culture.creativity],['Participation',n.culture.participation],['Prestige',n.culture.prestige],['Tourism',n.resources.tourism]].map(x=>`<label><span>${x[0]} <b>${x[1].toFixed(0)}</b></span><i><em style="width:${clamp(x[1],0,100)}%"></em></i></label>`).join('')}</div></div><div class="fiscal-orbit"><strong>${n.identity}</strong><span>NATIONAL CHARACTER</span><em>Your culture changes through education, prosperity, creativity and the stories your people choose to tell.</em></div></div>`:
 view==='economy'?`<div class="systems-grid"><div><small>ECONOMIC SECTORS</small><div class="bars">${[['Agriculture',n.economy.agriculture],['Manufacturing',n.economy.manufacturing],['Services',n.economy.services],['Technology',n.economy.technology],['Energy',n.economy.energy]].map(x=>`<label><span>${x[0]} <b>${x[1].toFixed(0)}</b></span><i><em style="width:${clamp(x[1],0,100)}%"></em></i></label>`).join('')}</div></div><div><small>FISCAL POSITION</small><div class="fiscal-orbit"><strong>${money(n.treasury)}</strong><span>TREASURY</span><em>${n.tax}% effective tax · ${money(n.debt)} debt</em></div></div></div>`:
 view==='people'?`<div class="systems-grid"><div><small>SOCIAL COALITION</small><div class="group-list">${n.groups.map(g=>`<div><span>${g.name}</span><b>${Math.round(g.support)}%</b><i><em style="width:${g.support}%"></em></i></div>`).join('')}</div></div><div><small>DEMOGRAPHICS</small><div class="demographic-ring"><b>${n.urban}%</b><span>URBAN</span><i>Education ${n.edu}% · Housing ${n.housing.toFixed(0)}%</i></div></div></div>`:
 view==='diplomacy'?`<div class="systems-grid"><div><small>FOREIGN RELATIONS</small><div class="neighbor-list">${n.neighbors.map((x,i)=>`<div><span>${x.name}</span><b>${x.relation}</b><button ${n.actionPoints<1?'disabled ':''} data-diplomacy="dialogue" data-neighbor="${i}">ENGAGE</button></div>`).join('')}</div></div><div><small>TRADE BALANCE</small><div class="fiscal-orbit"><strong>${money(n.trade.exports-n.trade.imports)}</strong><span>NET TRADE</span><em>Exports ${money(n.trade.exports)} · Imports ${money(n.trade.imports)}</em></div></div></div>`:
 view==='military'?`<div class="systems-grid"><div><small>DEFENSE CAPABILITY</small><div class="bars">${[['Army',n.military.army],['Navy',n.military.navy],['Air Force',n.military.air],['Cyber',n.military.cyber],['Logistics',n.military.logistics]].map(x=>`<label><span>${x[0]} <b>${x[1].toFixed(0)}</b></span><i><em style="width:${x[1]}%"></em></i></label>`).join('')}</div></div><div class="deterrence-card"><small>DETERRENCE</small><strong>${Math.round(n.military.deterrence)}</strong><span>regional credibility</span></div></div>`:
 `<div class="systems-grid"><div><small>SYSTEM PRESSURE</small><div class="flow"><div>👥 PEOPLE</div><b>→</b><div>🏙️ CITIES</div><b>→</b><div>🏗️ INFRASTRUCTURE</div><b>→</b><div>🌍 NATION</div></div></div><div class="fiscal-orbit"><strong>YEAR ${state.year}</strong><span>${n.event?n.event.title:'No active crisis'}</span><em>${n.event?n.event.text:'Your country is stable enough to shape its next decade.'}</em></div></div>`;
 return `<div class="content"><div class="sectionhead"><div><small>${view.toUpperCase()}</small><h2>${({economy:'The economy is a machine you can steer.',people:'People reshape the country.',government:'Politics changes the world below.',diplomacy:'Other nations are watching.',military:'Power depends on what you can sustain.',development:'Build things that outlive you.',culture:'A nation is also what it creates and remembers.'}[view])||'National systems'}</h2></div></div><div class="metriccards">${cards.map(c=>`<article class="statcard"><small>${c[0]}</small><b>${c[1]}</b><span>${c[2]}</span></article>`).join('')}</div>${system}<div class="decision-panel"><div><small>AVAILABLE DECISIONS</small><h3>Spend actions carefully.</h3><p>Every major decision consumes this year's limited government capacity. Money is only half the constraint.</p></div><div class="decision-grid">${actions}</div></div></div>`;
}
function missionBoard(){const n=state.nation;return `<div class="content"><div class="sectionhead"><div><small>MISSION CONTROL</small><h2>Build a country worth remembering.</h2></div></div><div class="missiongrid">${n.missions.map(m=>`<article class="mission ${m.complete?'complete':''}"><div><small>${m.complete?'COMPLETE':'ACTIVE'}</small><h3>${m.title}</h3><p>${m.text}</p></div><strong>+${m.reward} XP</strong></article>`).join('')}</div><div class="panel legacy"><small>LEGACY WALL</small><h3>${n.achievements.length} achievements earned</h3><div class="achievement-row">${(n.achievements.length?n.achievements:[{title:'Your first achievement is waiting.',year:'—'}]).map(a=>`<span>◆ ${a.title} <em>${a.year}</em></span>`).join('')}</div></div></div>`}
function history(){const n=state.nation;return `<div class="content"><div class="sectionhead"><div><small>NATIONAL MEMORY</small><h2>Your decisions leave scars and landmarks.</h2></div><div class="history-stat"><b>${state.year}</b><span>${n.generation.label}</span></div></div><div class="history-feature"><div><small>NATIONAL IDENTITY</small><strong>${n.identity}</strong><span>What your choices have made the country become.</span></div><div><small>FIGURES</small><strong>${n.figures.length}</strong><span>people who entered the national story</span></div><div><small>PROJECTS</small><strong>${n.projects.length}</strong><span>landmarks built by your government</span></div></div><div class="timeline">${n.history.slice().reverse().map(h=>`<article><b>${h.year}</b><div><h3>${h.title}</h3><p>${h.text}</p></div></article>`).join('')}</div>${n.figures.length?`<article class="panel figures-panel"><small>PEOPLE OF THE NATION</small><div class="figure-grid">${n.figures.slice().reverse().map(f=>`<div><b>★ ${f.name}</b><small>${f.role} · Year ${f.year}</small><p>${f.text}</p></div>`).join('')}</div></article>`:''}</div>`}
function mainContent(){if(state.view==='map')return world();if(state.view==='cities')return `<div class="workspace">${world()}${cities()}</div>`;if(state.view==='overview')return `<div class="workspace">${world()}${overview()}</div>`;if(state.view==='history')return history();if(state.view==='missions')return missionBoard();return `<div class="workspace">${world()}${dashboard(state.view)}</div>`}

function featureModal(){return `<div class="modal"><div class="modalcard featuremodal"><button class="close" data-action="close">×</button><small>SIMULATION ENGINE</small><h2>Choose what your nation can simulate.</h2><p>Start with the world you want. Turn deeper systems on as you become curious.</p><div class="featuretabs">${Object.keys(features).map(k=>`<button class="${state.modalCat===k?'active':''}" data-fcat="${k}">${k}</button>`).join('')}</div><div class="featuregrid">${(features[state.modalCat||'WORLD']||[]).map((f,i)=>`<button class="featuretile ${state.nation.features.includes(f)?'on':''}" data-feature="${f}"><b>${state.nation.features.includes(f)?'✓':'＋'}</b><span>${f}</span><small>${['visual','interactive','systemic'][i%3]} layer</small></button>`).join('')}</div></div></div>`}
function reportModal(){const n=state.nation;return `<div class="modal"><div class="modalcard report"><button class="close" data-action="close">×</button><small>YEAR ${state.year} REPORT</small><h2>${n.name} is changing.</h2><p>${n.cities.length} cities now form the backbone of a ${n.terrain.toLowerCase()} nation. Your strongest visible system is ${n.infrastructure>n.environment?'infrastructure':'environment'}.</p><div class="reportgrid">${metric('GDP',money(n.gdp),n.lastReport?.changes?`${n.lastReport.changes.gdp>=0?'+':''}${money(n.lastReport.changes.gdp)}`:'')}${metric('POP',fmt(n.population/1e6)+'M')}${metric('APPROVAL',n.approval+'%')}${metric('HOUSING',n.housing.toFixed(0)+'%')}${metric('ENVIRONMENT',n.environment+'%')}${metric('STABILITY',n.stability+'%')}</div><button class="primary widebtn" data-action="close">BACK TO COUNTRY</button></div></div>`}
function cityModal(i){const c=state.nation.cities[i];return `<div class="modal"><div class="modalcard citymodal"><button class="close" data-action="close">×</button><small>${c.type.toUpperCase()}</small><h2>${c.name}</h2><div class="citybig"><div class="city-art large ${c.type.toLowerCase()}"><div class="mini-buildings">${Array.from({length:16},(_,j)=>`<i style="height:${20+(j*19)%75}px"></i>`).join('')}</div></div></div><div class="metricgrid">${metric('POPULATION',(c.pop).toFixed(2)+'M')}${metric('WEALTH',c.wealth.toFixed(0)+'/100')}${metric('ROLE',c.type)}${metric('GROWTH','+'+(1.2+(c.wealth/100)).toFixed(1)+'%')}</div><p>This city is part of the living map. As the simulation advances, its density, wealth and built form respond to your national decisions.</p></div></div>`}

let landingRenderer,landingScene,landingCamera,landingGlobe,landingComposer,landingBloom,landingFrame,landingResize;
function disposeLandingScene(){
 if(landingFrame)cancelAnimationFrame(landingFrame);
 landingFrame=null;
 if(landingResize){window.removeEventListener('resize',landingResize);landingResize=null}
 if(landingComposer){landingComposer.dispose();landingComposer=null}
 if(landingRenderer){landingRenderer.dispose();landingRenderer=null}
 landingScene=null;landingCamera=null;landingGlobe=null;landingBloom=null;
}
function initLandingGlobe(){
 const host=$('#landing-globe');
 if(!host)return;
 disposeLandingScene();
 const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
 landingScene=new THREE.Scene();
 landingCamera=new THREE.PerspectiveCamera(38,w/h,.1,100);
 const frameLandingCamera=()=>{
   const aspect=Math.max(.35,w/h);
   const vfov=THREE.MathUtils.degToRad(landingCamera.fov);
   const fit=Math.max(1,1/aspect);
   const required=2.34/(Math.tan(vfov/2)/fit);
   landingCamera.position.set(0,0,required*1.12);
   landingCamera.lookAt(0,0,0);
 };
 frameLandingCamera();
 landingCamera.lookAt(0,0,0);
 landingRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 landingRenderer.setPixelRatio(Math.min(1.7,window.devicePixelRatio||1));
 landingRenderer.setSize(w,h,false);
 landingRenderer.outputColorSpace=THREE.SRGBColorSpace;
 landingRenderer.setClearColor(0x000000,0);
 landingRenderer.autoClear=true;
 host.appendChild(landingRenderer.domElement);

 landingGlobe=new THREE.Group();
 landingGlobe.rotation.z=-0.16;
 landingScene.add(landingGlobe);

 // ThreeUI-inspired network globe: a dense, luminous point matrix rather than a solid country shape.
 const pts=[],cols=[];
 const golden=(1+Math.sqrt(5))/2;
 const count=2400;
 for(let i=0;i<count;i++){
   const y=1-(i/(count-1))*2;
   const r=Math.sqrt(Math.max(0,1-y*y));
   const a=i*golden*Math.PI*2;
   const x=Math.cos(a)*r,z=Math.sin(a)*r;
   const wobble=0.985+0.025*Math.sin(i*0.37);
   pts.push(x*wobble*2.28,y*wobble*2.28,z*wobble*2.28);
   const edge=Math.pow(Math.max(0,Math.abs(z/2.28)),1.8);
   cols.push(0.30+0.25*edge,0.78+0.12*(1-edge),0.80+0.14*(1-edge));
 }
 const pg=new THREE.BufferGeometry();
 pg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
 pg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 const pm=new THREE.PointsMaterial({size:.026,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
 const matrix=new THREE.Points(pg,pm);
 landingGlobe.add(matrix);

 // Fine latitude/longitude matrix lines add the dimensional grid read.
 const gridMat=new THREE.LineBasicMaterial({color:0x67d7dc,transparent:true,opacity:.105,depthWrite:false,blending:THREE.AdditiveBlending});
 for(let lat=-75;lat<=75;lat+=15){
   const ring=[]; const phi=THREE.MathUtils.degToRad(lat); const rr=Math.cos(phi)*2.305; const yy=Math.sin(phi)*2.305;
   for(let j=0;j<=96;j++){const a=j/96*Math.PI*2;ring.push(new THREE.Vector3(Math.cos(a)*rr,yy,Math.sin(a)*rr))}
   landingGlobe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),gridMat));
 }
 for(let lon=0;lon<360;lon+=15){
   const ring=[]; const a=THREE.MathUtils.degToRad(lon);
   for(let j=0;j<=96;j++){const p=-Math.PI/2+j/96*Math.PI;ring.push(new THREE.Vector3(Math.cos(p)*Math.cos(a)*2.305,Math.sin(p)*2.305,Math.cos(p)*Math.sin(a)*2.305))}
   landingGlobe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),gridMat));
 }

 // Sparse orbital data routes, matching the Network Globe language.
 const routeMat=new THREE.LineBasicMaterial({color:0x8ce5e8,transparent:true,opacity:.28,blending:THREE.AdditiveBlending});
 const nodes=[];
 for(let i=0;i<18;i++){
   const a=i*2.399, y=Math.sin(i*1.71)*.72, r=Math.sqrt(1-y*y);
   nodes.push(new THREE.Vector3(Math.cos(a)*r*2.31,y*2.31,Math.sin(a)*r*2.31));
 }
 for(let i=0;i<nodes.length;i+=2){
   const a=nodes[i],b=nodes[(i+5)%nodes.length],curve=[];
   for(let j=0;j<=32;j++){const t=j/32; const p=a.clone().lerp(b,t); const lift=Math.sin(Math.PI*t)*(.22+.08*(i%3)); p.normalize().multiplyScalar(2.31+lift); curve.push(p)}
   landingGlobe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve),routeMat));
 }
 const nodeGeo=new THREE.BufferGeometry().setFromPoints(nodes);
 const nodeMat=new THREE.PointsMaterial({color:0xd4ffff,size:.065,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
 landingGlobe.add(new THREE.Points(nodeGeo,nodeMat));

 // Keep the landing renderer genuinely transparent. The bloom composer used by the game
 // writes an opaque post-processing target, which would create a black rectangle here.
 landingComposer=null;
 landingBloom=null;

 let targetX=0,targetY=0,dragging=false,lastX=0,lastY=0;
 host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();targetY=((e.clientX-r.left)/r.width-.5)*.45;targetX=((e.clientY-r.top)/r.height-.5)*.25;if(dragging){landingGlobe.rotation.y+=(e.clientX-lastX)*.005;landingGlobe.rotation.x+=(e.clientY-lastY)*.005;lastX=e.clientX;lastY=e.clientY}});
 host.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;host.setPointerCapture?.(e.pointerId)});
 host.addEventListener('pointerup',e=>{dragging=false;host.releasePointerCapture?.(e.pointerId)});
 host.addEventListener('pointerleave',()=>{dragging=false});

 landingResize=()=>{const ww=Math.max(1,host.clientWidth),hh=Math.max(1,host.clientHeight);landingCamera.aspect=ww/hh;landingCamera.updateProjectionMatrix();const aspect=Math.max(.35,ww/hh);const vfov=THREE.MathUtils.degToRad(landingCamera.fov);const fit=Math.max(1,1/aspect);landingCamera.position.z=(2.34/(Math.tan(vfov/2)/fit))*1.12;landingRenderer.setSize(ww,hh,false);};
 window.addEventListener('resize',landingResize);
 const animate=()=>{
   landingFrame=requestAnimationFrame(animate);
   if(!dragging){landingGlobe.rotation.y+=.0017;landingGlobe.rotation.x+=(targetX*.35-landingGlobe.rotation.x)*.025;landingGlobe.rotation.z+=(-.16-targetY*.18-landingGlobe.rotation.z)*.018}
   landingRenderer.render(landingScene,landingCamera);
 };
 animate();
}
function boot(){document.body.innerHTML='<div id="app"></div>';if(load())showGame();else showLanding();}
function showLanding(){
 disposeLandingScene();
 const app=$('#app');
 app.innerHTML=`<main class="landing"><div class="landing-glow"></div><div class="landing-copy"><small>SIMULATE · BUILD · WATCH IT LIVE</small><h1>FORGE<br><span>A NATION</span></h1><p>Build a country. Then zoom into it and watch your decisions become cities, roads, factories, farms and history.</p><button class="primary launch" data-action="create">CREATE YOUR NATION <b>→</b></button><div class="landing-note">LOCAL-FIRST · SINGLE PLAYER · NO ACCOUNT</div></div><div class="landing-world"><div id="landing-globe" class="landing-globe"></div><div class="landing-orbit orbit-a"></div><div class="landing-orbit orbit-b"></div><div class="landing-scan">NATIONAL SYSTEM / INITIALIZING</div></div></main>`;
 initLandingGlobe();
 const launch=$('.launch');
 if(launch) launch.onclick=()=>{disposeLandingScene();showCreator()};
}
function showCreator(){const app=$('#app');app.innerHTML=`<main class="creator"><div class="creator-card"><div class="creator-head"><small>01 · IDENTITY</small><h1>Make somewhere worth watching.</h1><p>Choose broad traits. The simulation fills in the details.</p></div><div class="presetrow">${Object.keys(presets).map(k=>`<button data-preset="${k}">${k}</button>`).join('')}</div><div class="creator-grid"><label>Nation name<input id="cname" value="${create.name}"></label><label>Capital<input id="ccapital" value="${create.capital}"></label><label>Terrain<select id="cterrain">${terrains.map(t=>`<option ${t===create.terrain?'selected':''}>${t}</option>`).join('')}</select></label><label>Government<select id="cgov">${governments.map(t=>`<option ${t===create.government?'selected':''}>${t}</option>`).join('')}</select></label></div><div class="slidergrid">${[['area','Land area',2,2000],['pop','Population (M)',1,200],['urban','Urbanization',10,98],['edu','Education',20,98],['health','Healthcare',20,98],['industry','Industry',5,90],['agri','Agriculture',3,90],['tech','Technology',3,95]].map(x=>`<label><span>${x[1]} <b id="v-${x[0]}">${create[x[0]]}</b></span><input type="range" data-create="${x[0]}" min="${x[2]}" max="${x[3]}" value="${create[x[0]]}"></label>`).join('')}</div><div class="creator-foot"><div><small>VIABILITY</small><b id="viability">Balanced</b></div><button type="button" class="primary" data-action="forge" id="forge-nation-btn">FORGE THIS NATION →</button></div></div></main>`;$$('[data-preset]').forEach(b=>b.onclick=()=>{Object.assign(create,presets[b.dataset.preset]);showCreator()});$$('[data-create]').forEach(i=>i.oninput=()=>{create[i.dataset.create]=+i.value;$('#v-'+i.dataset.create).textContent=i.value;updateViability()});$$('#cname,#ccapital,#cterrain,#cgov').forEach(i=>i.oninput=()=>{if(i.id==='cname')create.name=i.value;if(i.id==='ccapital')create.capital=i.value;if(i.id==='cterrain')create.terrain=i.value;if(i.id==='cgov')create.government=i.value});const forgeBtn=$('#forge-nation-btn');if(forgeBtn)forgeBtn.onclick=()=>createNation();updateViability()}
function updateViability(){const pressure=(create.pop/Math.max(10,create.area))*18+Math.abs(create.industry-create.agri)*.15;$('#viability').textContent=pressure>35?'Extreme':pressure>20?'Challenging':'Balanced'}
function showGame(opts={}){const app=$('#app');const oldMainScroll=opts.mainScroll??(opts.preserveScroll?($('#main')?.scrollTop||0):0);const pageX=opts.pageX??(window.scrollX||0),pageY=opts.pageY??(window.scrollY||0);const render=()=>{app.innerHTML=top()+`<div class="game">${sidebar()}<main class="main" id="main">${mainContent()}</main><aside class="right"><div class="rightcard"><small>COUNTRY PULSE</small><div class="pulse"><span>APPROVAL</span><b>${state.nation.approval}%</b><i style="width:${state.nation.approval}%"></i></div><div class="pulse"><span>ENVIRONMENT</span><b>${state.nation.environment}%</b><i style="width:${state.nation.environment}%"></i></div><div class="pulse"><span>INFRASTRUCTURE</span><b>${state.nation.infrastructure}%</b><i style="width:${state.nation.infrastructure}%"></i></div></div><div class="rightcard news"><small>LIVE NEWS</small>${state.nation.news.map(x=>`<div><b>${x.icon}</b><span><strong>${x.title}</strong>${x.text}</span></div>`).join('')}</div><div class="rightcard next"><small>GOVERNMENT CAPACITY</small><p>${state.nation.actionPoints} actions remain this year. ${state.nation.pressure?.headline||'Watch the country before committing.'}</p><button class="primary widebtn" data-action="advance">${state.playing?'PAUSE':'ADVANCE YEAR'} →</button></div></aside></div>${state.modal==='features'?featureModal():state.modal==='report'?reportModal():state.modal==='city'?cityModal(state.selected):state.modal==='explain'?explainModal(state.modalTopic||'overview'):''}`;renderToast();bindGame();if($('#scene'))createScene();
 const restore=()=>{const m=$('#main');if(m)m.scrollTop=oldMainScroll;window.scrollTo(pageX,pageY);if(opts.navigation&&m){m.classList.remove('nav-enter');void m.offsetWidth;m.classList.add('nav-enter');setTimeout(()=>m.classList.remove('nav-enter'),240)}};
 requestAnimationFrame(()=>requestAnimationFrame(restore));
};
 if(opts.transition!==false && document.startViewTransition){document.startViewTransition(render)}else render()}
let renderer,scene,camera,worldGroup,raycaster,mouse,composer,bloomPass;let animation,resizeObserver;
function createScene(){
 const host=$('#scene');
 if(!host)return;
 try{
   if(composer){composer.dispose();composer=null} if(renderer){renderer.dispose();renderer=null}
   host.classList.remove('fallback-scene');
   host.innerHTML='';
   scene=new THREE.Scene();
   scene.fog=new THREE.Fog(0x061015,25,90);
   camera=new THREE.PerspectiveCamera(42,Math.max(.1,host.clientWidth/Math.max(1,host.clientHeight)),.1,200);
   camera.position.set(0,16.5,22); camera.lookAt(0,0,0);
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
   renderer.setPixelRatio(Math.min(1.75,window.devicePixelRatio||1));
   renderer.setSize(host.clientWidth,host.clientHeight,false);
   renderer.shadowMap.enabled=true;
   renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   host.appendChild(renderer.domElement);
   scene.add(new THREE.HemisphereLight(0xa8e9ef,0x16251e,2.1));
   const sun=new THREE.DirectionalLight(0xffe7ba,3.2);
   sun.position.set(12,25,10); sun.castShadow=true; scene.add(sun);
   worldGroup=new THREE.Group(); scene.add(worldGroup); buildWorld(); addSpatialUI(); syncCityOverlay();
   composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera)); bloomPass=new UnrealBloomPass(new THREE.Vector2(host.clientWidth,host.clientHeight),.28,.55,.86); composer.addPass(bloomPass);
   raycaster=new THREE.Raycaster(); mouse=new THREE.Vector2();
   renderer.domElement.addEventListener('pointerdown',onWorldClick);
   renderer.domElement.addEventListener('wheel',onWheel,{passive:true});
   let drag=false,lastX=0;
   renderer.domElement.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;renderer.domElement.setPointerCapture?.(e.pointerId)});
   renderer.domElement.addEventListener('pointerup',e=>{drag=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});
   renderer.domElement.addEventListener('pointermove',e=>{if(drag&&worldGroup){worldGroup.rotation.y+=(e.clientX-lastX)*.006;lastX=e.clientX}});
   if(resizeObserver)resizeObserver.disconnect();
   if(window.ResizeObserver){resizeObserver=new ResizeObserver(()=>{
     if(host.clientWidth&&renderer&&camera){
       camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);
       camera.updateProjectionMatrix();
       renderer.setSize(host.clientWidth,host.clientHeight,false); if(composer){composer.setSize(host.clientWidth,host.clientHeight);}
     }
   });resizeObserver.observe(host);}
   cancelAnimationFrame(animation);
   const tick=()=>{
     animation=requestAnimationFrame(tick);
     if(worldGroup){worldGroup.rotation.y+=.0007;const spatial=worldGroup.userData.spatial;if(spatial){spatial.rotation.y+=.0018;spatial.rotation.z+=.00035;spatial.children.forEach((o,i)=>{if(o.isMesh&&o.geometry?.type==='SphereGeometry')o.scale.setScalar(1+Math.sin(performance.now()*.002+i)*.12)})}}
     positionCityOverlay();
     if(renderer&&scene&&camera){if(composer)composer.render();else renderer.render(scene,camera);}
   };
   tick();
 }catch(error){
   console.warn('3D world unavailable; using resilient fallback.',error);
   cancelAnimationFrame(animation);
   fallbackScene(host);
 }
}

function fallbackScene(host){
 host.classList.add('fallback-scene');
 const n=state.nation;
 const cities=n.cities||[];
 const nodes=cities.map((c,i)=>{
   const angle=(i/cities.length)*Math.PI*2-.55;
   const radius=i===0?17:25+(i%3)*7;
   const x=50+Math.cos(angle)*radius;
   const y=51+Math.sin(angle)*radius*.48;
   return `<button class="fallback-city ${i===0?'capital':''}" style="left:${x}%;top:${y}%" data-city="${i}" title="${c.name}"><i></i><span>${c.name}</span></button>`;
 }).join('');
 host.innerHTML=`<div class="fallback-stars"></div>
   <div class="fallback-orbit orbit-a"></div><div class="fallback-orbit orbit-b"></div>
   <div class="fallback-globe"><div class="fallback-grid"></div><div class="fallback-land"></div><div class="fallback-shine"></div></div>
   <div class="fallback-scan"></div>${nodes}
   <div class="fallback-status"><span>WORLD ENGINE</span><b>LIVE</b><small>GPU FALLBACK MODE · MAP DATA PRESERVED</small></div>`;
 $$('.fallback-city',host).forEach(c=>c.onclick=()=>{state.modal='city';state.selected=+c.dataset.city;showGame()});
}

function mat(color,rough=.8){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.05})}
function cityPosition(i,count){
 const angles=[-0.35,0.45,1.28,2.05,2.9,3.82,4.62,5.35,0.95,4.05];
 const radii=[2.1,5.0,6.0,6.9,6.4,7.3,5.8,7.1,7.9,8.2];
 const a=angles[i%angles.length] + Math.floor(i/angles.length)*0.45;
 const r=radii[i%radii.length];
 return {x:Math.cos(a)*r,z:Math.sin(a)*r*.76};
}
function insideLand(x,z,margin=.35){
 const rx=12.65-margin, rz=10.15-margin;
 return (x*x)/(rx*rx)+(z*z)/(rz*rz) < .91;
}
function buildWorld(){
 const n=state.nation; const land=state.terrainSeed||n.terrain;
 worldGroup.userData.cityAnchors=[];
 // A large water plane makes the coastline unambiguous; the land plate always sits above it.
 const water=new THREE.Mesh(new THREE.PlaneGeometry(90,90),mat(0x123e4b,.34));
 water.rotation.x=-Math.PI/2; water.position.y=-.92; water.receiveShadow=true; worldGroup.add(water);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(13.05,13.05,1.35,96),mat(0x314c3b));
 base.scale.z=.82; base.receiveShadow=true; base.castShadow=true; worldGroup.add(base);
 const coast=new THREE.Mesh(new THREE.RingGeometry(12.62,13.12,128),mat(0x8aa16b,.72));
 coast.scale.z=.82; coast.rotation.x=-Math.PI/2; coast.position.y=.18; worldGroup.add(coast);
 // subtle province separators keep the map legible without turning it into a dashboard grid.
 const borderMat=new THREE.LineBasicMaterial({color:0xb5c58a,transparent:true,opacity:.23});
 for(let i=0;i<6;i++){
   const a=-.15+i*(Math.PI*2/6), pts=[];
   for(let j=0;j<18;j++){const r=1.2+j*.64; pts.push(new THREE.Vector3(Math.cos(a)*r,.72,Math.sin(a)*r*.76))}
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),borderMat); worldGroup.add(line);
 }
 const terrainColors=land.includes('Desert')?[0xc59a61,0xb88b52]:land.includes('Mountain')?[0x667b72,0x50645f]:land.includes('Forest')?[0x41694b,0x34563e]:[0x5c7b55,0x7b8b55];
 for(let i=0;i<135;i++){
   const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*11.65,x=Math.cos(a)*r,z=Math.sin(a)*r*.78;
   if(!insideLand(x,z,.1)) continue;
   const h=.12+Math.random()*.35+(Math.random()>.91?Math.random()*1.2:0);
   const g=new THREE.Mesh(new THREE.CylinderGeometry(.5+Math.random()*.7,.7+Math.random()*.8,h,7),mat(pick(terrainColors)));
   g.position.set(x,h/2-.15,z);g.castShadow=true;worldGroup.add(g)
 }
 for(let i=0;i<(land.includes('Mountain')?10:5);i++){
   const x=-8.5+i*4.0+(Math.random()-.5)*1.2,z=-6.7+(Math.random()-.5)*2;
   const m=new THREE.Mesh(new THREE.ConeGeometry(1.5+Math.random(),3+Math.random()*3,7),mat(0x596d69));
   if(insideLand(x,z,.2)){m.position.set(x,1.2,z);m.castShadow=true;worldGroup.add(m)}
 }
 // Rivers terminate safely before reaching the coast; they no longer visually cut through city districts.
 const riverCurve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(-11,.67,-6.5),new THREE.Vector3(-7,.7,-3.8),new THREE.Vector3(-3,.72,-.8),
   new THREE.Vector3(1,.72,2.4),new THREE.Vector3(5,.7,4.8),new THREE.Vector3(9,.67,6.0)
 ]);
 worldGroup.add(new THREE.Mesh(new THREE.TubeGeometry(riverCurve,38,.13,7,false),mat(0x4a9db0,.25)));
 const roadMat=mat(0x263438);
 for(const pts of [
   [[-9,.76,3],[0,.77,0],[8.5,.76,-3]],
   [[-7,.77,-5.5],[-2,.78,0],[5.2,.77,5.5]],
   [[7,.78,-6.2],[3,.78,-2.0],[0,.78,0]],
   [[-4,.79,6.0],[0,.79,2.0],[4.5,.79,.5]]
 ]){
   const clean=pts.filter(p=>insideLand(p[0],p[2],.2));
   if(clean.length>1){const curve=new THREE.CatmullRomCurve3(clean.map(p=>new THREE.Vector3(...p)));worldGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve,35,.075,5,false),roadMat))}
 }
 const count=n.cities.length;
 n.cities.forEach((c,i)=>{
   const pos=cityPosition(i,count); const city=new THREE.Group(); city.userData={cityIndex:i,cityX:pos.x,cityZ:pos.z};
   const plaza=new THREE.Mesh(new THREE.CylinderGeometry(i===0?1.8:1.15,i===0?1.8:1.15,.12,16),mat(i===0?0xc29a61:0x6c766b));
   plaza.position.y=.82; city.add(plaza);
   const countBuildings=i===0?34:10+Math.floor(c.pop*7);
   for(let b=0;b<countBuildings;b++){
     let bx,bz; let tries=0;
     do{bx=pos.x+(Math.random()-.5)*(i===0?3.0:1.9);bz=pos.z+(Math.random()-.5)*(i===0?2.6:1.8);tries++}while(!insideLand(bx,bz,.25)&&tries<20);
     if(!insideLand(bx,bz,.2)) continue;
     const h=(c.wealth/32)+Math.random()*1.35+(c.type==='Industrial'?Math.random()*.7:0);
     const building=new THREE.Mesh(new THREE.BoxGeometry(.25+Math.random()*.35,h,.25+Math.random()*.35),mat(c.type==='Industrial'?0x596168:c.type==='University'?0x7f8a77:c.wealth>65?0xb58d71:0x8b8172));
     building.position.set(bx-pos.x,.87+h/2,bz-pos.z);building.castShadow=true;building.userData.landChecked=true;city.add(building)
   }
   // landmark tower makes the capital/population centers visible at normal zoom.
   if(i===0){const tower=new THREE.Mesh(new THREE.BoxGeometry(.45,3.2,.45),mat(0xc7aa6f));tower.position.y=2.45;tower.castShadow=true;city.add(tower)}
   city.position.set(pos.x,0,pos.z);worldGroup.add(city);worldGroup.userData.cityAnchors.push(city);
 });
 for(let i=0;i<34;i++){
   const a=Math.random()*6.28,r=7+Math.random()*4,x=Math.cos(a)*r,z=Math.sin(a)*r*.78;
   if(!insideLand(x,z,.2)) continue;
   const t=new THREE.Mesh(new THREE.ConeGeometry(.18,.65,5),mat(0x3b6d47));t.position.set(x,.9,z);t.castShadow=true;worldGroup.add(t)
 }
 applyLayer();
}
function addSpatialUI(){
 if(!worldGroup)return;
 const n=state.nation; const orbit=new THREE.Group(); orbit.userData.spatial=true;
 for(let r=0;r<3;r++){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(5.4+r*2.2,.018,6,96),new THREE.MeshBasicMaterial({color:[0x8ce5e8,0xb7e9b0,0xd7b06f][r],transparent:true,opacity:.22})); ring.rotation.x=Math.PI/2; ring.rotation.z=r*.22; orbit.add(ring);
 }
 const points=[['GDP',n.gdp,0x8ce5e8],['PEOPLE',n.population/1e6,0xb7e9b0],['POWER',n.military.deterrence,0xd7b06f],['GREEN',n.environment,0x77c98f],['STABILITY',n.stability,0xb9a3d6]];
 points.forEach((q,i)=>{const a=i/points.length*Math.PI*2;const rr=7.4;const node=new THREE.Mesh(new THREE.SphereGeometry(.11+(i===0?.08:0),12,8),new THREE.MeshBasicMaterial({color:q[2],transparent:true,opacity:.85}));node.position.set(Math.cos(a)*rr,.95,Math.sin(a)*rr*.76);node.userData.metric=q[0];orbit.add(node)});
 worldGroup.add(orbit); worldGroup.userData.spatial=orbit;
}

function syncCityOverlay(){
 const host=$('#scene'); if(!host||!camera||!worldGroup)return;
 let layer=$('#city-overlays',host);
 if(!layer){layer=document.createElement('div');layer.id='city-overlays';host.appendChild(layer)}
 host.dataset.layer=state.layer; const cities=state.nation.cities||[]; layer.innerHTML='';
 cities.forEach((c,i)=>{
   const city=worldGroup.userData.cityAnchors?.[i]; if(!city)return;
   const b=document.createElement('button'); b.className='city-overlay '+(i===0?'capital':''); b.dataset.city=i;
   b.innerHTML=`<span class="city-dot"></span><span class="city-copy"><b>${c.name}</b><small>${c.pop.toFixed(1)}M people</small></span><span class="city-popbar"><i style="width:${Math.min(100,8+Math.sqrt(c.pop)*18)}%"></i></span>`;
   b.title=`${c.name} · ${c.pop.toFixed(1)}M population`;
   b.onclick=()=>{state.modal='city';state.selected=i;showGame()}; layer.appendChild(b)
 });
}
function positionCityOverlay(){
 const host=$('#scene'); if(!host||!camera||!worldGroup)return;
 const layer=$('#city-overlays',host); if(!layer)return;
 const anchors=worldGroup.userData.cityAnchors||[]; worldGroup.updateMatrixWorld(true);
 $$('.city-overlay',layer).forEach((el,i)=>{
   const city=anchors[i]; if(!city)return; const p=new THREE.Vector3(0,2.0,0); city.localToWorld(p); p.project(camera);
   const x=(p.x*.5+.5)*host.clientWidth, y=(-p.y*.5+.5)*host.clientHeight;
   const visible=p.z>-1&&p.z<1&&x>-40&&x<host.clientWidth+40&&y>-40&&y<host.clientHeight+40;
   el.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; el.style.opacity=visible?'1':'0'; el.style.visibility=visible?'visible':'hidden';
 });
}
function applyLayer(){if(!worldGroup)return;const palettes={political:[0x5c7b55,0x7b8b55],population:[0x507b8b,0xa5b85c],economy:[0x5f596e,0xc48c5d],resources:[0x596e59,0xd3a35f],infrastructure:[0x48545b,0x9ca8a0],environment:[0x3b6f4d,0x83a75a],military:[0x4f5658,0x9a6b68]};let p=palettes[state.layer]||palettes.political;worldGroup.children.forEach(o=>{if(o.isMesh&&o.material&&o.geometry.type==='CylinderGeometry'&&o.geometry.parameters?.radialSegments===7)o.material.color.set(p[0])})}
function onWorldClick(e){if(!renderer||!raycaster)return;const rect=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(worldGroup.children,true);for(const h of hits){let o=h.object;while(o&&o.parent&&!o.userData.cityIndex)o=o.parent;if(o?.userData?.cityIndex!=null){state.modal='city';state.selected=o.userData.cityIndex;showGame();return}}}
function onWheel(e){state.zoom=clamp(state.zoom+(e.deltaY>0?1:-1),0,3);const targets=[[0,16.5,22],[0,12.8,17.5],[0,9.2,13.2],[0,6.7,9.6]][state.zoom];camera?.position.lerp(new THREE.Vector3(...targets),.25);camera?.lookAt(0,0,0)}
function completeProjects(){
 const n=state.nation; const completed=[]; const remain=[];
 for(const p of n.activeProjects){
   p.remaining--;
   if(p.remaining>0){remain.push(p);continue}
   const e=p.effect||{};
   if(e.infrastructure)n.infrastructure=clamp(n.infrastructure+e.infrastructure,0,100);
   if(e.logistics)n.military.logistics=clamp(n.military.logistics+e.logistics,0,100);
   if(e.trade)n.trade.exports*=1+e.trade;
   if(e.urban)n.urban=clamp(n.urban+e.urban,10,99);
   if(e.gdp)n.gdp*=1+e.gdp;
   if(e.prestige)n.culture.prestige=clamp(n.culture.prestige+e.prestige,0,100);
   if(e.energy)n.energy=clamp(n.energy+e.energy,0,100);
   if(e.inflation)n.inflation=clamp(n.inflation+e.inflation,1,18);
   if(e.industry)n.industry=clamp(n.industry+e.industry,0,100);
   if(e.environment)n.environment=clamp(n.environment+e.environment,0,100);
   if(e.housing)n.housing=clamp(n.housing+e.housing,0,100);
   if(e.edu)n.edu=clamp(n.edu+e.edu,0,100);
   if(e.tech)n.tech=clamp(n.tech+e.tech,0,100);
   if(e.approval)n.approval=clamp(n.approval+e.approval,20,95);
   if(e.health)n.health=clamp(n.health+e.health,0,100);
   if(e.happiness)n.happiness=clamp(n.happiness+e.happiness,0,100);
   n.history.push({year:state.year,title:`Completed: ${p.title}`,text:`The project delivered its planned benefits after ${p.total} years of construction.`});
   n.news.unshift({icon:'🏁',title:`${p.title} completed`,text:'The investment has moved from promise to infrastructure.'}); completed.push(p);
 }
 n.activeProjects=remain;
 return completed;
}
function advance(){
 const n=state.nation; const before={population:n.population,gdp:n.gdp,approval:n.approval,stability:n.stability,environment:n.environment,infrastructure:n.infrastructure,treasury:n.treasury};
 if(n.event){toast('Resolve the active crisis before ending the year.');return}
 state.year++;
 completeProjects();
 const capacity=(n.tech*.0008+n.industry*.0005+n.economy.services*.00035+n.agri*.00018);
 const fiscal=(n.tax-22)*-.0007;
 const investment=(n.spending.infrastructure+n.spending.research)*.00025;
 const supplyFactor=1+((n.resources.food+n.resources.energy+n.resources.water)/300-0.72)*.04;
 n.population=Math.round(n.population*(1+.0025+(n.health+n.edu-120)*.000015+(n.housing-60)*.000004));
 n.gdp*=1+capacity+n.tech*.00025+n.edu*.00012+fiscal+investment-.004-n.inflation*.00018;
 n.gdp*=supplyFactor;
 const revenue=n.gdp*(n.tax/100)*.055;
 const spending=n.gdp*.025+n.spending.education*.01+n.spending.health*.01+n.spending.infrastructure*.01+n.spending.defense*.01+n.spending.welfare*.01;
 n.fiscalBalance=revenue-spending;
 n.treasury=clamp(n.treasury+n.fiscalBalance,0,n.gdp*.35);
 n.inflation=clamp(n.inflation+(n.gdp>before.gdp?.12:-.08)+(n.treasury<1?.45:0)+(n.pressure?.score>55?.3:0),1,18);
 n.approval=clamp(n.approval+(n.pressure?.score<25?1:-1.4)+(n.jobs>92?1:-.7)+(n.inflation>8?-1.4:0)+(n.housing<40?-1.2:0),20,94);
 n.happiness=clamp(n.happiness+(n.approval-60)*.015+(n.housing-60)*.01-(n.inflation-5)*.04,25,95);
 n.stability=clamp(n.stability+(n.approval-65)*.02+(n.happiness-60)*.01-(n.pressure?.score||0)*.012,20,96);
 n.infrastructure=clamp(n.infrastructure+(n.spending.infrastructure*.025)+(n.gdp>100?1.1:.5)-(n.pressure?.energy||0)*.01,15,98);
 n.environment=clamp(n.environment+(n.industry>55?-0.45:.12)+(n.projects.some(p=>p.type==='green')?.35:0)-(n.economy.energy*.006),10,98);
 n.housing=clamp(n.housing+(n.infrastructure*.004-.15)+(n.projects.filter(p=>p.type==='housing').length*.12)-(n.urban>70?.5:0),10,98);
 n.jobs=clamp(n.jobs+(n.edu*.002-.12)+(n.industry*.001)-(n.inflation>9?.35:0),55,99);
 n.energy=clamp(n.energy+(n.industry*.006-n.urban*.002)+(n.projects.some(p=>p.type==='energy')?.45:0),20,99);
 n.urban=clamp(n.urban+(n.jobs>85?.35:-.1),10,99);
 n.economy.agriculture=clamp(n.agri+(n.environment-60)*.04,0,100);
 n.economy.manufacturing=clamp(n.industry+(n.infrastructure-50)*.03,0,100);
 n.economy.services=clamp(100-n.economy.agriculture-n.economy.manufacturing+n.tech*.05,5,100);
 n.economy.technology=clamp(n.tech*.7+n.spending.research*.45,1,100);
 n.economy.energy=clamp(n.energy*.7,1,100);
 n.groups.forEach(g=>{g.support=clamp(g.support+(n.approval-g.support)*.08+(g.name==='Business'?(n.tax<24?1:-1):g.name==='Workers'?(n.jobs>90?1:-.5):g.name==='Rural'?(n.agri>30?.6:-.5):g.name==='Youth'?(n.edu>70?.8:-.3):n.urban>65?.5:-.2),15,95)});
 n.trade.exports=clamp(n.gdp*(.08+n.economy.manufacturing*.0007+n.neighbors.reduce((a,b)=>a+b.relation,0)/10000),0,n.gdp*.45);
 n.trade.imports=clamp(n.gdp*(.07+n.tech*.0003+n.trade.tariff*.0004+(n.pressure?.food||0)*.0008),0,n.gdp*.4);
 n.military.army=clamp(n.military.army+n.spending.defense*.025,0,100);
 n.military.cyber=clamp(n.military.cyber+n.spending.research*.018,0,100);
 n.military.logistics=clamp(n.military.logistics+n.infrastructure*.006,0,100);
 n.military.deterrence=clamp(n.military.army*.35+n.military.air*.2+n.military.navy*.18+n.military.cyber*.12+n.military.logistics*.15,0,100);
 n.neighbors.forEach(x=>x.relation=clamp(x.relation+(n.military.deterrence>65?-.2:.1)+(n.trade.exports>n.trade.imports?.35:0),5,95));
 n.resources.food=clamp(n.agri+(n.environment-55)*.05+n.economy.agriculture*.08-(n.population/1e6)*.12,0,100);
 n.resources.water=clamp(n.resources.water+(n.terrain.includes('River')?.18:-.08)-(n.population/1e6>n.area*.08?.25:0),0,100);
 n.resources.minerals=clamp(n.resources.minerals+(n.industry*.012-n.environment*.004),0,100);
 n.resources.energy=clamp(n.energy*.7+(n.tech*.08)-(n.industry*.08),0,100);
 n.resources.tourism=clamp(n.resources.tourism+(n.environment-60)*.03+(n.culture.prestige-50)*.02,0,100);
 n.culture.creativity=clamp(n.culture.creativity+n.edu*.012+n.tech*.008-0.12,0,100);
 n.culture.participation=clamp(n.culture.participation+n.happiness*.006+n.approval*.004-0.18,0,100);
 n.culture.prestige=clamp(n.culture.prestige+n.culture.creativity*.004+n.tech*.003-0.1,0,100);
 n.cities.forEach(c=>{const growth=.008+(c.wealth-50)*.00008+(n.infrastructure-50)*.00004-(n.housing<35?.003:0);c.pop=clamp(c.pop*(1+growth),.08,25);c.wealth=clamp(c.wealth+(n.gdp>before.gdp?1:-.4)+(n.infrastructure-55)*.008,20,99)});
 if(state.year%5===0&&n.cities.length<10)n.cities.push({name:pick(['Lakeview','New Meridian','Southport','Greenfield','Crown Bay','Stonebridge']),pop:.2+Math.random()*.5,wealth:40+Math.random()*35,type:pick(['Residential','Agricultural','Industrial','Coastal','University'])});
 updatePressure();
 const events=[];
 if(n.pressure.energy>30)events.push(['⚡','Power shortage','Demand is outrunning reliable generation. Industry and households face outages.','energy']);
 if(n.pressure.housing>35)events.push(['🏙️','Housing crisis','Rents are rising faster than incomes. Urban voters want action.','people']);
 if(n.pressure.food>30)events.push(['🌾','Food security warning','Domestic supply is under pressure. Imports can help, but cost money.','food']);
 if(n.inflation>10)events.push(['💸','Cost-of-living crisis','Prices are rising fast enough to damage household confidence.','politics']);
 if(n.stability<45)events.push(['🏛️','Political instability','Coalition support is fragmenting and protests are becoming more likely.','politics']);
 if(n.pressure.score<25&&state.year%4===0)events.push(['📈','Growth opportunity','Demand is strong and investors are looking for a place to expand.','trade']);
 if(events.length){const e=events[0];n.event={icon:e[0],title:e[1],text:e[2],type:e[3],year:state.year};n.news.unshift({icon:e[0],title:e[1],text:e[2]});}
 if(state.year%10===0){n.generation.number++;n.generation.label=['Founding Generation','Builders Generation','Growth Generation','Innovation Generation','Legacy Generation'][Math.min(4,n.generation.number-1)];n.history.push({year:state.year,title:'A new generation takes the stage',text:`The country enters generation ${n.generation.number}. Earlier investments now shape the lives of people growing up in a different nation.`});}
 if(state.year%12===0){const roles=[['scientist','Dr. Mira Sen','A young researcher becomes nationally known for turning university research into practical technology.'],['artist','Ari Vale','A cultural figure helps give the country a recognizable creative voice.'],['builder','Samir Holt','An engineer becomes famous for leading a landmark national project.']];const f=pick(roles);n.figures.push({year:state.year,role:f[0],name:f[1],text:f[2]});n.history.push({year:state.year,title:`${f[1]} enters national history`,text:f[2]});n.news.unshift({icon:'★',title:'A new national figure emerges',text:`${f[1]} is becoming known as a ${f[0]}.`});}
 const title=pick(['Households are moving toward the cities','Manufacturing demand is rising','A new generation enters the workforce','The treasury faces competing priorities','Local businesses report stronger demand','Infrastructure is changing regional trade']);
 n.history.push({year:state.year,title,text:`GDP ${n.gdp>=before.gdp?'expanded':'contracted'} by ${Math.abs((n.gdp-before.gdp)/Math.max(1,before.gdp)*100).toFixed(1)}%; pressure is ${Math.round(n.pressure.score)}/100.`});
 n.news.unshift({icon:pick(['🏗️','🏙️','🌾','📈','⚡','🚆']),title,text:`The country enters Year ${state.year} with ${n.actionPoints} government actions available.`});
 n.news=n.news.slice(0,5);
 n.actionPoints=n.maxActions;
 awardXP(10,'Year advanced');checkMissions();n.lastReport={year:state.year,changes:{population:n.population-before.population,gdp:n.gdp-before.gdp,approval:n.approval-before.approval,stability:n.stability-before.stability,environment:n.environment-before.environment,infrastructure:n.infrastructure-before.infrastructure,treasury:n.treasury-before.treasury}};updateIdentity();save();showGame({preserveScroll:true});if(state.view!=='history')state.modal='report';showGame({preserveScroll:true})
}
function spendAction(type){
 const d=decisionDefs[type]; const n=state.nation;
 if(!d)return false;
 if(n.actionPoints<d.actions){toast(`Not enough government actions this year.`);return false}
 if(d.cost>n.treasury){toast(`Treasury cannot afford ${d.label.toLowerCase()}.`);return false}
 n.actionPoints-=d.actions;
 if(d.cost)n.treasury=Math.max(0,n.treasury-d.cost);
 return true;
}
function queueProject(type,title,cost,years,effect){
 const n=state.nation;
 n.activeProjects.push({type,title,cost,remaining:years,total:years,effect,year:state.year});
 n.projects.push({type,title,city:'Nationwide',year:state.year,status:'under construction'});
}
function policy(type){
 const n=state.nation; if(!spendAction(type))return;
 const note=(icon,title,text)=>{n.news.unshift({icon,title,text});n.history.push({year:state.year,title,text})};
 if(type==='infrastructure'){queueProject(type,'National infrastructure renewal',0,1,{infrastructure:9,logistics:2});n.spending.infrastructure+=2;note('🏗️','Infrastructure program approved','Roads, utilities and logistics are being upgraded. The benefit arrives after construction.');}
 if(type==='rail'){queueProject(type,'National rail spine',0,3,{infrastructure:7,trade:0.06,urban:1.2});n.debt+=n.gdp*.025;note('🚆','National rail construction begins','The network will connect major cities over three years and lower the cost of moving goods.');}
 if(type==='megaproject'){queueProject(type,'National megaproject',0,4,{gdp:0.035,prestige:8,infrastructure:5});n.debt+=n.gdp*.055;note('🏛️','Megaproject commissioned','A generational project has begun. It will consume capacity before it produces prestige and growth.');}
 if(type==='energy'){queueProject(type,'Power expansion',0,2,{energy:12,inflation:-.7});note('⚡','Power expansion begins','New generation capacity is under construction.');}
 if(type==='culture'){n.culture.creativity=clamp(n.culture.creativity+3,0,100);n.culture.participation=clamp(n.culture.participation+2,0,100);n.culture.prestige=clamp(n.culture.prestige+2,0,100);note('🎭','Culture grant approved','Artists, schools and local institutions receive funding.');}
 if(type==='museum'){n.culture.prestige=clamp(n.culture.prestige+5,0,100);n.projects.push({type:'museum',title:'National museum',city:'Capital',year:state.year,status:'open'});note('🏛️','National museum opens','The country gains a permanent institution for memory and culture.');}
 if(type==='festival'){n.culture.participation=clamp(n.culture.participation+4,0,100);n.culture.prestige=clamp(n.culture.prestige+7,0,100);n.resources.tourism=clamp(n.resources.tourism+6,0,100);n.trade.exports*=1.02;note('🎪','World festival announced','Visitors arrive, tourism rises and the country gains international visibility.');}
 if(type==='tax-cut'){n.tax=clamp(n.tax-3,8,40);n.approval+=2;n.groups.find(g=>g.name==='Business').support+=7;n.groups.find(g=>g.name==='Workers').support+=2;note('💸','Tax reduction passed','Private demand rises, but future government revenue will be lower.');}
 if(type==='industry'){queueProject(type,'Industrial capacity program',0,2,{industry:8,gdp:0.018,environment:-3});n.groups.find(g=>g.name==='Business').support+=5;note('🏭','Industrial expansion begins','Factories and freight capacity are being built; pollution will rise if clean technology does not keep pace.');}
 if(type==='trade'){n.trade.exports*=1.04;n.neighbors[0].relation=clamp(n.neighbors[0].relation+5,0,100);note('📦','Trade corridor negotiated','Exporters gain access to a larger market. Imports will also rise as the economy integrates.');}
 if(type==='research'){n.tech=clamp(n.tech+2,0,100);n.spending.research+=2;n.culture.creativity=clamp(n.culture.creativity+1,0,100);note('🧪','Research grant approved','Universities receive sustained funding; the payoff compounds rather than arriving instantly.');}
 if(type==='housing'){queueProject(type,'National housing drive',0,2,{housing:11,infrastructure:2});note('🏠','Housing construction begins','New homes are being added to relieve urban pressure.');}
 if(type==='education'){queueProject(type,'Education expansion',0,3,{edu:8,tech:3,approval:2});n.groups.find(g=>g.name==='Youth').support+=4;note('🎓','Education expansion funded','Schools and universities will improve over the next three years.');}
 if(type==='health'){queueProject(type,'Healthcare expansion',0,2,{health:7,happiness:3});note('🏥','Healthcare expansion begins','Access improves as clinics and hospitals come online.');}
 if(type==='migration'){n.population=Math.round(n.population*1.008);n.jobs=clamp(n.jobs-2,45,99);n.urban=clamp(n.urban+1.2,10,99);n.housing=clamp(n.housing-3,5,98);note('🧳','Migration program opened','New residents add skills and demand. Housing pressure is the immediate trade-off.');}
 if(type==='welfare'){n.happiness+=4;n.stability+=1;n.spending.welfare+=2;n.groups.find(g=>g.name==='Workers').support+=5;note('🤝','Welfare expansion','Household security improves, but future budgets carry a larger commitment.');}
 if(type==='tax-up'){n.tax=clamp(n.tax+3,8,40);n.approval-=3;n.groups.find(g=>g.name==='Business').support-=7;note('🏛️','Revenue bill passed','The treasury will gain room, but households and businesses feel the increase.');}
 if(type==='reform'){n.stability=clamp(n.stability+5,0,100);n.approval+=1;note('⚖️','Institutional reform passed','The state becomes more capable of implementing future decisions.');}
 if(type==='green'){queueProject(type,'National restoration program',0,2,{environment:8,tourism:3});note('🌱','Restoration program launched','Protected land and green infrastructure are expanding.');}
 if(type==='defense'){n.military.army=clamp(n.military.army+4,0,100);n.military.air=clamp(n.military.air+3,0,100);n.spending.defense+=3;note('🛡️','Defense modernization ordered','Readiness improves, but the defense budget becomes more demanding.');}
 if(type==='cyber'){n.military.cyber=clamp(n.military.cyber+10,0,100);n.tech+=2;n.spending.defense+=1;note('⌁','Cyber command established','Digital infrastructure and national defense become more resilient.');}
 if(type==='logistics'){n.military.logistics=clamp(n.military.logistics+9,0,100);n.infrastructure=clamp(n.infrastructure+2,0,100);note('🚚','Logistics network upgraded','Ports, rail and supply corridors gain capacity.');}
 n.approval=clamp(n.approval,20,95);n.stability=clamp(n.stability,20,96);n.news=n.news.slice(0,5);updatePressure();save();showGame({preserveScroll:true})
}

function updatePressure(){
 const n=state.nation;
 const populationM=n.population/1e6; const foodNeed=populationM*0.55, waterNeed=populationM*0.45, energyNeed=n.industry*.4+n.urban*.2;
 const foodGap=clamp(foodNeed-Math.max(1,n.resources.food)*.9,0,100);
 const waterGap=clamp(waterNeed-Math.max(1,n.resources.water)*.75,0,100);
 const energyGap=clamp(energyNeed-Math.max(1,n.resources.energy)*.9,0,100);
 const housingGap=clamp(70-n.housing+(n.urban-60)*.35,0,100);
 const unemployment=clamp(100-n.jobs,0,100);
 const inflation=clamp(n.inflation-5,0,100);
 const score=clamp(foodGap*.18+waterGap*.14+energyGap*.18+housingGap*.18+unemployment*.12+inflation*.12+(100-n.stability)*.08,0,100);
 let headline='The country is stable enough to plan ahead.';
 if(score>65)headline='Multiple shortages are converging. Your next decision could determine the next crisis.';
 else if(score>40)headline='Pressure is building in several systems. Fix bottlenecks before they become crises.';
 else if(energyGap>25)headline='Power demand is outrunning supply. Blackouts are becoming a real risk.';
 else if(housingGap>25)headline='Housing is becoming the binding constraint on urban growth.';
 else if(inflation>25)headline='Prices are running hot. Households are losing purchasing power.';
 n.pressure={score,headline,food:foodGap,water:waterGap,energy:energyGap,housing:housingGap,unemployment,inflation};
 n.fiscalBalance=(n.tax/100*n.gdp*.055)-(n.gdp*.025+n.spending.education*.01+n.spending.health*.01+n.spending.infrastructure*.01+n.spending.defense*.01+n.spending.welfare*.01);
}

function eventDecision(choice){
 const n=state.nation;if(!n.event)return;const e=n.event;
 if(choice==='invest'){
   const cost=n.gdp*.012;if(n.treasury<cost){toast('Treasury cannot fund the response.');return}
   n.treasury-=cost;n.stability=clamp(n.stability+3,0,100);n.approval=clamp(n.approval+3,0,100);
   if(e.type==='energy')n.resources.energy=clamp(n.resources.energy+12,0,100);
   if(e.type==='people')n.housing=clamp(n.housing+6,0,100);
   if(e.type==='food')n.resources.food=clamp(n.resources.food+10,0,100);
   if(e.type==='politics')n.happiness=clamp(n.happiness+3,0,100);
   if(e.type==='trade')n.trade.exports*=1.04;
   n.news.unshift({icon:'✓',title:`Response funded: ${e.title}`,text:'The government spent real resources to reduce the underlying pressure.'});
 }else if(choice==='restrict'){
   n.stability=clamp(n.stability+5,0,100);n.approval=clamp(n.approval-5,0,100);n.groups.find(g=>g.name==='Workers').support-=3;
   if(e.type==='energy')n.energy=clamp(n.energy+5,0,100);
   if(e.type==='people')n.urban=clamp(n.urban-0.5,10,99);
   n.news.unshift({icon:'⚠️',title:`Emergency powers used: ${e.title}`,text:'The crisis was contained faster, but citizens paid a political price.'});
 }else{
   n.approval=clamp(n.approval-4,0,100);n.happiness=clamp(n.happiness-3,0,100);n.stability=clamp(n.stability-2,0,100);
   if(e.type==='energy')n.infrastructure=clamp(n.infrastructure-2,0,100);
   if(e.type==='people')n.housing=clamp(n.housing-4,0,100);
   n.news.unshift({icon:'◷',title:`Crisis deferred: ${e.title}`,text:'The government chose not to spend scarce resources. The pressure remains.'});
 }
 n.history.push({year:state.year,title:`Event resolved: ${e.title}`,text:n.news[0].text});n.event=null;updatePressure();awardXP(15,'Crisis response');save();showGame({preserveScroll:true})
}
function diplomacyAction(type,index=0){
 const n=state.nation; const target=n.neighbors[index]||n.neighbors[0];
 if(n.actionPoints<1){toast('No diplomatic action left this year.');return}
 if(type==='trade'){n.actionPoints--;target.relation=clamp(target.relation+8,0,100);n.trade.exports*=1.025;n.trade.imports*=1.01;n.history.push({year:state.year,title:`Trade pact proposed to ${target.name}`,text:'Commercial ties deepen and exporters gain confidence.'})}
 else if(type==='alliance'){n.actionPoints--;target.relation=clamp(target.relation+12,0,100);n.military.deterrence=clamp(n.military.deterrence+4,0,100);n.history.push({year:state.year,title:`Security dialogue with ${target.name}`,text:'Defense cooperation increases regional deterrence.'})}
 else if(type==='aid'){const cost=n.gdp*.008;if(n.treasury<cost){toast('Treasury cannot afford the aid package.');return}n.actionPoints--;n.treasury-=cost;target.relation=clamp(target.relation+10,0,100);n.history.push({year:state.year,title:`Aid sent to ${target.name}`,text:'Humanitarian assistance strengthens diplomatic goodwill.'})}
 else {n.actionPoints--;target.relation=clamp(target.relation+4,0,100);n.news.unshift({icon:'◎',title:`Dialogue with ${target.name}`,text:'Diplomats report a warmer channel of communication.'})}
 n.news.unshift({icon:'◎',title:`Diplomacy: ${target.name}`,text:`Relationship is now ${Math.round(target.relation)}.`});updatePressure();save();showGame({preserveScroll:true})
}
function navigate(view){
 const main=$('#main'); const scroll=main?.scrollTop||0; state.view=view; state.modal=null;
 if(main){main.innerHTML=mainContent(); $$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); bindGame(); main.scrollTop=scroll; requestAnimationFrame(()=>{main.classList.remove('nav-enter');void main.offsetWidth;main.classList.add('nav-enter');setTimeout(()=>main.classList.remove('nav-enter'),240)}); if($('#scene'))createScene();}
 else showGame({preserveScroll:true,transition:false,navigation:true});
}
function bindGame(){
 $$('[data-view]').forEach(b=>b.onclick=e=>{e.preventDefault();navigate(b.dataset.view)});
 $$('[data-layer]').forEach(b=>b.onclick=e=>{e.preventDefault();state.layer=b.dataset.layer; if(worldGroup){applyLayer();syncCityOverlay()} $$('.layerbar button').forEach(x=>x.classList.toggle('active',x.dataset.layer===state.layer)); const host=$('#scene');if(host)host.dataset.layer=state.layer});
 $$('[data-explain]').forEach(b=>b.onclick=e=>{e.preventDefault();state.modal='explain';state.modalTopic=b.dataset.explain;showGame({preserveScroll:true})});
 $$('[data-event-choice]').forEach(b=>b.onclick=e=>{e.preventDefault();eventDecision(b.dataset.eventChoice)});
 $$('[data-action]').forEach(b=>b.onclick=e=>{e.preventDefault();const a=b.dataset.action;if(a==='advance'){if(state.playing){state.playing=false;showGame({preserveScroll:true})}else advance()}else if(a==='save'){save();toast('Nation saved locally.')}else if(a==='create'){showCreator()}else if(a==='forge'){createNation()}else if(a==='new'){state.nation=null;localStorage.removeItem('forgeNationV6');localStorage.removeItem('forgeNationV52');showLanding()}else if(a==='features'){state.modal='features';state.modalCat='WORLD';showGame({preserveScroll:true})}else if(a==='report'){state.modal='report';showGame({preserveScroll:true})}else if(a==='close'){state.modal=null;showGame({preserveScroll:true})}else if(a==='camera'){navigate('map')}else if(a==='policy'){policy(b.dataset.policy)}else if(a==='diplomacy'){diplomacyAction(b.dataset.diplomacy,+b.dataset.neighbor||0)}});
 $$('[data-city]').forEach(c=>c.onclick=e=>{e.preventDefault();state.modal='city';state.selected=+c.dataset.city;showGame({preserveScroll:true})});
 $$('[data-city-project]').forEach(b=>b.onclick=e=>{e.preventDefault();const i=+b.dataset.cityProject,type=b.dataset.project,n=state.nation,c=n.cities[i];const titles={industry:'Industrial district',research:'University research campus',port:'Port expansion',housing:'Urban housing district'};const costs={industry:2.8,research:2.4,port:3.2,housing:2.6};if(n.actionPoints<1){toast('No city-planning action left this year.');return}if(n.treasury<costs[type]){toast('Treasury cannot afford this city project.');return}n.actionPoints--;n.treasury-=costs[type];n.projects.push({type,title:titles[type],city:c.name,year:state.year,status:'complete'});c.wealth=clamp(c.wealth+6,0,100);n.infrastructure=clamp(n.infrastructure+2,0,100);if(type==='industry'){n.industry=clamp(n.industry+3,0,100);n.economy.manufacturing+=3}if(type==='research'){n.edu=clamp(n.edu+2,0,100);n.tech+=3}if(type==='port'){n.trade.exports*=1.04}if(type==='housing'){n.housing=clamp(n.housing+4,0,100)}awardXP(8,`City project: ${titles[type]}`);n.news.unshift({icon:'🏙️',title:`${titles[type]} built in ${c.name}`,text:`The project cost ${money(costs[type])} and used one government action.`});updatePressure();save();showGame({preserveScroll:true})});
 $$('[data-diplomacy]').forEach(b=>b.onclick=e=>{e.preventDefault();diplomacyAction(b.dataset.diplomacy,+b.dataset.neighbor||0)});
 $$('[data-fcat]').forEach(b=>b.onclick=e=>{e.preventDefault();state.modalCat=b.dataset.fcat;showGame({preserveScroll:true})});
 $$('[data-feature]').forEach(b=>b.onclick=e=>{e.preventDefault();const f=b.dataset.feature;const i=state.nation.features.indexOf(f);if(i>=0)state.nation.features.splice(i,1);else state.nation.features.push(f);save();showGame({preserveScroll:true})})
}
window.addEventListener('error',event=>{
 const app=$('#app');
 if(app && !app.innerHTML.trim()){
   app.innerHTML='<div class="fatal"><b>FORGE A NATION</b><span>The simulation hit a recoverable startup error.</span><button class="primary" onclick="location.reload()">RELOAD SIMULATION</button></div>';
 }
});
boot();
