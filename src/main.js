import * as THREE from 'three';
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

function derive(){
 const n=state.nation;
 n.gdp=n.gdp||Math.max(8,n.pop*(18+n.tech*.28+n.industry*.22+n.edu*.12));
 n.approval=n.approval??67;n.infrastructure=n.infrastructure??46;n.environment=n.environment??68;n.inflation=n.inflation??4.2;n.debt=n.debt??Math.max(5,n.gdp*.28);n.food=n.food??Math.max(40,n.agri+25);n.energy=n.energy??Math.max(42,n.industry*.55+n.urban*.3);n.housing=n.housing??Math.max(42,90-n.urban*.25);n.jobs=n.jobs??92;n.stability=n.stability??74;n.happiness=n.happiness??68;n.urban=Math.round(n.urban);n.population=Math.round(n.pop*1000000*(1+state.year*.003));
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
}
function save(){localStorage.setItem('forgeNationV52',JSON.stringify({nation:state.nation,year:state.year}));}
function load(){try{const x=JSON.parse(localStorage.getItem('forgeNationV52'));if(x){if(x.nation){state.nation=x.nation;state.year=x.year||1}else{state.nation=x;state.year=x.year||1}derive();return true}}catch{}return false}
function toast(msg){state.toast=msg;renderToast();setTimeout(()=>{if(state.toast===msg){state.toast=null;renderToast()}},2200)}
function renderToast(){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el)}el.textContent=state.toast||'';el.classList.toggle('show',!!state.toast)}

function levelForXP(xp){let current=progression[0];for(const l of progression){if(xp>=l.xp)current=l;}return current;}
function awardXP(amount,reason){const n=state.nation;if(!n)return;const before=levelForXP(n.xp).level;n.xp=Math.max(0,n.xp+amount);const after=levelForXP(n.xp).level;n.level=after;n.xpLog.unshift({year:state.year,amount,reason});n.xpLog=n.xpLog.slice(0,12);if(after>before){const unlocked=progression[after-1];n.news.unshift({icon:'⬆️',title:`Nation reached Level ${after}`,text:`${unlocked.name} unlocked: ${unlocked.unlock}.`});toast(`Level ${after} reached · ${unlocked.name}`)}return after>before}
function checkMissions(){const n=state.nation;(n.missions||[]).forEach(m=>{const def=missionPool.find(x=>x.id===m.id);if(def&&!m.complete&&def.check(n)){m.complete=true;awardXP(m.reward,`Mission: ${m.title}`);n.news.unshift({icon:'🎯',title:`Mission complete: ${m.title}`,text:`+${m.reward} XP. ${def.text}`})}});n.achievements=n.achievements||[];const tests=[['first-year','First Year','Advance your nation into Year 2.',state.year>=2],['five-cities','Growing Metropolis','Build a network of five or more cities.',n.cities.length>=5],['stable','Stable State','Reach 85% stability.',n.stability>=85],['educated','Knowledge Nation','Reach 85% education.',n.edu>=85]];for(const [id,title,text,ok] of tests){if(ok&&!n.achievements.some(a=>a.id===id)){n.achievements.push({id,title,year:state.year});awardXP(60,`Achievement: ${title}`)}}}
function activeProgression(){const n=state.nation;const cur=levelForXP(n.xp), next=progression.find(l=>l.level===cur.level+1);return {cur,next,pct:next?clamp(((n.xp-cur.xp)/(next.xp-cur.xp))*100,0,100):100};}
function createNation(){state.year=1;state.nation={name:create.name||'Aurelia',capital:create.capital||'Nova Aurelia',terrain:create.terrain,government:create.government,area:+create.area,pop:+create.pop,urban:+create.urban,edu:+create.edu,health:+create.health,industry:+create.industry,agri:+create.agri,tech:+create.tech};derive();save();showGame();toast('Nation forged. Welcome home.');}

