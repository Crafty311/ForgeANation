import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const KEY='forgeNationV74';
const OLD_KEYS=['forgeNationV73','forgeNationV72','forgeNationV71','forgeNationV70'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
const money=n=>n>=1e12?'$'+(n/1e12).toFixed(1)+'T':n>=1e9?'$'+(n/1e9).toFixed(1)+'B':n>=1e6?'$'+(n/1e6).toFixed(1)+'M':'$'+Math.round(n/1e3)+'K';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const focusDefs={
 industrial:{name:'Industrial',desc:'Manufacturing & Industry',income:1.18,skills:{industry:2}},
 commercial:{name:'Commercial',desc:'Trade & Finance',income:1.14,skills:{commerce:2}},
 agricultural:{name:'Agricultural',desc:'Farming & Food',income:1.10,skills:{health:1,industry:1}},
 technological:{name:'Technological',desc:'Innovation & Research',income:1.16,skills:{technology:2,education:1}},
 cultural:{name:'Cultural',desc:'Arts & Tourism',income:1.09,skills:{culture:2}}
};
const skillDefs=[
 {id:'industry',name:'Industry',icon:'⚙',effect:'+12% Production',base:1200000,gain:.12,cls:'gold'},
 {id:'education',name:'Education',icon:'◆',effect:'+6% Research',base:800000,gain:.07,cls:'blue'},
 {id:'infrastructure',name:'Infrastructure',icon:'⌂',effect:'+10% Efficiency',base:1500000,gain:.10,cls:'green'},
 {id:'technology',name:'Technology',icon:'◈',effect:'+5% Innovation',base:1000000,gain:.09,cls:'cyan'},
 {id:'health',name:'Healthcare',icon:'♥',effect:'+5% Health',base:700000,gain:.055,cls:'red'},
 {id:'commerce',name:'Commerce',icon:'▣',effect:'+6% Trade',base:900000,gain:.08,cls:'teal'},
 {id:'culture',name:'Culture',icon:'✦',effect:'+4% Tourism',base:600000,gain:.06,cls:'purple'}
];
const levels=[
 {level:1,name:'Settling Nation',xp:0,unlock:'Basic economy'},
 {level:2,name:'Growing Nation',xp:1000,unlock:'Development Store'},
 {level:3,name:'Developing Nation',xp:3000,unlock:'Industrial districts'},
 {level:4,name:'Modern Nation',xp:7000,unlock:'Advanced cities'},
 {level:5,name:'Regional Power',xp:15000,unlock:'Major infrastructure'},
 {level:6,name:'Major Power',xp:30000,unlock:'Global trade'},
 {level:7,name:'Global Power',xp:60000,unlock:'World-class districts'},
 {level:8,name:'World-Class Nation',xp:120000,unlock:'National landmarks'}
];
const CITY_STYLES=[
 {name:'Coastal',ground:0x12364a,road:0x31515d,roof:0x9cb6bd,accent:0x46b6c9},
 {name:'River Valley',ground:0x173d32,road:0x4a5550,roof:0xc7b79a,accent:0x65b98b},
 {name:'Highlands',ground:0x24383b,road:0x4c5251,roof:0xb7c6cc,accent:0x7aa6d1},
 {name:'Plains',ground:0x3b4028,road:0x55554a,roof:0xd0b783,accent:0xc8a84e},
 {name:'Modern',ground:0x182b3d,road:0x394a59,roof:0xb8d7e7,accent:0x61d5d9},
 {name:'Garden',ground:0x16382f,road:0x46564c,roof:0xd1c49e,accent:0x74c98d},
 {name:'Industrial',ground:0x2b3034,road:0x4b4e50,roof:0x9b8f87,accent:0xd58d55},
 {name:'Old Quarter',ground:0x3b3028,road:0x5b4d42,roof:0xc5a779,accent:0xd5ad5e}
];
function cityStyle(c){const n=state.nation||{};const seed=hashCity(`${n.name||'nation'}:${c?.name||'city'}`);return CITY_STYLES[seed%CITY_STYLES.length]}
function hashCity(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function citySeed(c){return hashCity(`${state.nation?.name||'nation'}:${c?.name||'city'}:${c?.level||1}`)}
function ensureCityVariants(n){if(!n?.cities)return;n.cities.forEach(c=>{if(!Number.isInteger(c.citySeed))c.citySeed=hashCity(`${n.name}:${c.name}`);});}


const storeDefs=[
 {id:'factory',name:'Factory',desc:'+120K/day · 5x Production',cost:2500000,inc:120000,req:1,cat:'Economic',img:'factory.svg'},
 {id:'university',name:'University',desc:'+Research · +Education',cost:3200000,inc:70000,req:2,cat:'Civic',img:'university.svg'},
 {id:'railway',name:'Railway',desc:'+Logistics · +Trade',cost:4800000,inc:180000,req:2,cat:'Economic',img:'railway.svg'},
 {id:'airport',name:'Airport',desc:'+Tourism · +Trade',cost:6000000,inc:240000,req:3,cat:'Luxury',img:'airport.svg'},
 {id:'hospital',name:'Hospital',desc:'+Health · +Happiness',cost:2800000,inc:65000,req:2,cat:'Civic',img:'hospital.svg'},
 {id:'stadium',name:'Stadium',desc:'+Culture · +Happiness',cost:3500000,inc:85000,req:3,cat:'Culture',img:'stadium.svg'},
 {id:'research',name:'Technology Campus',desc:'+Innovation · +Income',cost:7200000,inc:420000,req:4,cat:'Economic',img:'research.svg'},
 {id:'finance',name:'Financial Center',desc:'+Commerce · +Trade',cost:9500000,inc:520000,req:5,cat:'Luxury',img:'finance.svg'}
];
const defaultState={screen:'landing',nation:null,lastSeen:Date.now(),toast:'',awayEarned:0};
let state=load();
function load(){
  try{const keys=[KEY,...OLD_KEYS];for(const k of keys){const x=JSON.parse(localStorage.getItem(k));if(x?.nation){return migrate({...defaultState,...x,screen:'home'});}}}catch{}
  return {...defaultState};
}
function migrate(s){
  const n=s.nation;if(!n)return s;
  n.skills={industry:1,education:1,infrastructure:1,technology:1,health:1,commerce:1,culture:1,...n.skills};
  n.assets={...n.assets};n.cityLevel=n.cityLevel||3;n.reputation=n.reputation??32;n.happiness=n.happiness??68;n.xp=n.xp??384;n.money=n.money??12400000;n.population=n.population??1200000;n.cities=n.cities?.length?n.cities:[{name:n.name+' City',type:'Capital City',level:n.cityLevel,pop:n.population*.45,income:4800000,happiness:72}];
  n.history=n.history||[];n.created=n.created||Date.now();n.focus=n.focus||'industrial';ensureCityVariants(n);
  return s;
}
function save(){state.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(state));}
function skillCost(id){const lv=state.nation.skills[id]||1,d=skillDefs.find(x=>x.id===id);return Math.round(d.base*Math.pow(1.48,lv-1));}
function level(){let out=levels[0];for(const x of levels)if(state.nation.xp>=x.xp)out=x;return out;}
function nextLevel(){return levels[level().level]||null;}
function xpPct(){const l=level(),n=nextLevel();return n?clamp((state.nation.xp-l.xp)/(n.xp-l.xp)*100,0,100):100;}
function income(){const n=state.nation;let total=2430000;for(const d of skillDefs)total*=1+(Math.max(0,n.skills[d.id]-1)*d.gain*.18);for(const id in n.assets){const d=storeDefs.find(x=>x.id===id);if(d)total+=n.assets[id]*d.inc}return total*(focusDefs[n.focus]?.income||1)*(1+n.cityLevel*.055);}
function tick(){if(!state.nation)return;const now=Date.now(),elapsed=Math.max(0,Math.min(259200,(now-state.lastSeen)/1000));if(elapsed<=0)return;const earned=income()*elapsed/86400;state.nation.money+=earned;state.nation.awayEarned=(state.nation.awayEarned||0)+earned;state.nation.population+=state.nation.population*.0000000012*elapsed;state.nation.xp+=elapsed/3600*2.4;state.lastSeen=now;}
function createNation(){
 const name=($('#nationName')?.value||'Novara').trim()||'Novara';const focus=$('#focus')?.value||'industrial';const terrain=$('#terrain')?.value||'Coastal';const gov=$('#gov')?.value||'Republic';const pop=Number($('#pop')?.value||1.2);
 state.nation={name,capital:name+' City',focus,terrain,government:gov,population:pop*1e6,money:12400000,xp:384,skills:{industry:2,education:1,infrastructure:2,technology:1,health:1,commerce:1,culture:1},assets:{factory:0},cityLevel:3,reputation:32,happiness:68,awayEarned:0,history:[`Founded as a ${gov.toLowerCase()} in a ${terrain.toLowerCase()} region.`],cities:[{name:name+' City',type:'Capital City',level:3,pop:Math.round(pop*.45*1e6),income:4800000,happiness:72,citySeed:hashCity(`${name}:${name} City`)}],created:Date.now()};
 Object.entries(focusDefs[focus].skills).forEach(([k,v])=>state.nation.skills[k]=Math.max(state.nation.skills[k],v));state.screen='home';state.lastSeen=Date.now();save();showGame();toast('Nation forged. Welcome home.');
}
function newNation(){if(confirm('Start a new nation? Your current nation will be replaced.')){localStorage.removeItem(KEY);state={...defaultState,screen:'landing'};showLanding();}}
function upgradeSkill(id){const n=state.nation,c=skillCost(id),d=skillDefs.find(x=>x.id===id);if(n.money<c)return toast('You need more national wealth.');n.money-=c;n.skills[id]++;n.xp+=Math.round(c/28000)+70;n.history.unshift(`${d.name} advanced to Level ${n.skills[id]}.`);save();toast(`${d.name} upgraded`);renderGame();}
function buyAsset(id){const n=state.nation,d=storeDefs.find(x=>x.id===id);if(!d)return;if(level().level<d.req)return toast(`Reach Level ${d.req} to unlock this.`);if(n.money<d.cost)return toast('Not enough national wealth.');n.money-=d.cost;n.assets[id]=(n.assets[id]||0)+1;n.xp+=Math.round(d.cost/20000);if(id==='stadium')n.happiness=Math.min(100,n.happiness+3);if(id==='hospital')n.happiness=Math.min(100,n.happiness+4);if(id==='finance')n.reputation+=4;n.history.unshift(`${d.name} was built in ${n.name}.`);save();toast(`${d.name} built`);renderGame();}
function upgradeCity(){const n=state.nation,c=Math.round(1800000*Math.pow(1.55,n.cityLevel-1));if(n.money<c)return toast('Not enough wealth to upgrade this city.');n.money-=c;n.cityLevel++;n.cities[0].level=n.cityLevel;n.cities[0].pop*=1.10;n.cities[0].income+=420000;n.happiness=Math.min(100,n.happiness+1);n.xp+=Math.round(c/18000);n.history.unshift(`${n.cities[0].name} reached City Level ${n.cityLevel}.`);if(n.cityLevel%2===0&&n.cities.length<5){const cityNames=['Harborview','New Meridian','Northgate','Rivermouth'];const i=n.cities.length;n.cities.push({name:cityNames[i-1],type:'Regional City',level:1,pop:n.population*.08,income:650000,happiness:64,citySeed:hashCity(`${n.name}:${cityNames[i-1]}`)});}save();toast('City upgraded');renderGame();}
function collectAway(){tick();const e=state.nation.awayEarned||0;state.nation.awayEarned=0;save();toast(e>0?`Collected ${money(e)} while you were away`:'No pending rewards');renderGame();}
function continuePlaying(){tick();const e=state.nation.awayEarned||0;state.nation.awayEarned=0;state.screen='home';save();renderGame();const el=document.querySelector('.dashboardgrid');el?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>toast(e>0?`Welcome back — ${money(e)} collected.`:'Welcome back to your nation.'),120);}
function toast(msg){state.toast=msg;renderGame();clearTimeout(window.__toast);window.__toast=setTimeout(()=>{state.toast='';renderGame()},2200)}
function credits(){return `<div class="credits">Made by Sajid<br><span>Instagram: <a href="https://www.instagram.com/sajidaddin" target="_blank" rel="noopener noreferrer">@sajidaddin</a> · <a href="https://www.instagram.com/sajidphobic" target="_blank" rel="noopener noreferrer">@sajidphobic</a></span></div>`;}
function icon(s,cls=''){return `<span class="uiicon ${cls}">${s}</span>`;}
function topbar(){const n=state.nation;const month=Math.max(1,Math.floor((Date.now()-n.created)/2592000000)%12+1),year=Math.max(1,Math.floor((Date.now()-n.created)/(2592000000*12))+1);return `<header class="topbar"><div class="mobilebrand">FORGE A NATION</div><div class="topstats"><div class="topstat">${icon('◉','goldic')}<span><b>${money(n.money)}</b><small>+${money(income())}/day</small></span></div><div class="topstat">${icon('♟','blueic')}<span><b>${fmt(n.population/1e6)}M</b><small>+8.6K/day</small></span></div><div class="topstat">${icon('★','goldic')}<span><b>${Math.round(n.reputation)}</b><small>Reputation</small></span></div><div class="datebox"><b>Year ${year}, Month ${month}</b><small>☀ Sunny 24°C</small></div></div></header>`;}
function sidebar(){const items=[['home','⌂','Home'],['map','●','Map'],['cities','▥','Cities'],['buildings','▣','Buildings'],['skills','◈','Skills'],['development','◆','Development'],['store','▤','Store'],['statistics','▥','Statistics'],['history','▤','History'],['settings','⚙','Settings']];return `<aside class="sidebar"><div class="brand"><h1>FORGE<br>A NATION</h1><p>Build. Grow. Lead.</p></div><nav>${items.map(([id,ic,label])=>`<button class="navitem ${state.screen===id?'active':''}" data-screen="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</nav><div class="quick"><small>Quick Actions</small><button class="gold" data-action="continue">Continue Game</button><button class="outline" data-action="new">＋ New Nation</button></div>${credits()}</aside>`;}
function hero(){const n=state.nation,l=level();return `<section class="hero"><div class="hero-scene" id="hero-scene" aria-label="Artistic 3D national panorama"></div><div class="heroShade"></div><div class="heroContent"><div class="welcome"><small>Welcome Back,</small><h1>${esc(n.name)}</h1><p>A small nation with big dreams.</p></div><div class="nationcard"><div class="emblem">✦</div><div class="nationcardbody"><b>${esc(n.name)}</b><span>${l.name}</span><small>Lv. ${l.level}</small><div class="bar"><i style="width:${xpPct()}%"></i></div><em>${Math.floor(n.xp).toLocaleString()} / ${(nextLevel()?.xp||n.xp).toLocaleString()}</em></div></div><button class="gold continue" data-action="continue">▶ &nbsp; Continue Playing</button></div><div class="metrics">${metric('◉','National Wealth',money(n.money),'+'+money(income())+'/day')} ${metric('♟','Population',fmt(n.population/1e6)+'M','+8.6K/day')} ${metric('☺','Happiness',Math.round(n.happiness)+'%','+1.3%')} ${metric('★','Reputation',Math.round(n.reputation),'+2.4%')}</div><aside class="away"><h3>While You Were Away...</h3><div>${icon('◉','goldic')}<b>+${money(n.awayEarned||0)}</b><span>National Income</span></div><div>${icon('♟','greenic')}<b>+12.8K</b><span>Population</span></div><div>${icon('▥','blueic')}<b>+1.2K</b><span>Industrial Output</span></div><div>${icon('◆','goldic')}<b>Education advanced</b><span>to Lv. ${n.skills.education}</span></div><button class="gold" data-action="collect">Collect Rewards</button></aside></section>`;}
function metric(ic,title,value,delta){return `<div class="metric">${icon(ic)}<div><small>${title}</small><strong>${value}</strong><em>${delta}</em></div></div>`;}
function skillsCard(){const n=state.nation;return `<section class="panel skills-panel"><div class="paneltitle"><h2>National Skills</h2><button class="textbtn" data-screen="skills">View All</button></div>${skillDefs.map(d=>`<div class="skillrow"><div class="skillicon ${d.cls}">${d.icon}</div><div><b>${d.name}</b><small>Lv. ${n.skills[d.id]} · ${d.effect}</small></div><button class="mini greenbtn" data-skill="${d.id}">Upgrade<span>${money(skillCost(d.id))}</span></button></div>`).join('')}</section>`;}
function storeCard(){const n=state.nation;return `<section class="panel store-panel"><div class="paneltitle"><h2>Development Store</h2><button class="textbtn" data-screen="store">View All</button></div><div class="tabs"><button class="active">All</button><button>Economic</button><button>Civic</button><button>Culture</button><button>Luxury</button></div><div class="storelist">${storeDefs.slice(0,6).map(d=>{const ok=level().level>=d.req,can=n.money>=d.cost;return `<div class="storeitem"><img src="/${d.img}" alt=""><div><b>${d.name}</b><small>${d.desc}</small></div><strong>${money(d.cost)}</strong><button class="mini ${ok&&can?'greenbtn':'lockbtn'}" data-buy="${d.id}" ${ok&&can?'':'disabled'}>${ok?'Buy':'🔒'}</button></div>`}).join('')}</div></section>`;}
function cityCard(){const n=state.nation,c=n.cities[0],cityCost=Math.round(1800000*Math.pow(1.55,n.cityLevel-1));return `<section class="panel city-panel"><div class="paneltitle"><h2>City Overview</h2><button class="textbtn" data-screen="cities">View All</button></div><div class="cityimage city3d" data-city-scene="${esc(c.name)}"><span>Lv. ${c.level}</span></div><div class="cityhead"><div><b>${esc(c.name)}</b><small>◉ Capital City</small></div></div><div class="citystats"><div>${icon('♟')}<small>Population</small><b>${fmt(c.pop/1e6)}M</b><em>+3.2K/day</em></div><div>${icon('◉')}<small>Income</small><b>${money(c.income)}</b><em>+12%</em></div><div>${icon('♥')}<small>Happiness</small><b>${Math.round(c.happiness)}%</b><em>+4%</em></div></div><h3>City Buildings</h3>${['Residential Zone','Industrial Zone','Commercial Zone','Infrastructure'].map((x,i)=>`<div class="buildingrow"><div class="buildingbadge">${['⌂','▥','▣','◆'][i]}</div><div><b>${x}</b><small>Lv. ${Math.min(3,c.level)} · +${(i+1)*2}%</small></div><button class="mini greenbtn" data-action="cityup">Upgrade<span>${money(1600000+i*400000)}</span></button></div>`).join('')}<button class="cityupgrade gold" data-action="cityup">Upgrade City · ${money(cityCost)}</button></section>`;}
function progressCard(){const n=state.nation,l=level(),next=nextLevel();return `<section class="panel progress-panel"><div class="paneltitle"><h2>Development Progress</h2></div><div class="stage"><small>Current Stage</small><b>${l.name}</b><span>Lv. ${l.level}</span><div class="bar"><i style="width:${xpPct()}%"></i></div><em>${Math.floor(n.xp).toLocaleString()} / ${(next?.xp||n.xp).toLocaleString()}</em></div><div class="next"><small>Next Promotion</small><h3>${next?next.name:'World-Class Nation'}</h3>${next?`<p>Requirements:</p><div>✓ Reach ${next.xp.toLocaleString()} development XP</div><div>✓ Grow your national wealth</div><div>✓ Upgrade key capabilities</div><hr><p>Rewards:</p><div>+18% National Income</div><div>New buildings unlocked</div><button class="gold" data-screen="statistics">View Progression</button>`:`<p>Your nation has reached the highest stage.</p>`}</div></section>`;}
function globalCard(){return `<section class="panel global-panel"><div class="paneltitle"><h2>Global Standing</h2><button class="textbtn">View All</button></div><div class="diplomacy">${icon('◎')}<span><b>Diplomacy</b><small>Allies</small></span><b>›</b></div>${[['US','United States','Friendly +20'],['◇','Eurasia','Neutral +12'],['★','Al-Sham','Neutral +8'],['◉','Veridian','Tense -14']].map((x,i)=>`<div class="relation"><b>${x[0]}</b><span>${x[1]}</span><small class="${i===3?'bad':''}">${x[2]}</small></div>`).join('')}</section>`;}
function achievements(){const arr=[['⌂','Factory Built','Build your first factory','+10'],['◆','University','Build a university','+10'],['◉','First Export Deal','Trade internationally','+20'],['♟','Population Milestone','Reach 1 million population','+30'],['◎','Good Relations','Form an alliance','+15']];return `<section class="panel achievements"><div class="paneltitle"><h2>Achievements</h2><button class="textbtn">View All</button></div><div class="tabs"><button class="active">All</button><button>Trade</button><button>Relations</button></div>${arr.map((x,i)=>`<div><span class="achievementicon">${x[0]}</span><section><b>${x[1]}</b><small>${x[2]}</small></section><em>${i<1&&state.nation.assets.factory?x[3]:'+'+x[3].replace('+','')}</em></div>`).join('')}</section>`;}
function lower(){const n=state.nation,l=level();return `<section class="panel national-progress"><div class="paneltitle"><h2>National Progression</h2></div><div class="nodes">${levels.map(x=>`<div class="node ${x.level<=l.level?'done':''} ${x.level===l.level?'current':''}"><span>${x.level<=l.level?'◆':'◇'}</span><b>${x.name.replace(' Nation','')}</b><small>Lv. ${x.level}</small></div>`).join('')}</div></section><section class="panel activity"><div class="paneltitle"><h2>Recent Activity</h2></div>${n.history.slice(0,4).map((x,i)=>`<div>${icon(['◉','◆','⌂','♟'][i])}<span>${esc(x)}</span><small>${i+1}h ago</small></div>`).join('')}</section><section class="panel buildtomorrow"><img src="/hero-art.jpg" alt="Clean city illustration"><div><h2>Build a greater tomorrow</h2><p>Your decisions shape the future of ${esc(n.name)}.</p><button class="gold" data-screen="map">View Map</button></div></section>`;}
function home(){return `<main class="maincontent">${hero()}<div class="dashboardgrid"><div>${skillsCard()}</div><div>${storeCard()}</div><div>${cityCard()}</div><div>${progressCard()}</div><div>${globalCard()}${achievements()}</div></div><div class="lowergrid">${lower()}</div></main>`;}
function listPage(kicker,title,content){return `<main class="subpage"><div class="pagehead"><small>${kicker.toUpperCase()}</small><h1>${title}</h1><p>Manage this part of ${esc(state.nation.name)} with the same progression-driven simulation.</p></div>${content}</main>`;}
function fullSkills(){return listPage('National Skills','Build your capabilities.',`<div class="fullskills">${skillsCard()}</div>`);}
function fullStore(){return listPage('Development Store','Build the things that make a nation better.',`<div class="fullstore">${storeDefs.map(d=>{const n=state.nation,u=level().level>=d.req,can=n.money>=d.cost;return `<article class="bigstore"><img class="thumb" src="/${d.img}" alt=""><div><h2>${d.name}</h2><p>${d.desc}</p><small>+${money(d.inc)}/day · Requires Level ${d.req}</small></div><strong>${money(d.cost)}</strong><button class="gold" data-buy="${d.id}" ${!u||!can?'disabled':''}>${u?'Buy':'Locked'}</button></article>`}).join('')}</div>`);}
function fullCities(){return listPage('Cities','A nation that grows city by city.',`<div class="citiesfull">${state.nation.cities.map((c,i)=>`<article class="citylarge"><div class="citylarge3d city3d" data-city-scene="${esc(c.name)}"></div><div><small>${c.type.toUpperCase()}</small><h2>${esc(c.name)}</h2><p>${fmt(c.pop/1e6)}M citizens · Level ${c.level}</p><button class="gold" data-action="cityup">Upgrade City</button></div></article>`).join('')}</div>`);}
function fullProgress(){return listPage('Nation Progression','Watch your story unfold.',`<div class="fullprogress">${levels.map(x=>`<article class="pstage ${x.level<=level().level?'done':''}"><span>Lv.${x.level}</span><h2>${x.name}</h2><p>Unlock: ${x.unlock}</p><small>${x.xp.toLocaleString()} XP</small></article>`).join('')}</div>`);}
function fullMap(){return listPage('National Map','See your nation grow.',`<section class="mapscene panel"><div class="nation3d" id="nation-city-scene"></div><div class="mapbadges"><div><b>${state.nation.cities.length}</b><small>Cities</small></div><div><b>${Object.values(state.nation.assets).reduce((a,b)=>a+b,0)}</b><small>Developments</small></div><div><b>Lv. ${level().level}</b><small>Nation</small></div></div><button class="gold" data-screen="cities">Manage Cities</button></section>`);}
function fullHistory(){return listPage('National History','Your nation, year by year.',`<section class="historylist panel">${state.nation.history.map((x,i)=>`<div>${icon(i%2?'◆':'◉')}<section><b>${esc(x)}</b><small>Chapter ${state.nation.history.length-i}</small></section></div>`).join('')}</section>`);}
function fullSettings(){return listPage('Settings','Keep control of your nation.',`<section class="settingspanel panel"><button class="outline" data-action="new">Start a New Nation</button><button class="outline" data-action="save">Save Game</button><p>Your game is stored locally in this browser.</p></section>`);}
function placeholder(title,sub){return listPage(title,sub,`<div class="placeholder panel"><div class="placeholdericon">◈</div><h2>Coming together.</h2><p>This section uses the same live nation data and will expand as your country develops.</p><button class="gold" data-screen="home">Back Home</button></div>`);}

let citySceneRecords=[];
let heroSceneRecord=null,heroSceneFrame=null,heroSceneResize=null;
function disposeCityScenes(){citySceneRecords.forEach(r=>{try{r.renderer.dispose();r.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}})}catch{}});citySceneRecords=[];}
function disposeHeroScene(){
  if(heroSceneFrame)cancelAnimationFrame(heroSceneFrame); heroSceneFrame=null;
  if(heroSceneResize){window.removeEventListener('resize',heroSceneResize);heroSceneResize=null;}
  if(heroSceneRecord){try{heroSceneRecord.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});heroSceneRecord.renderer.dispose();heroSceneRecord.host.innerHTML='';}catch{} heroSceneRecord=null;}
}
function initHeroScene(){
  const host=$('#hero-scene'); if(!host)return;
  disposeHeroScene();
  const width=host.clientWidth||900,height=host.clientHeight||390;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x050b12);
  scene.fog=new THREE.FogExp2(0x07111b,.035);
  const camera=new THREE.PerspectiveCamera(34,width/height,.1,140);
  camera.position.set(8.8,5.2,10.8); camera.lookAt(0,1.1,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
  renderer.setSize(width,height,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  // Landscape — Night direction: moonlit procedural terrain, dense star band,
  // atmospheric fog, grass/stone foreground and a slow cinematic camera.
  scene.add(new THREE.HemisphereLight(0x587b9a,0x03070b,.9));
  const moonLight=new THREE.DirectionalLight(0xb9d4ee,1.7);
  moonLight.position.set(-7,12,5); moonLight.castShadow=true; scene.add(moonLight);
  const warmFill=new THREE.PointLight(0xffb25d,2.0,28); warmFill.position.set(2,2,-1); scene.add(warmFill);

  const world=new THREE.Group(); scene.add(world);
  const groundMat=new THREE.MeshStandardMaterial({color:0x17272b,roughness:.96,metalness:0,flatShading:true});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(34,25,42,28),groundMat);
  ground.rotation.x=-Math.PI/2; ground.position.set(0,-.08,-1); ground.receiveShadow=true; world.add(ground);
  const gp=ground.geometry.attributes.position;
  for(let i=0;i<gp.count;i++){
    const x=gp.getX(i),z=gp.getY(i);
    const y=.06*Math.sin(x*.75)+.045*Math.cos(z*.9)+.025*Math.sin((x+z)*2.1);
    gp.setZ(i,y);
  }
  ground.geometry.computeVertexNormals();

  // Distant ridges, kept low so the hero reads as a landscape rather than a city render.
  for(let band=0;band<5;band++){
    const w=30-band*2.2,h=6.2-band*.42;
    const geo=new THREE.PlaneGeometry(w,h,26,8);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i), edge=1-Math.min(1,Math.abs(y)/(h*.5));
      const crest=Math.sin(x*.28+band*1.37)*(.8+band*.08)+Math.sin(x*.63-band*.7)*.27+Math.cos(x*1.05+band)*.12;
      pos.setZ(i,crest*edge);
    }
    geo.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.55,.25,.095+band*.018),roughness:1,flatShading:true});
    const ridge=new THREE.Mesh(geo,mat);
    ridge.rotation.x=-Math.PI/2;
    ridge.position.set(0,.35+band*.27,-5.0-band*1.45);
    world.add(ridge);
  }

  // Moon and restrained halo.
  const moon=new THREE.Mesh(new THREE.SphereGeometry(.78,24,24),new THREE.MeshBasicMaterial({color:0xe4edf4}));
  moon.position.set(-6.8,6.4,-9); world.add(moon);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(1.35,20,20),new THREE.MeshBasicMaterial({color:0x8fb7d6,transparent:true,opacity:.075,depthWrite:false}));
  halo.position.copy(moon.position); world.add(halo);

  // Star band: dense, but constrained to the visible upper landscape rather than a noisy full cube.
  const starGeo=new THREE.BufferGeometry(),stars=[];
  const rng=(()=>{let x=hashCity(`${state.nation?.name||'nation'}:landscape-night`);return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}})();
  for(let i=0;i<3920;i++){
    const x=(rng()-.5)*34, y=3.0+rng()*8.8, z=-13+rng()*10;
    stars.push(x,y,z);
  }
  starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  world.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xd7e8f4,size:.018,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending})));

  // Foreground stones and grass-like tufts give the terrain the authored 3D feel.
  const terrainSeed=rng;
  for(let i=0;i<55;i++){
    const x=(terrainSeed()-.5)*17,z=1+terrainSeed()*8;
    const s=.035+terrainSeed()*.095;
    const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshStandardMaterial({color:0x3a4a4d,roughness:1}));
    stone.position.set(x,s,z); stone.scale.y=.55+terrainSeed()*.7; world.add(stone);
  }
  for(let i=0;i<90;i++){
    const x=(terrainSeed()-.5)*18,z=1+terrainSeed()*7;
    const g=new THREE.Group();
    for(let j=0;j<3;j++){
      const blade=new THREE.Mesh(new THREE.ConeGeometry(.012,.22+terrainSeed()*.18,3),new THREE.MeshStandardMaterial({color:0x345b4c,roughness:1}));
      blade.position.set((terrainSeed()-.5)*.08,.11,(terrainSeed()-.5)*.08); blade.rotation.z=(terrainSeed()-.5)*.45; g.add(blade);
    }
    g.position.set(x,0,z); world.add(g);
  }

  // A subtle distant road/settlement trace connects the landscape to the nation-building theme.
  const routeMat=new THREE.LineBasicMaterial({color:0x6ea7aa,transparent:true,opacity:.24});
  for(let r=0;r<4;r++){
    const pts=[];
    for(let i=0;i<28;i++){
      const x=-8+i*.6, z=-1.4+r*.65+Math.sin(i*.34+r)*.1;
      pts.push(new THREE.Vector3(x,.025,z));
    }
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),routeMat));
  }

  // Dense skyline: based on the MIT-licensed THREEx.ProceduralCity approach rather than a custom static illustration.
  const city=new THREE.Group(); city.position.set(1.1,.02,-2.8); world.add(city);
  const lvl=Math.max(1,Math.min(10,level().level));
  addProceduralCityDistrict(city,hashCity(`${state.nation?.name||'nation'}:hero-city`),lvl,{radius:5.8,density:1.05,hero:true,road:0x233b43,palette:[0x4c606a,0x687b84,0x82929a,0x3f535d,0x9ca8ac]});
  addKenneyCityAssets(city,hashCity(`${state.nation?.name||'nation'}:hero-kenney`),lvl,{radius:5.5});

  const rec={renderer,scene,camera,world,host}; heroSceneRecord=rec;
  let t=0;
  const animate=()=>{
    heroSceneFrame=requestAnimationFrame(animate); t+=.0025;
    world.position.y=Math.sin(t*.55)*.018;
    world.rotation.y=Math.sin(t*.13)*.006;
    camera.position.x=8.8+Math.sin(t*.32)*.28;
    camera.position.y=5.2+Math.sin(t*.24)*.08;
    camera.lookAt(0,1.05,0);
    renderer.render(scene,camera);
  };
  animate();
  heroSceneResize=()=>{if(!heroSceneRecord)return;const w=host.clientWidth||900,h=host.clientHeight||390;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
  window.addEventListener('resize',heroSceneResize);
}

