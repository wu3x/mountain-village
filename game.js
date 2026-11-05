(()=>{
'use strict';
const canvas=document.getElementById('world'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const W=1500,H=950,plots=[{x:240,y:570,w:250,h:110},{x:535,y:465,w:260,h:110},{x:850,y:350,w:250,h:110},{x:1080,y:260,w:230,h:100}];
const defaults={gold:140,wood:35,grain:0,xp:0,level:1,house:1,plots:plots.map(()=>({crop:null,plantedAt:0})),unlocked:2};
let state;try{state={...defaults,...JSON.parse(localStorage.getItem('mountainVillageSave')||'{}')}}catch{state={...defaults}};
if(!Array.isArray(state.plots)||state.plots.length!==plots.length)state.plots=defaults.plots;
let selected=null,zoom=1,offsetX=0,offsetY=0,drag=null,now=0,last=0;
const crops={wheat:{name:'قمح',cost:5,time:15000,yield:8,xp:12,color:'#e9cb6b'},corn:{name:'ذرة',cost:12,time:30000,yield:16,xp:22,color:'#f0bb44'},coffee:{name:'بن',cost:25,time:60000,yield:30,xp:40,color:'#b94c36'}};
const save=()=>localStorage.setItem('mountainVillageSave',JSON.stringify(state));
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d);ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);resize();
function resetCamera(){zoom=Math.max(.48,Math.min(innerWidth/1450,innerHeight/870));offsetX=(innerWidth-W*zoom)/2;offsetY=(innerHeight-H*zoom)/2}resetCamera();
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2300)}
function updateStats(){$('gold').textContent=state.gold;$('wood').textContent=state.wood;$('grain').textContent=state.grain;$('xp').textContent=state.xp;$('level').textContent='المستوى '+state.level}
function gainXP(n){state.xp+=n;while(state.xp>=state.level*75){state.xp-=state.level*75;state.level++;state.gold+=40;toast('🎉 وصلت للمستوى '+state.level+'! مكافأة 40 عملة')}}
function action(label,fn,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=()=>{fn();save();updateStats();renderPanel()};$('actions').append(b)}
function renderPanel(){const title=$('selectionTitle'),desc=$('selectionText');$('actions').replaceChildren();
if(selected===null){title.textContent='أهلًا بك في القرية الجبلية';desc.textContent='هذه نسخة لعب أولية: ازرع في المدرجات، احصد، اجمع موارد، طور المنزل وافتح أراضي جديدة.';action('🪵 جمع الأخشاب (+8)',()=>{state.wood+=8;gainXP(3);toast('جمع العمال 8 أخشاب')});return}
if(selected==='house'){title.textContent='🏠 المنزل الحجري — مستوى '+state.house;const cost=state.house*40;desc.textContent='تطوير المنزل يزيد تقدم قريتك. التكلفة: '+cost+' عملة و'+state.house*12+' خشب.';action('⬆️ تطوير المنزل',()=>{if(state.gold<cost||state.wood<state.house*12)return toast('الموارد غير كافية');state.gold-=cost;state.wood-=state.house*12;state.house++;gainXP(35);toast('اكتمل تطوير المنزل!')},state.gold<cost||state.wood<state.house*12);return}
if(typeof selected==='number'){const i=selected,p=state.plots[i];title.textContent='🌿 المدرج الزراعي '+(i+1);
if(i>=state.unlocked){const cost=60+(i-2)*60;desc.textContent='هذه أرض جديدة. افتحها مقابل '+cost+' عملة و20 خشب.';action('🔓 فتح الأرض',()=>{if(state.gold<cost||state.wood<20)return toast('الموارد غير كافية');state.gold-=cost;state.wood-=20;state.unlocked++;gainXP(30);toast('تم فتح مدرج جديد!')},state.gold<cost||state.wood<20);return}
if(!p.crop){desc.textContent='اختر محصولًا لزراعته. ينمو مع مرور الوقت حتى لو أغلقت اللعبة.';Object.entries(crops).forEach(([key,c])=>action('🌱 '+c.name+' · '+c.cost+' 🪙',()=>{if(state.gold<c.cost)return toast('تحتاج عملات أكثر');state.gold-=c.cost;p.crop=key;p.plantedAt=Date.now();toast('تمت زراعة '+c.name)},state.gold<c.cost));return}
const c=crops[p.crop],remaining=Math.max(0,c.time-(Date.now()-p.plantedAt));desc.textContent=remaining?'🌱 '+c.name+' ينمو — متبقٍ '+Math.ceil(remaining/1000)+' ثانية':'🌾 '+c.name+' جاهز للحصاد!';
if(!remaining)action('🧺 حصاد +'+c.yield+' محصول',()=>{state.grain+=c.yield;gainXP(c.xp);p.crop=null;p.plantedAt=0;toast('تم الحصاد!')});
else action('⏳ جاري النمو',()=>{},true);
action('💰 بيع 5 من المخزون',()=>{if(state.grain<5)return toast('المخزون غير كافٍ');state.grain-=5;state.gold+=15;toast('تم بيع المحاصيل')},state.grain<5);
}}
function poly(points,fill,stroke='#6e6748',line=2){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function line(points,color,width){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}
function mountain(x,y,w,h,color){poly([[x-w/2,y],[x,y-h],[x+w/2,y]],color,'#736f61',2);poly([[x,y-h],[x+w*.14,y-h*.42],[x+w*.35,y]],'#ffffff20',null)}
function tree(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);line([[0,0],[0,-65]],'#6c4932',10);ellipse(0,-85,38,47,'#3b6740');ellipse(-18,-90,24,31,'#537e49');ellipse(17,-100,25,29,'#62894e');ctx.restore()}
function house(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);poly([[-95,0],[85,0],[85,-130],[-95,-130]],'#b7a17b','#665e4c',4);poly([[-110,-130],[-15,-187],[100,-130]],'#8d5d43','#6c4b3b',5);poly([[-24,0],[23,0],[23,-68],[-24,-68]],'#554532');poly([[-75,-92],[-42,-92],[-42,-57],[-75,-57]],'#564b3e');poly([[42,-92],[70,-92],[70,-57],[42,-57]],'#564b3e');ctx.restore()}
function goat(x,y,t){ctx.save();ctx.translate(x,y+Math.sin(t/380+x)*2);ellipse(0,-15,25,15,'#e6dfc8');ellipse(23,-25,11,10,'#e6dfc8');line([[-15,-6],[-15,11]],'#d9cbb1',4);line([[10,-6],[10,11]],'#d9cbb1',4);line([[22,-32],[17,-43]],'#786d56',2);line([[29,-32],[33,-42]],'#786d56',2);ctx.restore()}
function person(x,y,t,shirt='#aa6b46'){ctx.save();ctx.translate(x,y+Math.sin(t/250+x)*2);ellipse(0,-48,11,13,'#c99167');poly([[-13,-35],[13,-35],[17,0],[-17,0]],shirt,'#6c4d36',2);line([[-7,0],[-9,13]],'#4b3931',5);line([[7,0],[9,13]],'#4b3931',5);ctx.restore()}
function draw(){now=performance.now();ctx.clearRect(0,0,innerWidth,innerHeight);ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(zoom,zoom);
const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#f5cf90');sky.addColorStop(.55,'#f5e2a8');sky.addColorStop(1,'#89a36a');ctx.fillStyle=sky;ctx.fillRect(-1000,-1000,3500,3000);ellipse(1170,135,85,85,'#fff0b4');
mountain(130,490,780,480,'#8c907a');mountain(610,460,830,430,'#92958a');mountain(1160,480,900,550,'#777f75');mountain(1480,500,750,420,'#697c68');
poly([[0,430],[200,400],[420,485],[600,410],[820,485],[1010,400],[1260,455],[1500,390],[1500,950],[0,950]],'#77915b','#65794e',4);
for(let k=0;k<6;k++){let y=445+k*85;poly([[0,y+70],[190,y+15],[390,y+50],[630,y-15],[850,y+15],[1100,y-45],[1500,y-65],[1500,y+70],[1100,y+85],[850,y+115],[630,y+85],[390,y+140],[190,y+105],[0,y+150]],k%2?'#8caa66':'#739558','#766b4b',5)}
line([[0,870],[180,780],[330,730],[470,640],[680,610],[840,515],[1030,480],[1200,390],[1500,350]],'#9b8966',46);line([[0,870],[180,780],[330,730],[470,640],[680,610],[840,515],[1030,480],[1200,390],[1500,350]],'#d7bd8b',34);
for(let i=0;i<plots.length;i++){const p=plots[i],locked=i>=state.unlocked;poly([[p.x,p.y],[p.x+p.w,p.y-28],[p.x+p.w+20,p.y+p.h-25],[p.x+18,p.y+p.h]],'#70654d','#544d3c',4);poly([[p.x,p.y-24],[p.x+p.w,p.y-50],[p.x+p.w+20,p.y+p.h-49],[p.x+18,p.y+p.h-25]],locked?'#7b836c':'#5d8645','#e0c28b',5);
const planted=state.plots[i];if(planted.crop){const c=crops[planted.crop],progress=Math.min(1,(Date.now()-planted.plantedAt)/c.time);for(let row=0;row<3;row++)for(let col=0;col<7;col++){const xx=p.x+38+col*(p.w-42)/7+row*4,yy=p.y-10+row*24-col*3;line([[xx,yy],[xx,yy-8-progress*19]],progress>.8?c.color:'#b7d16e',2+progress*2);ellipse(xx,yy-8-progress*19,3+progress*3,3+progress*2,progress>.8?c.color:'#8fc65e')}}else if(!locked){for(let row=0;row<3;row++)line([[p.x+35,p.y+row*26],[p.x+p.w-10,p.y+row*26-22]],'#4e6d3b',3)}
if(selected===i)poly([[p.x,p.y-24],[p.x+p.w,p.y-50],[p.x+p.w+20,p.y+p.h-49],[p.x+18,p.y+p.h-25]],'#ffffff19','#f7df8d',5);
if(locked){ctx.font='bold 25px Tahoma';ctx.fillStyle='#f5e6c8';ctx.fillText('🔒',p.x+p.w/2,p.y+30)}} 
tree(140,550,1.5);tree(425,445,1.1);tree(810,360,.9);tree(1350,420,1.3);tree(1300,730,1.2);tree(610,770,1);
house(365,710,.9+state.house*.05);house(1060,590,.7);house(1270,490,.6);
ellipse(705,830,95,28,'#6e8c6b');ellipse(705,822,73,23,'#7db4b0');ellipse(705,817,55,13,'#b7d7c7');goat(875+Math.sin(now/1700)*25,755,now);goat(935+Math.cos(now/2200)*20,785,now);person(530+Math.sin(now/1500)*20,735,now);person(1140+Math.sin(now/1900)*30,645,now,'#567c81');
ctx.fillStyle='#f9e8c3';ctx.font='bold 24px Tahoma';ctx.textAlign='center';ctx.fillText('القرية الجبلية',365,495);ctx.textAlign='start';ctx.restore();
requestAnimationFrame(draw)}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left-offsetX)/zoom,y:(e.clientY-r.top-offsetY)/zoom}}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:offsetX,oy:offsetY,moved:false}});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>7)drag.moved=true;if(drag.moved){offsetX=drag.ox+dx;offsetY=drag.oy+dy}});
canvas.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved)return;const q=point(e);selected=null;for(let i=plots.length-1;i>=0;i--){const p=plots[i];if(q.x>=p.x&&q.x<=p.x+p.w+20&&q.y>=p.y-55&&q.y<=p.y+p.h){selected=i;break}}if(selected===null&&q.x>260&&q.x<470&&q.y>510&&q.y<735)selected='house';renderPanel()});
canvas.addEventListener('wheel',e=>{e.preventDefault();const old=zoom;zoom=Math.max(.4,Math.min(2.2,zoom*(e.deltaY>0?.9:1.1)));offsetX=e.clientX-(e.clientX-offsetX)*zoom/old;offsetY=e.clientY-(e.clientY-offsetY)*zoom/old},{passive:false});
function setZoom(mult){const cx=innerWidth/2,cy=innerHeight/2,old=zoom;zoom=Math.max(.4,Math.min(2.2,zoom*mult));offsetX=cx-(cx-offsetX)*zoom/old;offsetY=cy-(cy-offsetY)*zoom/old}
$('zoomIn').onclick=()=>setZoom(1.2);$('zoomOut').onclick=()=>setZoom(.83);$('center').onclick=resetCamera;$('help').onclick=()=>{selected=null;renderPanel();toast('اضغط على المدرجات للزراعة وعلى المنزل للتطوير')};
setInterval(()=>{if(typeof selected==='number')renderPanel();updateStats()},1000);updateStats();renderPanel();requestAnimationFrame(draw);
})();