function metric(label,value,sub=''){return `<div class="metric"><span>${label}</span><strong>${value}</strong>${sub?`<em>${sub}</em>`:''}</div>`}
function top(){const n=state.nation;return `<header class="top"><div class="brand"><b>FORGE</b><span>A NATION</span></div><div class="yearbox"><small>YEAR</small><b>${state.year}</b><button data-action="advance">${state.playing?'Ⅱ':'▶'}</button></div><div class="topmetrics">${metric('POP',fmt(n.population/1e6)+'M','+0.3%')} ${metric('GDP',money(n.gdp),'+'+((n.gdp/Math.max(1,n.pop))/30).toFixed(1)+'%')} ${metric('APPROVAL',n.approval+'%','▲ stable')} ${metric('STABILITY',n.stability+'%','')}</div><button class="iconbtn" data-action="save">SAVE</button></header>`}
function sidebar(){const items=[['overview','◈','Overview'],['map','⌁','World'],['cities','⌂','Cities'],['economy','◒','Economy'],['people','♙','People'],['government','♜','Politics'],['diplomacy','◎','Diplomacy'],['military','⚔','Military'],['history','◷','History'],['missions','◇','Missions']];return `<aside class="sidebar"><div class="nation-mini"><div class="flag"></div><b>${state.nation.name}</b><span>${state.nation.government}</span></div>${items.map(x=>`<button class="nav ${state.view===x[0]?'active':''}" data-view="${x[0]}"><i>${x[1]}</i><span>${x[2]}</span></button>`).join('')}<div class="sidebottom"><button class="nav" data-action="features"><i>＋</i><span>Features</span></button><button class="nav" data-action="new"><i>↻</i><span>New nation</span></button></div></aside>`}
function world(){return `<section class="world"><div class="world-head"><div><small>LIVE NATION</small><h1>${state.nation.name}</h1><p>${state.nation.terrain} · Year ${state.year}</p></div><div class="world-actions"><button data-action="camera">◎ HOME</button><button data-action="report">▣ YEAR REPORT</button></div></div><div id="scene"></div><div class="layerbar">${[['political','Political'],['population','Population'],['economy','Economy'],['resources','Resources'],['infrastructure','Infrastructure'],['environment','Environment'],['military','Military']].map(x=>`<button class="${state.layer===x[0]?'active':''}" data-layer="${x[0]}">${x[1]}</button>`).join('')}</div><div class="world-hint">CLICK A CITY · DRAG TO ROTATE · SCROLL TO DIVE · 1–7 CHANGE LAYERS</div><div class="mini-legend"><span>LOW</span><i></i><i></i><i></i><i></i><i></i><span>HIGH</span></div></section>`}
function overview(){const n=state.nation,p=activeProgression();return `<div class="panelgrid"><article class="panel hero"><small>NATIONAL SNAPSHOT</small><h2>${n.name}</h2><p>Your country is not a spreadsheet. Watch its geography, cities and infrastructure change as decisions accumulate.</p><div class="metricgrid">${metric('GDP',money(n.gdp),'annual output')}${metric('INFLATION',n.inflation.toFixed(1)+'%','consumer prices')}${metric('JOBS',n.jobs.toFixed(0)+'%','employment')}${metric('HAPPINESS',n.happiness.toFixed(0)+'%','public mood')}</div></article><article class="panel progression"><small>NATION PROGRESSION</small><div class="levelrow"><div><b>LEVEL ${p.cur.level}</b><strong>${p.cur.name}</strong></div><span>${Math.round(n.xp)} XP${p.next?' / '+p.next.xp+' XP':''}</span></div><div class="xpbar"><i style="width:${p.pct}%"></i></div><p>${p.next?`Next: <b>${p.next.name}</b> — ${p.next.unlock}.`:'Maximum current level reached.'}</p><div class="missionmini"><small>ACTIVE MISSIONS</small>${n.missions.filter(m=>!m.complete).slice(0,3).map(m=>`<div><b>${m.title}</b><span>+${m.reward} XP</span></div>`).join('')}</div></article><article class="panel"><small>WHAT IS HAPPENING</small><div class="eventbig"><b>${n.news[0].icon} ${n.news[0].title}</b><p>${n.news[0].text}</p></div><div class="eventbig"><b>${n.news[1].icon} ${n.news[1].title}</b><p>${n.news[1].text}</p></div></article><article class="panel wide"><small>VISIBLE CONSEQUENCES</small><div class="consequence-row"><div><b>🏙️</b><strong>${n.cities.length} cities</strong><span>urban network</span></div><div><b>🏭</b><strong>${Math.round(n.industry*1.7)} industry</strong><span>production base</span></div><div><b>🌾</b><strong>${Math.round(n.agri)} agriculture</strong><span>food capacity</span></div><div><b>🌳</b><strong>${n.environment}%</strong><span>environment</span></div><div><b>⚡</b><strong>${n.energy.toFixed(0)}%</strong><span>energy security</span></div></div></article></div>`}
function cities(){const n=state.nation;return `<div class="content"><div class="sectionhead"><div><small>SETTLEMENTS</small><h2>Your cities are the simulation.</h2></div><button class="primary" data-action="camera">VIEW WORLD</button></div><div class="citygrid">${n.cities.map((c,i)=>`<article class="citycard" data-city="${i}"><div class="city-art ${c.type.toLowerCase()}"><span>${c.type==='Capital'?'★':'●'}</span><div class="mini-buildings">${Array.from({length:7+i%4},(_,j)=>`<i style="height:${20+(j*13)%48}px"></i>`).join('')}</div></div><div class="citybody"><div><small>${c.type}</small><h3>${c.name}</h3></div><strong>${(c.pop*1e6/1e6).toFixed(1)}M</strong><p>Wealth ${c.wealth.toFixed(0)} · ${c.type==='Industrial'?'factories and freight':c.type==='University'?'research and students':'housing, services and roads'}</p></div></article>`).join('')}</div></div>`}
function cardsFor(view){const n=state.nation;const common={economy:[['GDP',money(n.gdp),'▲ productive capacity'],['Inflation',n.inflation.toFixed(1)+'%','◆ prices'],['Treasury',money(Math.max(1,n.gdp*.14)),'annual room'],['Debt',money(n.debt),'service pressure'],['Industry',n.industry+'%','of economic base'],['Agriculture',n.agri+'%','food system']],people:[['Population',fmt(n.population/1e6)+'M','growing'],['Urbanization',n.urban+'%','living in cities'],['Education',n.edu+'%','human capital'],['Healthcare',n.health+'%','access'],['Housing',n.housing.toFixed(0)+'%','capacity'],['Employment',n.jobs.toFixed(0)+'%','labor market']],government:[['Approval',n.approval+'%','national'],['Stability',n.stability+'%','institutional'],['Government',n.government,'system'],['Civil mood',n.happiness+'%','public'],['Provinces',n.provinces.length,'regions'],['Year',state.year,'term']],diplomacy:[['Neighbors',6,'generated states'],['Relations',72,'average'],['Trade partners',4,'active'],['Alliances',2,'defense'],['Influence',n.tech+30,'soft power'],['Tension',18,'regional']],military:[['Readiness',Math.round(45+n.industry*.3)+'%','forces'],['Defense',money(n.gdp*.025),'annual'],['Army',Math.round(n.pop*.8)+'k','personnel'],['Navy',n.terrain.includes('Coast')?'Active':'Limited','maritime'],['Air force',n.tech>45?'Modern':'Developing','capability'],['Logistics',n.infrastructure+'%','network']]};return common[view]||common.economy}
function dashboard(view){const cards=cardsFor(view);return `<div class="content"><div class="sectionhead"><div><small>${view.toUpperCase()}</small><h2>${({economy:'The economy is a machine you can see.',people:'People reshape the country.',government:'Politics changes the world below.',diplomacy:'Other nations are watching.',military:'Power depends on what you can sustain.'}[view])||'National systems'}</h2></div></div><div class="metriccards">${cards.map(c=>`<article class="statcard"><small>${c[0]}</small><b>${c[1]}</b><span>${c[2]}</span></article>`).join('')}</div><div class="visual-panel"><div class="flowtitle">SYSTEM PRESSURE</div><div class="flow">${view==='economy'?'<div>🌾 FARM</div><b>→</b><div>🏭 INDUSTRY</div><b>→</b><div>🚚 TRADE</div><b>→</b><div>💰 TREASURY</div>':'<div>👥 PEOPLE</div><b>→</b><div>🏙️ CITIES</div><b>→</b><div>🏗️ INFRASTRUCTURE</div><b>→</b><div>🌍 NATION</div>'}</div></div><div class="decision-panel"><div><small>AVAILABLE DECISIONS</small><h3>Make something happen.</h3></div><div class="decision-grid"><button data-action="policy" data-policy="infrastructure">🏗️ Build infrastructure</button><button data-action="policy" data-policy="industry">🏭 Back industry</button><button data-action="policy" data-policy="education">🎓 Invest in education</button><button data-action="policy" data-policy="green">🌱 Restore nature</button></div></div></div>`}
function missionBoard(){const n=state.nation;return `<div class="content"><div class="sectionhead"><div><small>MISSION CONTROL</small><h2>Build a country worth remembering.</h2></div></div><div class="missiongrid">${n.missions.map(m=>`<article class="mission ${m.complete?'complete':''}"><div><small>${m.complete?'COMPLETE':'ACTIVE'}</small><h3>${m.title}</h3><p>${m.text}</p></div><strong>+${m.reward} XP</strong></article>`).join('')}</div><div class="panel legacy"><small>LEGACY WALL</small><h3>${n.achievements.length} achievements earned</h3><div class="achievement-row">${(n.achievements.length?n.achievements:[{title:'Your first achievement is waiting.',year:'—'}]).map(a=>`<span>◆ ${a.title} <em>${a.year}</em></span>`).join('')}</div></div></div>`}
function history(){return `<div class="content"><div class="sectionhead"><div><small>NATIONAL MEMORY</small><h2>Your decisions leave scars and landmarks.</h2></div></div><div class="timeline">${state.nation.history.slice().reverse().map(h=>`<article><b>${h.year}</b><div><h3>${h.title}</h3><p>${h.text}</p></div></article>`).join('')}</div></div>`}
function mainContent(){if(state.view==='map')return world();if(state.view==='cities')return `<div class="workspace">${world()}${cities()}</div>`;if(state.view==='overview')return `<div class="workspace">${world()}${overview()}</div>`;if(state.view==='history')return history();if(state.view==='missions')return missionBoard();return `<div class="workspace">${world()}${dashboard(state.view)}</div>`}

