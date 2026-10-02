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
 state={player:0,energy:5,xp:1,cq:0,reached:false,blocked,items,visited:new Set([0]),over:false};
 render(); $("log").innerHTML=""; log("🏕️ A jornada começa no Acampamento."); $("resource").textContent="Nenhum ainda.";
}
function render(){board.innerHTML="";for(let i=0;i<N;i++){let c=document.createElement("div");c.className="cell";c.dataset.i=i;if(state.blocked.has(i)){c.classList.add("blocked");c.textContent="🌲"}else if(i===0)c.textContent="🏕️";else if(i===N-1)c.textContent="🚩";else if(state.items.has(i)){let o=state.items.get(i);c.textContent=o.type==="resource"?"🎒":"⚠️"}if(state.visited.has(i))c.classList.add("visited");if(i===state.player)c.classList.add("player");c.onclick=()=>move(i);board.appendChild(c)}updateStats()}
function move(i){if(state.over||state.blocked.has(i)||!neighbors(state.player).includes(i))return;state.player=i;state.visited.add(i);let o=state.items.get(i);if(o){state.items.delete(i);o.type==="resource"?getResource():challenge(o.level)}if(i===N-1&&!state.reached){state.reached=true;state.cq=Math.min(10,state.cq+2);popup("🚩 Marco da Trilha","Você alcançou o Marco! +2 Conquistas. Agora retorne ao Acampamento.");log("🚩 Marco alcançado. Hora de retornar!")}if(i===0&&state.reached&&!state.over){state.over=true;popup("🏆 Jornada concluída!",`Você retornou em segurança com ${state.cq} Conquistas e Experiência ${state.xp}.`);log("🏆 Conquistas garantidas. Jornada concluída!")}render()}
function getResource(){let r=resources[rnd(12)],name=r[0],v=r[1],key=r[2];state[key]=Math.max(0,Math.min(key==="xp"?8:10,state[key]+v));$("resource").textContent=`${name} (${v>0?"+":""}${v} ${key==="energy"?"Energia":key==="xp"?"Experiência":"Conquistas"})`;popup("🎒 Recurso encontrado",$("resource").textContent);log("🎒 "+$("resource").textContent)}
function challenge(level){let loss=Math.max(0,level-state.xp),gain=level>=state.xp;state.energy=Math.max(0,state.energy-loss);let cq=0;if(gain){state.xp=Math.min(8,state.xp+1);cq=level>=state.xp+1?2:1;state.cq=Math.min(10,state.cq+cq)}popup("⚠️ "+challenges[level-1],`Dificuldade ${level}. Você perdeu ${loss} Energia.${gain?" +1 Experiência e +"+cq+" Conquista(s).":""}`);log(`⚠️ ${challenges[level-1]} Nível ${level}: -${loss} Energia.`);if(state.energy<=0){state.over=true;state.cq=0;setTimeout(()=>popup("🌙 Jornada interrompida","Sua Energia chegou a zero. As Conquistas desta jornada foram perdidas."),50)}}
function updateStats(){$("energy").textContent=state.energy+"/10";$("xp").textContent=state.xp+"/8";$("cq").textContent=state.cq+"/10"}
function log(t){$("log").insertAdjacentHTML("afterbegin",'<div class="entry">'+t+"</div>")}
function popup(t,x){$("modalTitle").textContent=t;$("modalText").textContent=x;$("modal").classList.remove("hidden")}
$("modalClose").onclick=()=>$("modal").classList.add("hidden");$("newGame").onclick=()=>confirm("Iniciar uma nova jornada?")&&newGame();newGame();