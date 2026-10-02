const S=10,N=S*S; let state;
const challenges=["Terreno Difícil","Obstáculo Natural","Orientação Perdida","Primeiros Socorros","Travessia de Rio","Vida Selvagem","Clima Adverso","Resgate e Liderança"];
const resources=[
["Cantil",1,"energy"],["Ração de Campo",1,"energy"],["Equipamento de Trilha",1,"cq"],["Ferramenta Multiuso",1,"xp"],["Mapa e Orientação",1,"xp"],["Kit de Primeiros Socorros",2,"energy"],["Corda e Mosquetão",1,"cq"],["Abrigo de Acampamento",2,"cq"],["Comunicação por Rádio",1,"xp"],["Conhecimento Local",1,"cq"],["Insígnia Escoteira",2,"cq"],["Tempo Adverso",-2,"cq"]];
const board=document.querySelector("#board"),$=id=>document.getElementById(id);
function rnd(n){return Math.floor(Math.random()*n)} function pos(i){return [i%S,Math.floor(i/S)]} function dist(a,b){let[x,y]=pos(a),[u,v]=pos(b);return Math.abs(x-u)+Math.abs(y-v)}
function pathExists(blocked){let q=[0],seen=new Set([0]);while(q.length){let i=q.shift();if(i===N-1)return true;for(let j of neighbors(i))if(!blocked.has(j)&&!seen.has(j)){seen.add(j);q.push(j)}}return false}
function neighbors(i){let[x,y]=pos(i),a=[];if(x)a.push(i-1);if(x<S-1)a.push(i+1);if(y)a.push(i-S);if(y<S-1)a.push(i+S);return a}
function pickFree(used,minFromBase=0){let a=[];for(let i=1;i<N-1;i++)if(!used.has(i)&&dist(0,i)>=minFromBase)a.push(i);return a[rnd(a.length)]}
function newGame(){
 let blocked=new Set(),tries=0;while(blocked.size<18&&tries++<500){let i=1+rnd(N-2);blocked.add(i);if(!pathExists(blocked))blocked.delete(i)}
 let used=new Set([...blocked,0,N-1]),items=new Map();
 for(let k=0;k<8;k++){let i=pickFree(used,3);used.add(i);items.set(i,{type:"resource"})}
 let levels=[1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8];
 for(let level of levels){let i=pickFree(used,level>6?4:2);if(i==null)break;used.add(i);items.set(i,{type:"challenge",level})}
 let terrain=buildTerrain(blocked);
 state={player:0,energy:5,xp:1,cq:0,reached:false,blocked,items,visited:new Set([0]),terrain,over:false,moves:0,rolled:false,character:state?.character||"boy",inventory:[]};
 render(); $("log").innerHTML=""; log("🏕️ A jornada começa no Acampamento."); $("resource").textContent="Nenhum ainda.";
}
function buildTerrain(blocked){
 let t=new Map(),types=["field","field","field","trail","forest","mountain","water","marsh","sand"];
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){let i=y*S+x,near=[];
  if(x)near.push(t.get(i-1)); if(y)near.push(t.get(i-S));
  let type=near.length&&Math.random()<.62?near[rnd(near.length)]:types[rnd(types.length)];
  if(blocked.has(i))type=Math.random()<.72?"forest":"mountain";
  if(i===0||i===N-1)type="field"; t.set(i,type)
 }
 return t
}
function render(){board.innerHTML="";for(let i=0;i<N;i++){let c=document.createElement("div");c.className="cell terrain-"+(state.terrain?.get(i)||"field");c.dataset.i=i;c.title=cellTitle(i);if(state.blocked.has(i)){c.classList.add("blocked");c.innerHTML=state.terrain.get(i)==="mountain"?`<span class="terrain-symbol mountain-symbol">▲</span>`:`<span class="terrain-symbol forest-symbol">♠</span>`}else if(i===0)c.innerHTML=`<span class="special-token camp-token"><i>⚜</i><b>BASE</b></span>`;else if(i===N-1)c.innerHTML=`<span class="special-token mark-token"><i>⚑</i><b>MARCO</b></span>`;else if(state.items.has(i)){let o=state.items.get(i);c.innerHTML=o.type==="resource"?`<span class="map-token resource-token" aria-label="Recurso">🎒</span>`:`<span class="map-token challenge-token level-${o.level}" aria-label="Desafio nível ${o.level}"><b>${o.level}</b></span>`}if(state.visited.has(i))c.classList.add("visited");if(i===state.player){c.classList.add("player");c.classList.add(state.character==="girl"?"player-girl":"player-boy")}c.onclick=()=>move(i);board.appendChild(c)}updateStats()}
function cellTitle(i){if(i===0)return "Acampamento";if(i===N-1)return "Marco da Trilha";if(state.blocked.has(i))return state.terrain.get(i)==="mountain"?"Montanha bloqueada":"Mata fechada";let o=state.items.get(i);if(o)return o.type==="resource"?"Recurso desconhecido":"Desafio nível "+o.level;return ({field:"Campo",trail:"Trilha",forest:"Mata",mountain:"Montanha",water:"Água",marsh:"Pântano",sand:"Terreno arenoso"})[state.terrain.get(i)]||"Terreno"}
function move(i){if(state.over||state.moves<=0||state.blocked.has(i)||!neighbors(state.player).includes(i))return;state.moves--;state.player=i;state.visited.add(i);let o=state.items.get(i);if(o){state.items.delete(i);o.type==="resource"?getResource():challenge(o.level)}if(i===N-1&&!state.reached){state.reached=true;state.cq=Math.min(10,state.cq+2);popup("🚩 Marco da Trilha","Você alcançou o Marco! +2 Conquistas. Agora retorne ao Acampamento.");log("🚩 Marco alcançado. Hora de retornar!")}if(i===0&&state.reached&&!state.over){state.over=true;popup("🏆 Jornada concluída!",`Você retornou em segurança com ${state.cq} Conquistas e Experiência ${state.xp}.`);log("🏆 Conquistas garantidas. Jornada concluída!")}render()}
function getResource(){let roll=1+rnd(12);animateDie(roll);let r=resources[roll-1],name=r[0],v=r[1],key=r[2];state.inventory.push(name);state[key]=Math.max(0,Math.min(key==="xp"?8:10,state[key]+v));$("resource").textContent=`${name} (${v>0?"+":""}${v} ${key==="energy"?"Energia":key==="xp"?"Experiência":"Conquistas"})`;popup("🎒 Recurso encontrado",$("resource").textContent);log("🎒 "+$("resource").textContent)}
function challenge(level){let xpBefore=state.xp,loss=Math.max(0,level-xpBefore),gain=level>=xpBefore;state.energy=Math.max(0,state.energy-loss);let cq=0;if(gain){cq=level>=xpBefore+2?2:1;state.xp=Math.min(8,state.xp+1);state.cq=Math.min(10,state.cq+cq)}popup("⚠️ "+challenges[level-1],`Dificuldade ${level}. Você perdeu ${loss} Energia.${gain?" +1 Experiência e +"+cq+" Conquista(s).":""}`);log(`⚠️ ${challenges[level-1]} Nível ${level}: -${loss} Energia.`);if(state.energy<=0){state.over=true;state.cq=0;setTimeout(()=>popup("🌙 Jornada interrompida","Sua Energia chegou a zero. As Conquistas desta jornada foram perdidas."),50)}}
function updateStats(){$("energy").textContent=state.energy+"/10";$("xp").textContent=state.xp+"/8";$("cq").textContent=state.cq+"/10";$("moves").textContent=state.moves;let p=pos(state.player);$("position").textContent=`${String.fromCharCode(65+p[0])}${p[1]+1}`;$("energyBar").style.width=state.energy*10+"%";$("xpBar").style.width=state.xp/8*100+"%";$("cqBar").style.width=state.cq*10+"%";$("inventory").innerHTML=state.inventory.length?state.inventory.slice(-8).map(x=>"<span>🎒 "+x+"</span>").join(""):"<span>Vazia</span>"}
function log(t){$("log").insertAdjacentHTML("afterbegin",'<div class="entry">'+t+"</div>")}
function popup(t,x){$("modalTitle").textContent=t;$("modalText").textContent=x;$("modalText").style.whiteSpace="pre-line";$("modal").classList.remove("hidden");document.body.classList.add("modal-open")}
$("modalClose").onclick=()=>{$("modal").classList.add("hidden");document.body.classList.remove("modal-open")};$("newGame").onclick=()=>confirm("Iniciar uma nova jornada?")&&newGame();newGame();
function animateDie(value){let d=$("die");d.classList.add("rolling");let n=0,t=setInterval(()=>{d.textContent=1+rnd(12);if(++n>9){clearInterval(t);d.textContent=value;d.classList.remove("rolling")}},55)}
$("rollDie").onclick=()=>{if(state.over||state.moves>0)return;let v=1+rnd(12);state.moves=v;state.rolled=true;animateDie(v);log("🎲 D12: "+v+". Até "+v+" movimentos disponíveis.");updateStats()}
$("endMove").onclick=()=>{state.moves=0;updateStats();log("🥾 Movimento encerrado. Role o D12 novamente.")}
document.querySelectorAll(".character").forEach(b=>b.onclick=()=>{document.querySelectorAll(".character").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.character=b.dataset.char;log(b.dataset.char==="girl"?"👩 Escoteira escolhida.":"🧑 Escoteiro escolhido.");render()})
$("rulesBtn").onclick=()=>{popup("📖 Regras da Trilha",`OBJETIVO: saia do Acampamento, alcance o Marco da Trilha e retorne.\n\nMOVIMENTO: role 1D12. O resultado é o máximo de casas que pode percorrer antes de rolar novamente. Movimento apenas ortogonal, nunca diagonal. Terrenos bloqueados não podem ser atravessados.\n\nDESAFIOS: Perda de Energia = Dificuldade − Experiência, mínimo zero. Se Dificuldade ≥ Experiência, ganhe +1 Experiência e +1 Conquista. Se estiver 2 ou mais níveis acima, ganhe 2 Conquistas.\n\nRECURSOS: ao encontrar uma mochila, o D12 determina o recurso e seu efeito.\n\nENERGIA: se chegar a zero, a jornada termina e as Conquistas da jornada são perdidas.\n\nVITÓRIA: retorne ao Acampamento após alcançar o Marco para garantir suas Conquistas.`)}