function featureModal(){return `<div class="modal"><div class="modalcard featuremodal"><button class="close" data-action="close">×</button><small>SIMULATION ENGINE</small><h2>Choose what your nation can simulate.</h2><p>Start with the world you want. Turn deeper systems on as you become curious.</p><div class="featuretabs">${Object.keys(features).map(k=>`<button class="${state.modalCat===k?'active':''}" data-fcat="${k}">${k}</button>`).join('')}</div><div class="featuregrid">${(features[state.modalCat||'WORLD']||[]).map((f,i)=>`<button class="featuretile ${state.nation.features.includes(f)?'on':''}" data-feature="${f}"><b>${state.nation.features.includes(f)?'✓':'＋'}</b><span>${f}</span><small>${['visual','interactive','systemic'][i%3]} layer</small></button>`).join('')}</div></div></div>`}
function reportModal(){const n=state.nation;return `<div class="modal"><div class="modalcard report"><button class="close" data-action="close">×</button><small>YEAR ${state.year} REPORT</small><h2>${n.name} is changing.</h2><p>${n.cities.length} cities now form the backbone of a ${n.terrain.toLowerCase()} nation. Your strongest visible system is ${n.infrastructure>n.environment?'infrastructure':'environment'}.</p><div class="reportgrid">${metric('GDP',money(n.gdp),n.lastReport?.changes?`${n.lastReport.changes.gdp>=0?'+':''}${money(n.lastReport.changes.gdp)}`:'')}${metric('POP',fmt(n.population/1e6)+'M')}${metric('APPROVAL',n.approval+'%')}${metric('HOUSING',n.housing.toFixed(0)+'%')}${metric('ENVIRONMENT',n.environment+'%')}${metric('STABILITY',n.stability+'%')}</div><button class="primary widebtn" data-action="close">BACK TO COUNTRY</button></div></div>`}
function cityModal(i){const c=state.nation.cities[i];return `<div class="modal"><div class="modalcard citymodal"><button class="close" data-action="close">×</button><small>${c.type.toUpperCase()}</small><h2>${c.name}</h2><div class="citybig"><div class="city-art large ${c.type.toLowerCase()}"><div class="mini-buildings">${Array.from({length:16},(_,j)=>`<i style="height:${20+(j*19)%75}px"></i>`).join('')}</div></div></div><div class="metricgrid">${metric('POPULATION',(c.pop).toFixed(2)+'M')}${metric('WEALTH',c.wealth.toFixed(0)+'/100')}${metric('ROLE',c.type)}${metric('GROWTH','+'+(1.2+(c.wealth/100)).toFixed(1)+'%')}</div><p>This city is part of the living map. As the simulation advances, its density, wealth and built form respond to your national decisions.</p></div></div>`}

