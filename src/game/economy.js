export function cityEconomicOutput(city, buildDefs){
  const buildings=city?.buildings||[];
  return buildings.reduce((sum,b)=>sum+(buildDefs.find(d=>d.id===b.id)?.income||0),0);
}

export function cityPopulationCapacity(city, buildDefs){
  return (city?.buildings||[]).reduce((sum,b)=>sum+(buildDefs.find(d=>d.id===b.id)?.pop||0),0);
}

export function cityJobs(city, buildDefs){
  return (city?.buildings||[]).reduce((sum,b)=>sum+(buildDefs.find(d=>d.id===b.id)?.jobs||0),0);
}

export function nationalBuildingEffects(nation, buildDefs, storeDefs){
  const cityBuildings=(nation?.cities||[]).flatMap(c=>c.buildings||[]);
  const effects={income:0,happiness:0,reputation:0,populationRate:0,education:0,health:0,technology:0,commerce:0,culture:0,industry:0,trade:0};
  for(const b of cityBuildings){
    const d=buildDefs.find(x=>x.id===b.id); if(!d) continue;
    effects.income+=d.income||0;
    effects.happiness+=d.happy||0;
    effects.education+=d.education||0;
    effects.health+=d.health||0;
    effects.technology+=d.technology||0;
    effects.commerce+=d.trade||0;
    effects.culture+=d.culture||0;
    effects.industry+=d.industry||0;
    effects.trade+=d.trade||0;
  }
  for(const [id,count] of Object.entries(nation?.assets||{})){
    const d=storeDefs.find(x=>x.id===id); if(!d) continue;
    effects.income+=(d.inc||0)*Number(count||0);
    effects.happiness+=(d.happy||0)*Number(count||0);
    effects.reputation+=(d.reputation||0)*Number(count||0);
    effects.education+=(d.education||0)*Number(count||0);
    effects.health+=(d.health||0)*Number(count||0);
    effects.technology+=(d.technology||0)*Number(count||0);
    effects.commerce+=(d.commerce||0)*Number(count||0);
    effects.culture+=(d.culture||0)*Number(count||0);
    effects.industry+=(d.industry||0)*Number(count||0);
    effects.trade+=(d.trade||0)*Number(count||0);
  }
  return effects;
}