// Open-source city-generation basis: adapted from THREEx.ProceduralCity (MIT),
// modernized for Three.js r180 and made deterministic for Forge a Nation.
// Source: https://github.com/jeromeetienne/threex.proceduralcity

// Kenney City Kit (CC0) runtime asset integration.
// Source: https://kenney.nl/assets/city-kit-suburban
// The browser loads the self-contained GLB models from the public Kenney mirror;
// procedural massing remains as a graceful fallback if the network is unavailable.
const KENNEY_BASE='https://raw.githubusercontent.com/shorepine/kenney/main/3d/';
const kenneyLoader=new GLTFLoader();
const kenneyCache=new Map();
const KENNEY_SUBURBAN=['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r'].map(x=>`${KENNEY_BASE}city-suburban/building-type-${x}.glb`);
const KENNEY_ROAD=`${KENNEY_BASE}city-roads/tile-low.glb`;
function loadKenney(url){
  if(kenneyCache.has(url))return kenneyCache.get(url);
  const promise=new Promise((resolve,reject)=>kenneyLoader.load(url,g=>resolve(g.scene),undefined,reject));
  kenneyCache.set(url,promise); return promise;
}
function cloneKenney(src){
  const x=src.clone(true); x.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}); return x;
}
function addKenneyCityAssets(group,seed,level,opts={}){
  const rng=(()=>{let x=(seed>>>0)||1;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}})();
  const radius=opts.radius||5.4;
  // Fewer, larger suburban lots at early levels; more lots unlock as the city grows.
  const count=Math.min(18,6+Math.floor(level*1.35));
  const urls=KENNEY_SUBURBAN.slice(0,Math.min(10,KENNEY_SUBURBAN.length));
  Promise.all(urls.map(u=>loadKenney(u))).then(models=>{
    if(!group.parent)return;
    const assetGroup=new THREE.Group(); assetGroup.name='Kenney City Kit'; group.add(assetGroup);

    // The previous implementation used a fixed center-to-center distance. That is
    // not sufficient because Kenney models have different footprints. Instead,
    // measure every actual model footprint after scaling/rotation and reject a
    // candidate whenever its bounding circle would intersect another house.
    const placed=[];
    const coreClearance=3.65;
    const outerRadius=Math.min(radius,6.0);
    const candidates=[];
    // Deterministic perimeter lots: four sides, then corners/intermediate slots.
    for(let row=0;row<4;row++){
      const t=(row+.5)/4;
      const span=outerRadius*2.0;
      const inset=.65+row*.10;
      candidates.push(
        {x:-outerRadius+inset+t*0,z:-outerRadius+inset},
        {x: outerRadius-inset,z:-outerRadius+inset+t*0},
        {x:-outerRadius+inset,z: outerRadius-inset},
        {x: outerRadius-inset,z: outerRadius-inset}
      );
    }
    // Add jittered perimeter candidates so different cities do not look identical.
    for(let i=0;i<70;i++){
      const side=Math.floor(rng()*4),t=.08+rng()*.84,j=(rng()-.5)*.34;
      if(side===0)candidates.push({x:-outerRadius+j,z:(t*2-1)*outerRadius});
      if(side===1)candidates.push({x: outerRadius+j,z:(t*2-1)*outerRadius});
      if(side===2)candidates.push({x:(t*2-1)*outerRadius,z:-outerRadius+j});
      if(side===3)candidates.push({x:(t*2-1)*outerRadius,z: outerRadius+j});
    }

    let attempts=0;
    for(const src of models){
      if(placed.length>=count)break;
      const repeats=3;
      for(let rep=0;rep<repeats && placed.length<count;rep++){
        attempts++;
        const b=cloneKenney(src);
        const scale=(0.46+rng()*.13)*(1+level*.012);
        b.scale.setScalar(scale);
        b.rotation.y=Math.floor(rng()*4)*Math.PI/2;

        // Compute the real horizontal footprint of this exact Kenney model.
        const rawBox=new THREE.Box3().setFromObject(b);
        const rawSize=new THREE.Vector3(); rawBox.getSize(rawSize);
        const footprint=Math.max(.38,Math.hypot(rawSize.x,rawSize.z)/2);
        let accepted=false;
        // Shuffle through deterministic candidates rather than repeatedly guessing
        // points in already occupied space.
        for(let cidx=0;cidx<candidates.length && !accepted;cidx++){
          const c=candidates[(cidx+Math.floor(rng()*candidates.length))%candidates.length];
          const x=c.x,z=c.z;
          if(Math.hypot(x,z)<coreClearance+footprint)continue;
          let clear=true;
          for(const p of placed){
            if(Math.hypot(p.x-x,p.z-z)<p.footprint+footprint+.24){clear=false;break;}
          }
          if(!clear)continue;
          b.position.set(x,.045,z);
          // Recompute after position/rotation; this keeps the collision proxy honest.
          const worldBox=new THREE.Box3().setFromObject(b);
          const center=new THREE.Vector3();worldBox.getCenter(center);
          const worldSize=new THREE.Vector3();worldBox.getSize(worldSize);
          const actualFootprint=Math.max(.38,Math.hypot(worldSize.x,worldSize.z)/2);
          if(Math.hypot(center.x,center.z)<coreClearance+actualFootprint)continue;
          let worldClear=true;
          for(const p of placed){if(Math.hypot(center.x-p.x,center.z-p.z)<p.footprint+actualFootprint+.24){worldClear=false;break;}}
          if(!worldClear)continue;
          b.position.y=.045;
          assetGroup.add(b);
          placed.push({x:center.x,z:center.z,footprint:actualFootprint});
          accepted=true;
        }
        if(!accepted)b.traverse(o=>{if(o.isMesh)o.geometry?.dispose?.()});
      }
    }

    // Use Kenney road tiles only around the suburban ring. The procedural/core
    // roads remain separate, preventing road geometry from sitting underneath the
    // same house lots.
    loadKenney(KENNEY_ROAD).then(src=>{
      const roadGroup=new THREE.Group(); roadGroup.name='Kenney Suburban Roads'; assetGroup.add(roadGroup);
      const roadRadius=outerRadius+.15;
      for(let i=-2;i<=2;i++){
        const a=cloneKenney(src);a.position.set(i*2.05,.025,-roadRadius);a.rotation.y=0;a.scale.setScalar(.88);roadGroup.add(a);
        const b=cloneKenney(src);b.position.set(i*2.05,.026, roadRadius);b.rotation.y=Math.PI; b.scale.setScalar(.88);roadGroup.add(b);
      }
      for(let i=-1;i<=1;i++){
        const a=cloneKenney(src);a.position.set(-roadRadius,.027,i*2.05);a.rotation.y=Math.PI/2;a.scale.setScalar(.88);roadGroup.add(a);
        const b=cloneKenney(src);b.position.set( roadRadius,.028,i*2.05);b.rotation.y=-Math.PI/2;b.scale.setScalar(.88);roadGroup.add(b);
      }
    }).catch(()=>{});
  }).catch(()=>{});
}