function boot(){document.body.innerHTML='<div id="app"></div>';if(load())showGame();else showLanding();}
function showLanding(){
 const app=$('#app');
 app.innerHTML=`<main class="landing"><div class="landing-glow"></div><div class="landing-copy"><small>SIMULATE · BUILD · WATCH IT LIVE</small><h1>FORGE<br><span>A NATION</span></h1><p>Build a country. Then zoom into it and watch your decisions become cities, roads, factories, farms and history.</p><button class="primary launch" data-action="create">CREATE YOUR NATION <b>→</b></button><div class="landing-note">LOCAL-FIRST · SINGLE PLAYER · NO ACCOUNT</div></div><div class="landing-world"><div class="orbit o1"></div><div class="orbit o2"></div><div class="toy-continent">${Array.from({length:28},(_,i)=>`<i style="left:${10+(i*29)%82}%;top:${12+(i*47)%72}%;height:${18+(i*17)%55}px;transform:rotate(${(i*37)%80-40}deg)"></i>`).join('')}</div></div></main>`;
 const launch=$('.launch');
 if(launch) launch.onclick=()=>showCreator();
}
function showCreator(){const app=$('#app');app.innerHTML=`<main class="creator"><div class="creator-card"><div class="creator-head"><small>01 · IDENTITY</small><h1>Make somewhere worth watching.</h1><p>Choose broad traits. The simulation fills in the details.</p></div><div class="presetrow">${Object.keys(presets).map(k=>`<button data-preset="${k}">${k}</button>`).join('')}</div><div class="creator-grid"><label>Nation name<input id="cname" value="${create.name}"></label><label>Capital<input id="ccapital" value="${create.capital}"></label><label>Terrain<select id="cterrain">${terrains.map(t=>`<option ${t===create.terrain?'selected':''}>${t}</option>`).join('')}</select></label><label>Government<select id="cgov">${governments.map(t=>`<option ${t===create.government?'selected':''}>${t}</option>`).join('')}</select></label></div><div class="slidergrid">${[['area','Land area',2,2000],['pop','Population (M)',1,200],['urban','Urbanization',10,98],['edu','Education',20,98],['health','Healthcare',20,98],['industry','Industry',5,90],['agri','Agriculture',3,90],['tech','Technology',3,95]].map(x=>`<label><span>${x[1]} <b id="v-${x[0]}">${create[x[0]]}</b></span><input type="range" data-create="${x[0]}" min="${x[2]}" max="${x[3]}" value="${create[x[0]]}"></label>`).join('')}</div><div class="creator-foot"><div><small>VIABILITY</small><b id="viability">Balanced</b></div><button type="button" class="primary" data-action="forge" id="forge-nation-btn">FORGE THIS NATION →</button></div></div></main>`;$$('[data-preset]').forEach(b=>b.onclick=()=>{Object.assign(create,presets[b.dataset.preset]);showCreator()});$$('[data-create]').forEach(i=>i.oninput=()=>{create[i.dataset.create]=+i.value;$('#v-'+i.dataset.create).textContent=i.value;updateViability()});$$('#cname,#ccapital,#cterrain,#cgov').forEach(i=>i.oninput=()=>{if(i.id==='cname')create.name=i.value;if(i.id==='ccapital')create.capital=i.value;if(i.id==='cterrain')create.terrain=i.value;if(i.id==='cgov')create.government=i.value});const forgeBtn=$('#forge-nation-btn');if(forgeBtn)forgeBtn.onclick=()=>createNation();updateViability()}
function updateViability(){const pressure=(create.pop/Math.max(10,create.area))*18+Math.abs(create.industry-create.agri)*.15;$('#viability').textContent=pressure>35?'Extreme':pressure>20?'Challenging':'Balanced'}
function showGame(opts={}){const app=$('#app');const oldMainScroll=opts.mainScroll??(opts.preserveScroll?($('#main')?.scrollTop||0):0);const pageX=opts.pageX??(window.scrollX||0),pageY=opts.pageY??(window.scrollY||0);const render=()=>{app.innerHTML=top()+`<div class="game">${sidebar()}<main class="main" id="main">${mainContent()}</main><aside class="right"><div class="rightcard"><small>COUNTRY PULSE</small><div class="pulse"><span>APPROVAL</span><b>${state.nation.approval}%</b><i style="width:${state.nation.approval}%"></i></div><div class="pulse"><span>ENVIRONMENT</span><b>${state.nation.environment}%</b><i style="width:${state.nation.environment}%"></i></div><div class="pulse"><span>INFRASTRUCTURE</span><b>${state.nation.infrastructure}%</b><i style="width:${state.nation.infrastructure}%"></i></div></div><div class="rightcard news"><small>LIVE NEWS</small>${state.nation.news.map(x=>`<div><b>${x.icon}</b><span><strong>${x.title}</strong>${x.text}</span></div>`).join('')}</div><div class="rightcard next"><small>NEXT YEAR</small><p>${state.nation.approval>70?'Public confidence is giving you room to invest.':'Pressure is building. Choose carefully.'}</p><button class="primary widebtn" data-action="advance">${state.playing?'PAUSE':'ADVANCE YEAR'} →</button></div></aside></div>${state.modal==='features'?featureModal():state.modal==='report'?reportModal():state.modal==='city'?cityModal(state.selected):''}`;renderToast();bindGame();if($('#scene'))createScene();
 const restore=()=>{const m=$('#main');if(m)m.scrollTop=oldMainScroll;window.scrollTo(pageX,pageY);if(opts.navigation&&m){m.classList.remove('nav-enter');void m.offsetWidth;m.classList.add('nav-enter');setTimeout(()=>m.classList.remove('nav-enter'),240)}};
 requestAnimationFrame(()=>requestAnimationFrame(restore));
};
 if(opts.transition!==false && document.startViewTransition){document.startViewTransition(render)}else render()}
