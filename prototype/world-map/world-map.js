const regions = [
  {id:"frostmarch",name:"Frostmarch",continent:"ardenfall",city:"Rimegate",icon:"❄",danger:2,x:34,y:21,description:"Glacial shelves, frozen lakes, and migrating frost herds guard Ardenfall's northern passage."},
  {id:"stormpeak",name:"Stormpeak",continent:"ardenfall",city:"Thunderrest",icon:"ϟ",danger:3,x:50,y:27,description:"Charged highlands and exposed rail lines make every crossing fast, profitable, and dangerous."},
  {id:"greenreach",name:"Greenreach",continent:"ardenfall",city:"Willowmere",icon:"♧",danger:1,x:27,y:45,description:"The keeper's starting region: rain-fed meadows, old forests, and the safest roads in Ardenfall."},
  {id:"stonehollow",name:"Stonehollow",continent:"ardenfall",city:"Cairnstead",icon:"◆",danger:2,x:41,y:46,description:"Terraced quarries, deep lifts, and iron roads cut through the mineral heart of the continent."},
  {id:"iron-dominion",name:"Iron Dominion",continent:"ardenfall",city:"Ferrum Gate",icon:"⚙",danger:3,x:56,y:51,description:"Industrial badlands of foundries, rail depots, and smelter-lit cities."},
  {id:"aurelia",name:"Aurelia",continent:"ardenfall",city:"Crownspire",icon:"☀",danger:2,x:40,y:69,description:"The radiant seat of government, trade, tournaments, and the Exchange Guild."},
  {id:"mistwater-coast",name:"Mistwater Coast",continent:"ardenfall",city:"Tidemark",icon:"⚓",danger:2,x:26,y:81,description:"Reef islands and storm shoals connect Ardenfall to the locked western passage into Veydris."},
  {id:"mirefen",name:"Mirefen",continent:"ardenfall",city:"Fenwatch",icon:"♨",danger:4,x:57,y:81,description:"Poisoned waterways, lantern bogs, and whispering fungal groves."},
  {id:"dragonspine",name:"Dragonspine",continent:"veydris",city:"Ashenhold",icon:"♨",danger:5,x:80,y:27,description:"Volcanic ridges, wyrm nests, and ancient fire sanctuaries crown Veydris."},
  {id:"crystal-depths",name:"Crystal Depths",continent:"veydris",city:"Lumenfall",icon:"◇",danger:5,x:73,y:48,description:"Prismatic ravines distort light, thought, and distance around luminous habitats."},
  {id:"the-deep",name:"The Deep",continent:"veydris",city:"Blacktide",icon:"≋",danger:5,x:89,y:49,description:"Drowned fortifications and blackwater channels conceal abyssal species."},
  {id:"rift",name:"The Rift",continent:"veydris",city:"Seamwatch",icon:"◉",danger:5,x:80,y:77,description:"Reality fractures around void storms, anomaly nests, and the road to Nullspire."},
];
const routes = [
  ["greenreach","frostmarch","road",35,1],["greenreach","stonehollow","road",30,1],["greenreach","mistwater-coast","road",40,1],
  ["frostmarch","stormpeak","rail",85,1],["stonehollow","aurelia","rail",55,1],["stormpeak","iron-dominion","rail",80,1],
  ["aurelia","iron-dominion","road",50,1],["aurelia","mistwater-coast","ferry",70,1],["iron-dominion","mirefen","rail",75,1],
  ["mistwater-coast","crystal-depths","ferry",240,2,true],["stormpeak","dragonspine","airship",320,1,true],
  ["dragonspine","the-deep","rail",180,1,true],["crystal-depths","the-deep","ferry",120,1,true],["the-deep","rift","ferry",210,2,true],
].map(([from,to,mode,cost,days,late=false])=>({from,to,mode,cost,days,late}));
const byId = id => regions.find(region=>region.id===id);
const state = {current:"greenreach",selected:"greenreach",continent:"ardenfall",crowns:250,day:1,veydris:false};
const $ = selector => document.querySelector(selector);
const list = $("#destinationList"), hotspots=$("#hotspotLayer"), routeLayer=$("#routeLayer"), toast=$("#toast");