function addProceduralCityDistrict(group,seed,level,opts={}){
  const rng=(()=>{let x=(seed>>>0)||1;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}})();
  const radius=opts.radius||7;
  const density=opts.density||1;
  const rows=Math.round((10+level*3)*density);
  const cols=Math.round((10+level*3)*density);
  const palette=opts.palette||[0x71828c,0x8f9da4,0x596b76,0xa9b2b5,0x435560];
  const road=opts.road||0x263941;
  // Roads first: the original open-source generator is a massing city; this adds a readable street hierarchy.
  const roadMat=new THREE.MeshStandardMaterial({color:road,roughness:.92});
  for(let i=-3;i<=3;i++){
    const r=new THREE.Mesh(new THREE.BoxGeometry(.16,.025,radius*2.1),roadMat); r.position.set(i*1.45,.018,0); group.add(r);
    const a=new THREE.Mesh(new THREE.BoxGeometry(radius*2.1,.025,.16),roadMat); a.position.set(0,.019,i*1.45); group.add(a);
  }
  // Dense deterministic massing, following the THREEx/Mr.doob idea of repeated randomized building blocks.
  for(let ix=0;ix<cols;ix++) for(let iz=0;iz<rows;iz++){
    if(rng()<.09) continue;
    const x=(ix/(cols-1)-.5)*radius*2 + (rng()-.5)*.32;
    const z=(iz/(rows-1)-.5)*radius*1.55 + (rng()-.5)*.28;
    const dist=Math.hypot(x,z);
    if(dist<1.0 && rng()<.75) continue;
    const urban=(1+level*.11);
    const towerChance=.05+level*.012;
    const w=.24+rng()*.5, d=.24+rng()*.5;
    let h=(.45+rng()*1.4)*urban;
    if(rng()<towerChance) h*=2.3+level*.08;
    if(opts.hero) h*=.9;
    const mat=new THREE.MeshStandardMaterial({color:palette[Math.floor(rng()*palette.length)],roughness:.72,metalness:.08});
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); b.position.set(x,h/2+.035,z); b.rotation.y=(rng()-.5)*.08; group.add(b);
    // warm window bands; deliberately sparse so the scene remains performant.
    if(h>.8 && rng()<.48){
      const wm=new THREE.MeshStandardMaterial({color:0xffc56e,emissive:0x7d4318,emissiveIntensity:.65,roughness:.45});
      const side=new THREE.Mesh(new THREE.BoxGeometry(.018,Math.min(h*.58,1.7),d*.56),wm);
      side.position.set(x-w/2-.012,h*.56,z); group.add(side);
    }
    if(level>=5 && h>1.8 && rng()<.22){
      const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.7,.06,d*.7),new THREE.MeshStandardMaterial({color:0xc6d2d7,roughness:.45,metalness:.18}));
      roof.position.set(x,h+.055,z); group.add(roof);
    }
  }
  // Central landmark grows with national development.
  if(level>=3){
    const h=1.4+level*.38;
    const lm=new THREE.Mesh(new THREE.BoxGeometry(.7,h,.7),new THREE.MeshStandardMaterial({color:0x4fb9c4,metalness:.25,roughness:.35}));
    lm.position.set(0,h/2+.05,0); group.add(lm);
    const spire=new THREE.Mesh(new THREE.ConeGeometry(.12,.8,8),new THREE.MeshStandardMaterial({color:0xd8e6ea,metalness:.35,roughness:.3}));
    spire.position.set(0,h+.45,0); group.add(spire);
  }
}