let renderer,scene,camera,worldGroup,raycaster,mouse;let animation,resizeObserver;
function createScene(){
 const host=$('#scene');
 if(!host)return;
 try{
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
   worldGroup=new THREE.Group(); scene.add(worldGroup); buildWorld(); syncCityOverlay();
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
       renderer.setSize(host.clientWidth,host.clientHeight,false);
     }
   });resizeObserver.observe(host);}
   cancelAnimationFrame(animation);
   const tick=()=>{
     animation=requestAnimationFrame(tick);
     if(worldGroup)worldGroup.rotation.y+=.0007;
     positionCityOverlay();
     if(renderer&&scene&&camera)renderer.render(scene,camera);
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
function advance(){const n=state.nation;const before={population:n.population,gdp:n.gdp,approval:n.approval,stability:n.stability,environment:n.environment,infrastructure:n.infrastructure};state.year++;n.population=Math.round(n.population*(1+.0025+(n.health+n.edu-120)*.000015));n.gdp*=1+(n.tech*.0008+n.industry*.00045+n.edu*.00012-.004-n.inflation*.00018);n.inflation=clamp(n.inflation+(Math.random()-.47)*.8+(n.gdp>before.gdp?.03:-.03),1,14);n.approval=clamp(n.approval+(Math.random()-.47)*4+(n.infrastructure>70?1:0)+(n.jobs>92?1:-.5),28,94);n.happiness=clamp(n.happiness+(n.approval-60)*.015+(n.housing-60)*.01,30,95);n.stability=clamp(n.stability+(n.approval-65)*.02+(n.happiness-60)*.01,25,96);n.infrastructure=clamp(n.infrastructure+(n.gdp>100?1.1:.7),15,98);n.environment=clamp(n.environment+(n.industry>55?-0.45:.12)+(n.projects.some(p=>p.type==='green')?.35:0),20,98);n.housing=clamp(n.housing+(n.infrastructure*.004-.15),20,98);n.jobs=clamp(n.jobs+(n.edu*.002-.12)+(n.industry*.001),60,99);n.energy=clamp(n.energy+(n.industry*.006-n.urban*.002),25,99);n.cities.forEach(c=>{const growth=.008+(c.wealth-50)*.00008+(n.infrastructure-50)*.00004;c.pop=clamp(c.pop*(1+growth),.08,25);c.wealth=clamp(c.wealth+(n.gdp>before.gdp?1:-.4)+(n.infrastructure-55)*.008,20,99)});if(state.year%5===0&&n.cities.length<10)n.cities.push({name:pick(['Lakeview','New Meridian','Southport','Greenfield','Crown Bay','Stonebridge']),pop:.2+Math.random()*.5,wealth:40+Math.random()*35,type:pick(['Residential','Agricultural','Industrial','Coastal'])});
 if(state.year%3===0){const events=[['🏛️','Parliament faces a budget dilemma','Citizens want services while the treasury wants restraint.'],['🌧️','A difficult season arrives','Agriculture and infrastructure are under temporary pressure.'],['📦','Trade demand surges','Industrial cities can capture the opportunity if capacity holds.']];const e=pick(events);n.news.unshift({icon:e[0],title:e[1],text:e[2]});n.approval=clamp(n.approval+(Math.random()-.5)*3,25,95)}
 const title=pick(['New roads reshape regional trade','Households are moving toward the cities','Manufacturing demand is rising','A new generation enters the workforce','The treasury faces competing priorities','Local businesses report stronger demand']);n.history.push({year:state.year,title,text:pick(['The country continues to change beneath your policies.','A visible shift is emerging across the regional map.','Your previous decisions are producing second-order effects.'])});n.news.unshift({icon:pick(['🏗️','🏙️','🌾','📈','🌧️','🚆']),title,text:'The simulation has produced a new national development signal.'});n.news=n.news.slice(0,4);awardXP(25,'Year advanced');checkMissions();n.lastReport={year:state.year,changes:{population:n.population-before.population,gdp:n.gdp-before.gdp,approval:n.approval-before.approval,stability:n.stability-before.stability,environment:n.environment-before.environment,infrastructure:n.infrastructure-before.infrastructure}};save();showGame({preserveScroll:true});if(state.view!=='history')state.modal='report';showGame({preserveScroll:true})}
function policy(type){const n=state.nation;if(type==='infrastructure'){n.infrastructure=clamp(n.infrastructure+7,0,100);n.debt+=n.gdp*.018;n.approval+=2;n.news.unshift({icon:'🏗️',title:'Infrastructure investment approved',text:'Construction activity is spreading along major corridors.'})}if(type==='industry'){n.industry=clamp(n.industry+5,0,100);n.gdp*=1.025;n.environment=clamp(n.environment-2,0,100);n.approval+=1;n.news.unshift({icon:'🏭',title:'Industrial expansion begins',text:'Factories and freight demand are reshaping nearby cities.'})}if(type==='education'){n.edu=clamp(n.edu+5,0,100);n.gdp*=1.012;n.approval+=2;n.news.unshift({icon:'🎓',title:'Education investment',text:'Schools and universities are becoming national priorities.'})}if(type==='green'){n.environment=clamp(n.environment+7,0,100);n.gdp*=.994;n.approval+=1;n.news.unshift({icon:'🌱',title:'Restoration program launched',text:'Protected land and green infrastructure expand.'})}n.news=n.news.slice(0,4);n.history.push({year:state.year,title:n.news[0].title,text:n.news[0].text});awardXP(45,'Policy decision');checkMissions();save();showGame({preserveScroll:true})}
function navigate(view){
 const main=$('#main');
 const mainScroll=main?.scrollTop||0;
 const pageX=window.scrollX||0,pageY=window.scrollY||0;
 state.view=view;state.modal=null;
 showGame({preserveScroll:true,transition:false,navigation:true,mainScroll,pageX,pageY});
}
function bindGame(){ $$('[data-view]').forEach(b=>b.onclick=e=>{e.preventDefault();navigate(b.dataset.view)});$$('[data-layer]').forEach(b=>b.onclick=e=>{e.preventDefault();state.layer=b.dataset.layer;showGame({preserveScroll:true})});$$('[data-action]').forEach(b=>b.onclick=e=>{e.preventDefault();const a=b.dataset.action;if(a==='advance'){if(state.playing){state.playing=false;showGame({preserveScroll:true})}else advance()}else if(a==='save'){save();toast('Nation saved locally.')}else if(a==='create'){showCreator()}else if(a==='forge'){createNation()}else if(a==='new'){state.nation=null;localStorage.removeItem('forgeNationV52');showLanding()}else if(a==='features'){state.modal='features';state.modalCat='WORLD';showGame({preserveScroll:true})}else if(a==='report'){state.modal='report';showGame({preserveScroll:true})}else if(a==='close'){state.modal=null;showGame({preserveScroll:true})}else if(a==='camera'){navigate('map')}else if(a==='policy'){policy(b.dataset.policy)}});$$('[data-city]').forEach(c=>c.onclick=e=>{e.preventDefault();state.modal='city';state.selected=+c.dataset.city;showGame({preserveScroll:true})});$$('[data-fcat]').forEach(b=>b.onclick=e=>{e.preventDefault();state.modalCat=b.dataset.fcat;showGame({preserveScroll:true})});$$('[data-feature]').forEach(b=>b.onclick=e=>{e.preventDefault();const f=b.dataset.feature;const i=state.nation.features.indexOf(f);if(i>=0)state.nation.features.splice(i,1);else state.nation.features.push(f);save();showGame({preserveScroll:true})})}

window.addEventListener('error',event=>{
 const app=$('#app');
 if(app && !app.innerHTML.trim()){
   app.innerHTML='<div class="fatal"><b>FORGE A NATION</b><span>The simulation hit a recoverable startup error.</span><button class="primary" onclick="location.reload()">RELOAD SIMULATION</button></div>';
 }
});
boot();