function isLocked(region){ return region.continent==="veydris"&&!state.veydris; }
function routeBetween(a,b){ return routes.find(route=>route.from!==route.to&&[route.from,route.to].includes(a)&&[route.from,route.to].includes(b)); }
function renderRoutes(){
  routeLayer.innerHTML=routes.map((route,index)=>{const a=byId(route.from),b=byId(route.to);const connected=route.from===state.selected||route.to===state.selected;const locked=route.late&&!state.veydris;return `<line class="route ${route.mode} ${connected?"connected":""} ${locked?"locked":""}" x1="${a.x*10}" y1="${a.y*6}" x2="${b.x*10}" y2="${b.y*6}" style="stroke:var(--${route.mode})" data-route="${index}"/>`;}).join("");
}
function regionButton(region,compact=false){
  const locked=isLocked(region),current=region.id===state.current,selected=region.id===state.selected;
  if(compact) return `<button class="destination ${locked?"locked":""} ${current?"current":""} ${selected?"selected":""}" data-region="${region.id}" type="button"><span>${locked?"🔒":region.icon}</span><span><span class="name">${region.name}</span><small>${region.city}</small></span></button>`;
  return `<button class="region-hotspot ${locked?"locked":""} ${current?"current":""} ${selected?"selected":""}" style="left:${region.x}%;top:${region.y}%" data-region="${region.id}" type="button" aria-label="${region.name}${locked?", locked":""}" title="${region.name}">${locked?"🔒":region.icon}</button>`;
}
function render(){
  const selected=byId(state.selected),locked=isLocked(selected),route=routeBetween(state.current,selected.id);
  $("#mapStage").dataset.currentRegion=state.current;
  $("#mapStage").dataset.selectedRegion=state.selected;
  $("#mapStage").dataset.directRoute=route?.mode??"none";
  list.innerHTML=regions.filter(r=>r.continent===state.continent).map(r=>regionButton(r,true)).join("");
  hotspots.innerHTML=regions.map(r=>regionButton(r)).join(""); renderRoutes();
  document.querySelectorAll("[data-continent]").forEach(button=>button.classList.toggle("active",button.dataset.continent===state.continent));
  $("#lockGlyph").textContent=state.veydris?"✓":"🔒"; $("#dayValue").textContent=`Day ${state.day}`; $("#crownsValue").textContent=state.crowns.toLocaleString();
  $("#continentCrumb").textContent=selected.continent==="ardenfall"?"Ardenfall":"Veydris"; $("#regionCrumb").textContent=selected.name;
  $("#regionIcon").textContent=selected.icon; $("#regionContinent").textContent=selected.continent==="ardenfall"?"Ardenfall":"Veydris"; $("#regionName").textContent=selected.name;
  $("#regionDescription").textContent=selected.description; $("#regionCity").textContent=selected.city; $("#regionDanger").textContent="★".repeat(selected.danger)+"☆".repeat(5-selected.danger);
  $("#regionStatus").textContent=locked?"Story locked":selected.id===state.current?"Current location":"Available";
  const connected=routes.filter(r=>r.from===selected.id||r.to===selected.id);
  $("#routeOptions").innerHTML=connected.map(r=>`<div class="route-option ${r.late&&!state.veydris?"locked":""}"><i>${r.mode} to ${byId(r.from===selected.id?r.to:r.from).name}</i><b>${r.cost} ◆ · ${r.days}d</b></div>`).join("");
  const summary=$("#travelSummary"),travel=$("#travelButton");
  if(locked){summary.textContent="Complete the Veydris access milestone to reveal this destination.";travel.disabled=true;}
  else if(selected.id===state.current){summary.textContent=`You are currently in ${selected.name}. Choose a connected destination.`;travel.disabled=true;}
  else if(!route){summary.textContent="No direct route from your current region. Travel through a connected hub first.";travel.disabled=true;}
  else if(route.cost>state.crowns){summary.textContent=`Requires ${route.cost} Crowns. You need ${route.cost-state.crowns} more.`;travel.disabled=true;}
  else {summary.textContent=`${route.mode[0].toUpperCase()+route.mode.slice(1)} · ${route.cost} Crowns · ${route.days} day${route.days>1?"s":""}`;travel.disabled=false;}
  travel.textContent=locked?"Destination locked":"Travel here";
}
function select(id){const region=byId(id);state.selected=id;state.continent=region.continent;render();}
document.addEventListener("click",event=>{const regionButton=event.target.closest("[data-region]");if(regionButton)select(regionButton.dataset.region);const tab=event.target.closest("[data-continent]");if(tab){state.continent=tab.dataset.continent;const first=regions.find(r=>r.continent===state.continent);select(first.id);}});
$("#unlockToggle").addEventListener("click",()=>{state.veydris=!state.veydris;showToast(state.veydris?"Veydris preview unlocked":"Veydris locked");render();});
$("#travelButton").addEventListener("click",()=>{const route=routeBetween(state.current,state.selected);if(!route)return;state.crowns-=route.cost;state.day+=route.days;state.current=state.selected;showToast(`Arrived in ${byId(state.current).name}`);render();});
const interactiveRegions=new Set(regions.map(region=>region.id));
$("#zoomButton").addEventListener("click",()=>{
  if(!interactiveRegions.has(state.selected)){showToast(`${byId(state.selected).name} region map is coming in the next set`);return;}
  window.location.href=`/prototype/world-map/region-map.html?region=${state.selected}`;
});
$("#continentCrumb").addEventListener("click",()=>{state.continent=byId(state.selected).continent;render();});
function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),1800);}
render();