function addCityBuilding(group,x,z,w,h,d,mat,seed,level){
  const g=new THREE.BoxGeometry(w,h,d);const m=new THREE.MeshStandardMaterial({color:mat,roughness:.82,metalness:.08});const b=new THREE.Mesh(g,m);b.position.set(x,h/2+.05,z);group.add(b);
  if(level>=4&&h>1.3){const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.72,.08,d*.72),new THREE.MeshStandardMaterial({color:0xd5b85c,roughness:.7}));roof.position.set(x,h+.09,z);group.add(roof)}
  if(seed%3===0){const side=new THREE.Mesh(new THREE.BoxGeometry(.045,h*.58,d*.76),new THREE.MeshStandardMaterial({color:0x7fd2d7,emissive:0x183c43,emissiveIntensity:.18}));side.position.set(x-w/2-.024,h*.54,z);group.add(side)}
}
function buildCityScene(host,c,opts={}){
  if(!host||!c)return null;
  const width=host.clientWidth||640,height=host.clientHeight||320;
  const scene=new THREE.Scene();
  const style=cityStyle(c); scene.background=new THREE.Color(style.ground);
  const camera=new THREE.PerspectiveCamera(32,width/height,.1,100);camera.position.set(8,7,10);camera.lookAt(0,1.4,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(width,height,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
  const hemi=new THREE.HemisphereLight(0xaed9e4,0x10252c,1.7);scene.add(hemi);const sun=new THREE.DirectionalLight(0xffe0a4,2.2);sun.position.set(5,10,4);sun.castShadow=true;scene.add(sun);
  const group=new THREE.Group();scene.add(group);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(18,14),new THREE.MeshStandardMaterial({color:style.ground,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;group.add(ground);
  const seed=c.citySeed||citySeed(c),rng=(()=>{let x=seed||1;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}})();
  // Use the open-source procedural city approach as the base massing, then layer Forge a Nation progression on top.
  addProceduralCityDistrict(group,seed,Math.max(1,Math.min(10,c.level||1)),{radius:5.3,density:.72,road:style.road,palette:[style.roof,0x9ab0b6,0xb9c3b7,0x7f9aa6,0xc8a97b]});
  addKenneyCityAssets(group,seed,Math.max(1,Math.min(10,c.level||1)),{radius:5.1});
  // road grid expands as the city develops
  const lvl=Math.max(1,Math.min(10,c.level||1));
  const roads=3+Math.min(5,Math.floor(lvl/2));
  const roadMat=new THREE.MeshStandardMaterial({color:style.road,roughness:.95});
  for(let i=0;i<roads;i++){const x=-5+i*(10/(roads-1));const r=new THREE.Mesh(new THREE.BoxGeometry(.28,.035,12),roadMat);r.position.set(x,.02,0);group.add(r)}
  for(let i=0;i<roads-1;i++){const z=-5+i*(10/(roads-2));const r=new THREE.Mesh(new THREE.BoxGeometry(11,.035,.28),roadMat);r.position.set(0,.025,z);group.add(r)}
  // water/river for selected styles
  if(style.name==='Coastal'||style.name==='River Valley'){
    const water=new THREE.Mesh(new THREE.PlaneGeometry(18,3.2),new THREE.MeshStandardMaterial({color:0x1f6f82,roughness:.25,metalness:.12}));water.rotation.x=-Math.PI/2;water.position.set(0,.03,5.5);group.add(water);
    if(style.name==='River Valley'){water.scale.x=.7;water.rotation.z=.15;water.position.set(-3,.03,0)}
  }
  // neighborhoods get denser/taller with progression
  const count=5+lvl*2; const radius=3.8;
  for(let i=0;i<count;i++){
    const x=(rng()-.5)*radius*2,z=(rng()-.5)*radius*1.65;const nearRoad=Math.min(Math.abs(x-Math.round(x/1.7)*1.7),Math.abs(z-Math.round(z/1.7)*1.7));
    const h=(.45+rng()*1.15)*(1+lvl*.12)*(rng()<.12+lvl*.015?1.7:1);const w=.35+rng()*.55,d=.35+rng()*.55;
    const mat=[style.roof,0x9ab0b6,0xb9c3b7,0x7f9aa6,0xc8a97b][Math.floor(rng()*5)];addCityBuilding(group,x,z,w,h,d,mat,Math.floor(rng()*1000),lvl);
    if(rng()<.22){const tree=new THREE.Mesh(new THREE.ConeGeometry(.14,.55,6),new THREE.MeshStandardMaterial({color:0x4b9b63}));tree.position.set(x+w*.8,.28,z+d*.8);group.add(tree)}
  }
  // signature landmark evolves with level
  const landmarkH=1.2+lvl*.32;const landmark=new THREE.Mesh(new THREE.BoxGeometry(.7,.18+landmarkH,.7),new THREE.MeshStandardMaterial({color:style.accent,metalness:.18,roughness:.55}));landmark.position.set(0,(.18+landmarkH)/2+.05,0);group.add(landmark);
  if(lvl>=3){const tower=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,landmarkH*1.8,8),new THREE.MeshStandardMaterial({color:0xcbd9de,metalness:.35,roughness:.3}));tower.position.set(1.6,landmarkH*.9+.08,-1.2);group.add(tower)}
  if(lvl>=5){for(let i=0;i<3;i++){const crane=new THREE.Mesh(new THREE.BoxGeometry(.05,1.5,.05),new THREE.MeshStandardMaterial({color:0xd9a84d}));crane.position.set(-3+i*1.2, .75, 2.8);group.add(crane)}}
  if(lvl>=7){for(let i=0;i<3;i++){const tower=new THREE.Mesh(new THREE.BoxGeometry(.7,2.8+i*.45,.7),new THREE.MeshStandardMaterial({color:0x8fb6c8,metalness:.3,roughness:.35}));tower.position.set(-2+i*2,1.4+i*.22,-2.4);group.add(tower)}}
  let dragging=false,lastX=0,lastY=0;renderer.domElement.style.touchAction='none';renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointercancel',()=>dragging=false);renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;group.rotation.y+=(e.clientX-lastX)*.008;group.rotation.x=THREE.MathUtils.clamp(group.rotation.x+(e.clientY-lastY)*.004,-.35,.25);lastX=e.clientX;lastY=e.clientY});
  const rec={renderer,scene,camera,group,host};citySceneRecords.push(rec);return rec;
}
function initCityScenes(){disposeCityScenes();if(!state.nation)return;$$('[data-city-scene]').forEach(host=>{const name=host.dataset.cityScene;const c=state.nation.cities.find(x=>x.name===name);if(c)buildCityScene(host,c)});const nationHost=$('#nation-city-scene');if(nationHost){const aggregate={...state.nation.cities[0],name:state.nation.name+' Nation',level:level().level,citySeed:hashCity(state.nation.name+':nation')};buildCityScene(nationHost,aggregate)};const animate=()=>{if(!citySceneRecords.length)return;citySceneRecords.forEach(r=>{if(r.group&&r.host.offsetWidth>0&&r.host.offsetHeight>0){r.group.rotation.y+=.0007;r.renderer.render(r.scene,r.camera)}});window.__cityFrame=requestAnimationFrame(animate)};cancelAnimationFrame(window.__cityFrame);window.__cityFrame=requestAnimationFrame(animate)}
function renderGame(){tick();disposeHeroScene();const root=$('#app');let body=home();if(state.screen==='skills')body=fullSkills();else if(['store','development','buildings'].includes(state.screen))body=fullStore();else if(state.screen==='cities')body=fullCities();else if(['statistics','progress'].includes(state.screen))body=fullProgress();else if(state.screen==='map')body=fullMap();else if(state.screen==='history')body=fullHistory();else if(state.screen==='settings')body=fullSettings();else if(state.screen==='diplomacy')body=placeholder('Global Standing','Diplomacy and relations.');root.innerHTML=`<div class="game"><div class="sidebarwrap">${sidebar()}</div><div class="gamearea">${topbar()}${body}</div></div>${state.toast?`<div class="toast">${esc(state.toast)}</div>`:''}`;requestAnimationFrame(()=>{initHeroScene();initCityScenes()});}

let landingRenderer,landingScene,landingCamera,landingGlobe,landingFrame;
function disposeLanding(){if(landingFrame)cancelAnimationFrame(landingFrame);landingFrame=null;if(landingRenderer)landingRenderer.dispose();landingRenderer=null;landingScene=null;landingCamera=null;landingGlobe=null;}
function initLanding(){const host=$('#landing-globe');if(!host)return;disposeLanding();const w=host.clientWidth||500,h=host.clientHeight||500;landingScene=new THREE.Scene();landingCamera=new THREE.PerspectiveCamera(38,w/h,.1,100);landingCamera.position.z=6.4;landingRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});landingRenderer.setPixelRatio(Math.min(1.6,devicePixelRatio||1));landingRenderer.setSize(w,h,false);landingRenderer.setClearColor(0,0);host.appendChild(landingRenderer.domElement);landingGlobe=new THREE.Group();landingGlobe.rotation.z=-.16;landingScene.add(landingGlobe);const pts=[];const golden=(1+Math.sqrt(5))/2;for(let i=0;i<1700;i++){const y=1-i/1699*2,r=Math.sqrt(Math.max(0,1-y*y)),a=i*golden*Math.PI*2;pts.push(Math.cos(a)*r*2.3,y*2.3,Math.sin(a)*r*2.3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));landingGlobe.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x80d9df,size:.026,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})));const mat=new THREE.LineBasicMaterial({color:0x65cbd2,transparent:true,opacity:.12});for(let lat=-75;lat<=75;lat+=15){const ring=[],p=THREE.MathUtils.degToRad(lat),rr=Math.cos(p)*2.31,yy=Math.sin(p)*2.31;for(let j=0;j<=96;j++){const a=j/96*Math.PI*2;ring.push(new THREE.Vector3(Math.cos(a)*rr,yy,Math.sin(a)*rr))}landingGlobe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),mat));}let drag=false,lastX=0,lastY=0;host.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY};host.onpointerup=()=>drag=false;host.onpointerleave=()=>drag=false;host.onpointermove=e=>{if(drag){landingGlobe.rotation.y+=(e.clientX-lastX)*.004;landingGlobe.rotation.x+=(e.clientY-lastY)*.003;lastX=e.clientX;lastY=e.clientY}};const anim=()=>{landingFrame=requestAnimationFrame(anim);if(!drag)landingGlobe.rotation.y+=.0015;landingRenderer.render(landingScene,landingCamera)};anim();window.addEventListener('resize',()=>{if(!landingRenderer)return;const ww=host.clientWidth,hh=host.clientHeight;landingCamera.aspect=ww/hh;landingCamera.updateProjectionMatrix();landingRenderer.setSize(ww,hh,false);},{once:false});}
function showLanding(){disposeLanding();$('#app').innerHTML=`<main class="landing"><div class="landing-copy"><small>SIMULATE · BUILD · WATCH IT LIVE</small><h1>FORGE<br><span>A NATION</span></h1><p>Build a country. Then watch your decisions become cities, roads, factories, farms and history.</p><button class="landingbtn" data-action="create">CREATE YOUR NATION <b>→</b></button><div class="landingnote">LOCAL-FIRST · SINGLE PLAYER · NO ACCOUNT</div>${credits()}</div><div class="landing-globe" id="landing-globe"></div></main>`;initLanding();}
function showGame(){if(!state.nation){showLanding();return}renderGame();}
function renderCreator(){disposeLanding();$('#app').innerHTML=`<main class="creator"><div class="creatorcard"><button class="backbtn" data-action="backlanding">← Back</button><div class="creatorhead"><small>FORGE A NATION</small><h1>Create Your Nation</h1><p>Choose an identity, a focus, and a starting population.</p></div><div class="creatorgrid"><label>Nation Name<input id="nationName" value="Novara" maxlength="24"></label><label>Government<select id="gov"><option>Republic</option><option>Kingdom</option><option>Federation</option><option>Commonwealth</option></select></label><label>Capital Geography<select id="terrain"><option>Coastal</option><option>River Valley</option><option>Highlands</option><option>Plains</option></select></label><label>Starting Population<select id="pop"><option value="1.2" selected>1.2 million</option><option value="2.1">2.1 million</option><option value="3.8">3.8 million</option><option value="5.2">5.2 million</option></select></label></div><label>National Focus<select id="focus">${Object.entries(focusDefs).map(([k,v])=>`<option value="${k}">${v.name} — ${v.desc}</option>`).join('')}</select></label><div class="presetrow"><button data-preset="coastal">Coastal Republic</button><button data-preset="industrial">Industrial Power</button><button data-preset="tech">Tech Nation</button><button data-preset="cultural">Cultural State</button></div><button class="landingbtn createbtn" data-action="forge">CREATE NATION <b>→</b></button>${credits()}</div></main>`;$$('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{const p=btn.dataset.preset;$('#terrain').value=p==='coastal'?'Coastal':p==='tech'?'River Valley':p==='cultural'?'Coastal':'Plains';$('#focus').value=p==='coastal'?'commercial':p==='tech'?'technological':p==='cultural'?'cultural':'industrial';}));}

let navSwipe=false,navStartX=0,navStartY=0;
document.addEventListener('touchstart',e=>{const nav=e.target.closest('.sidebar nav');if(!nav)return;const t=e.touches[0];navSwipe=false;navStartX=t.clientX;navStartY=t.clientY;},{passive:true});
document.addEventListener('touchmove',e=>{const nav=e.target.closest('.sidebar nav');if(!nav)return;const t=e.touches[0];if(Math.abs(t.clientX-navStartX)>10&&Math.abs(t.clientX-navStartX)>Math.abs(t.clientY-navStartY))navSwipe=true;},{passive:true});
document.addEventListener('click',e=>{if(navSwipe&&e.target.closest('.sidebar nav')){navSwipe=false;e.preventDefault();e.stopPropagation();return;}const b=e.target.closest('[data-screen],[data-action],[data-skill],[data-buy]');if(!b)return;if(b.dataset.screen){state.screen=b.dataset.screen;save();renderGame();return}if(b.dataset.skill){upgradeSkill(b.dataset.skill);return}if(b.dataset.buy){buyAsset(b.dataset.buy);return}const a=b.dataset.action;if(a==='create')renderCreator();else if(a==='new')newNation();else if(a==='backlanding'){state.screen='landing';showLanding();}else if(a==='cityup')upgradeCity();else if(a==='collect')collectAway();else if(a==='continue')continuePlaying();else if(a==='forge')createNation();else if(a==='save'){save();toast('Game saved');}});
setInterval(()=>{if(state.nation){tick();save();}},1000);
if(state.nation)showGame();else showLanding();
