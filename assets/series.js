/* AGENTIC AI ARCHITECTURE series: shared, data-driven components for every blueprint page.
   A page defines window.BLUEPRINT = {part, total, nodes, edges, wall, steps, scenario, failures, layers, checklist} and calls Series.mount().
   Each widget mounts independently, so a data typo breaks one widget, not the page. */
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const NS='http://www.w3.org/2000/svg';const el=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reduce=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad2=n=>String(n).padStart(2,'0');
const S={};
S.progress=(root,part,total=30)=>{if(!root)return;root.setAttribute('role','img');root.setAttribute('aria-label',`Part ${part} of ${total}`);root.innerHTML=Array.from({length:total},(_,i)=>`<i class="${i<part?'on':''}"></i>`).join('')};
S.validate=B=>{const ids=new Set(B.nodes.map(n=>n.id)),bad=[];(B.edges||[]).forEach(([a,b])=>{if(!ids.has(a)||!ids.has(b))bad.push(`edge ${a}-${b}`)});
  (B.steps||[]).forEach((s,i)=>(s.hops||[]).forEach(([a,b])=>{if(!ids.has(a)||!ids.has(b))bad.push(`step ${i+1} hop ${a}-${b}`)}));
  (B.failures||[]).forEach(f=>{if(B.layers&&!B.layers.includes(f.layer))bad.push(`failure layer ${f.layer}`)});if(bad.length)console.error('BLUEPRINT data problems:',bad);return bad};
// ---- architecture diagram: clickable/keyboard nodes + info panel
S.diagram=(svg,panel,B,{announce}={})=>{if(!svg)return{};const byId={};const vb=(B.viewBox||'0 0 360 700').split(' ').map(Number);svg.setAttribute('viewBox',vb.join(' '));
  const gE=el('g',{},svg),gW=el('g',{},svg),gN=el('g',{},svg);const C=n=>[n.x+n.w/2,n.y+n.h/2];
  const edges=B.edges.filter(([a,b])=>B.nodes.some(n=>n.id===a)&&B.nodes.some(n=>n.id===b)).map(([a,b])=>{const A=B.nodes.find(n=>n.id===a),Z=B.nodes.find(n=>n.id===b);const [x1,y1]=C(A),[x2,y2]=C(Z);
    return el('path',{d:`M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`,class:'edge','data-a':a,'data-b':b},gE)});
  if(B.wall){el('line',{x1:vb[0]+8,x2:vb[0]+vb[2]-8,y1:B.wall.y,y2:B.wall.y,class:'wall'},gW);const t=el('text',{x:vb[0]+12,y:B.wall.y-6,class:'wall-label'},gW);t.textContent=B.wall.label}
  const show=n=>{if(!panel||!n)return;const i=n.info;panel.innerHTML=`<div class="eyebrow">${esc(n.trusted?'Trusted side':'Untrusted / reasoning side')}</div><h3>${esc(n.label)}</h3><p class="muted">${esc(i.role)}</p><dl>
    <div><dt>Can access</dt><dd>${esc(i.access)}</dd></div><div><dt>Must never</dt><dd>${esc(i.never)}</dd></div><div><dt>Failure modes</dt><dd>${esc(i.fails)}</dd></div><div><dt>How you prove it works</dt><dd>${esc(i.proof)}</dd></div></dl>`};
  const select=(id,user)=>{$$('.node',svg).forEach(g=>{g.setAttribute('aria-pressed',g.dataset.id===id?'true':'false');g.classList.remove('on-path')});edges.forEach(e=>e.classList.toggle('hot',e.dataset.a===id||e.dataset.b===id));show(byId[id]);
    if(user){announce&&announce('Showing details: '+byId[id].label);if(panel&&panel.getBoundingClientRect().top>innerHeight-80)panel.scrollIntoView({block:'nearest',behavior:reduce()?'auto':'smooth'})}};
  B.nodes.forEach(n=>{byId[n.id]=n;const g=el('g',{class:'node'+(n.trusted?' trusted':''),tabindex:0,role:'button','aria-pressed':'false','aria-label':`${n.label}${n.sub?', '+n.sub.toLowerCase():''}. Show details`,'data-id':n.id},gN);
    el('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:10},g);const t=el('text',{x:n.x+10,y:n.y+20},g);t.textContent=n.label;if(n.sub){const s=el('text',{x:n.x+10,y:n.y+36,class:'sub'},g);s.textContent=n.sub}
    g.addEventListener('click',()=>select(n.id,true));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n.id,true)}})});
  const fit=()=>$$('.node text',svg).forEach(t=>{const max=+t.closest('.node').querySelector('rect').getAttribute('width')-20;try{if(t.getComputedTextLength()>max){t.setAttribute('textLength',max);t.setAttribute('lengthAdjust','spacingAndGlyphs')}}catch(e){}});
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(fit);
  // path highlight: explicit hops [[a,b],...]; visual only (does not change the pressed/selected state)
  const path=hops=>{const has=(a,b)=>hops.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));const ns=new Set(hops.flat());
    edges.forEach(e=>e.classList.toggle('hot',has(e.dataset.a,e.dataset.b)));$$('.node',svg).forEach(g=>g.classList.toggle('on-path',ns.has(g.dataset.id)))};
  if(B.start)select(B.start,false);return {select,path}};
// ---- request-flow stepper (highlights the diagram path for each step)
S.flow=(root,steps,dia)=>{if(!root)return;let i=0;root.innerHTML=`<div class="dots" role="group" aria-label="Request flow steps">${steps.map((s,k)=>`<button type="button" aria-label="Step ${k+1}: ${esc(s.title)}">${k+1}</button>`).join('')}</div>
  <div aria-live="polite" aria-atomic="true"><div class="eyebrow" data-k></div><h3 data-t></h3><p data-d></p><p class="why" data-w></p><pre data-p tabindex="0" hidden></pre></div>
  <div class="nav"><button type="button" class="btn" data-prev>← Back</button><button type="button" class="btn primary" data-next>Next step →</button></div>`;
  const dots=$$('.dots button',root),pv=$('[data-prev]',root),nx=$('[data-next]',root);const go=k=>{i=Math.max(0,Math.min(steps.length-1,k));const s=steps[i];
    dots.forEach((b,j)=>{if(j===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
    $('[data-k]',root).textContent=`Step ${i+1} of ${steps.length}`;$('[data-t]',root).textContent=s.title;$('[data-d]',root).textContent=s.text;$('[data-w]',root).textContent='Why it matters: '+s.why;
    const p=$('[data-p]',root);p.hidden=!s.payload;p.textContent=s.payload||'';const fo=document.activeElement;pv.disabled=i===0;nx.disabled=i===steps.length-1;if(fo&&fo.disabled)(fo===pv?nx:pv).focus();
    if(dia&&dia.path)dia.path(s.hops||[])};
  dots.forEach((b,k)=>b.addEventListener('click',()=>go(k)));pv.addEventListener('click',()=>go(i-1));nx.addEventListener('click',()=>go(i+1));go(0)};
// ---- two-lane scenario player with an optional variant toggle
S.scenario=(root,SC)=>{if(!root)return;let timer=null,step=-1;
  root.innerHTML=`<div class="ctrl"><button type="button" class="btn primary" data-play><span aria-hidden="true">▶</span> Play</button><button type="button" class="btn" data-step>Next event</button><button type="button" class="btn" data-reset>Reset</button>
   ${SC.toggle?`<label class="toggle"><input type="checkbox" data-var> ${esc(SC.toggle)}</label>`:''}</div><div class="lanes"></div><p class="sr-only" aria-live="polite" data-live></p>`;
  const lanesEl=$('.lanes',root),play=$('[data-play]',root),live=$('[data-live]',root);const variant=()=>$('[data-var]',root)?.checked;const lanes=()=>variant()&&SC.variant?SC.variant:SC.lanes;
  const draw=()=>{lanesEl.innerHTML=lanes().map(L=>`<div class="lane ${L.kind}"><h3>${esc(L.title)}</h3><ol>${L.events.map(e=>`<li class="${e.c||''}">${esc(e.t)}</li>`).join('')}</ol><div class="out" hidden>${L.result}</div></div>`).join('');step=-1};
  const max=()=>Math.max(...lanes().map(L=>L.events.length));
  const show=k=>{step=k;const msg=[];$$('.lane',lanesEl).forEach((ln,j)=>{const L=lanes()[j];$$('li',ln).forEach((li,m)=>li.classList.toggle('on',m<=k));const out=$('.out',ln);out.hidden=k<L.events.length-1;
    if(k>=0&&k<L.events.length)msg.push(`${L.title}: ${L.events[k].t}`);if(k===L.events.length-1)msg.push(out.textContent)});live.textContent=msg.join('. ')};
  const stop=()=>{clearInterval(timer);timer=null;play.innerHTML='<span aria-hidden="true">▶</span> Play'};
  const next=()=>{if(step<max()-1)show(step+1);if(step>=max()-1)stop()};
  play.addEventListener('click',()=>{if(timer){stop();return}if(step>=max()-1)draw();if(reduce()){show(max()-1);return}play.innerHTML='<span aria-hidden="true">❚❚</span> Pause';timer=setInterval(next,1100);next()});
  $('[data-step]',root).addEventListener('click',()=>{stop();if(step>=max()-1)draw();next()});$('[data-reset]',root).addEventListener('click',()=>{stop();draw();live.textContent='Reset'});
  $('[data-var]',root)?.addEventListener('change',()=>{stop();draw();live.textContent=variant()?'Showing: '+SC.toggle:'Showing the standard timeout'});draw()};
// ---- failure-cases table with layer filters (stacks into cards on phones)
S.failures=(root,rows,layers,announce)=>{if(!root)return;let f='All';const H=['Scenario','What goes wrong','Caught by','Response'];
  root.innerHTML=`<div class="filters" role="group" aria-label="Filter by the layer that catches it">${['All',...layers].map(l=>`<button type="button" aria-pressed="${l==='All'}">${esc(l)}</button>`).join('')}</div>
  <div class="tablewrap" tabindex="0" role="region" aria-label="Failure cases"><table class="cards"><caption class="sr-only">Failure cases, the layer that catches each, and the response</caption><thead><tr>${H.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody></tbody></table></div>`;
  const tb=$('tbody',root);const draw=()=>{const R=rows.filter(r=>f==='All'||r.layer===f);tb.innerHTML=R.map(r=>`<tr><td data-label="${H[0]}">${esc(r.s)}</td><td data-label="${H[1]}">${esc(r.w)}</td><td class="layer" data-label="${H[2]}">${esc(r.layer)}</td><td data-label="${H[3]}">${esc(r.r)}</td></tr>`).join('');return R.length};
  $$('.filters button',root).forEach(b=>b.addEventListener('click',()=>{f=b.textContent;$$('.filters button',root).forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));const n=draw();announce&&announce(f==='All'?`Showing all ${n} cases`:`${n} cases caught by ${f}`)}));draw()};
// ---- evaluation checklist (saved only in this browser, keyed by stable item id)
S.checklist=(root,items,key)=>{if(!root)return;let st={};try{st=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
  root.innerHTML=`<p class="small muted" aria-live="polite"><span data-n>0</span> of ${items.length} done · saved only in this browser</p><div class="meter" aria-hidden="true"><i></i></div><ul class="check">${items.map((it,i)=>`<li><label><input type="checkbox" data-id="${esc(it.id||i)}"><span><span class="grp">${esc(it.g)}</span>${esc(it.t)}</span></label></li>`).join('')}</ul>
   <div class="nav"><button type="button" class="btn" data-clear>Clear checklist</button></div>`;
  const upd=()=>{const n=$$('input',root).filter(x=>x.checked).length;$('[data-n]',root).textContent=n;$('.meter i',root).style.width=(100*n/items.length)+'%'};
  $$('input',root).forEach(x=>{x.checked=!!st[x.dataset.id];x.addEventListener('change',()=>{st[x.dataset.id]=x.checked;try{localStorage.setItem(key,JSON.stringify(st))}catch(e){}upd()})});
  $('[data-clear]',root).addEventListener('click',()=>{st={};try{localStorage.removeItem(key)}catch(e){}$$('input',root).forEach(x=>x.checked=false);upd()});upd()};
// ---- copy buttons for payloads
S.copy=(announce)=>{$$('[data-copy]').forEach(b=>{b.dataset.label=b.textContent;b.addEventListener('click',async()=>{const pre=document.getElementById(b.dataset.copy);const txt=pre.textContent;let ok=false;
  try{await navigator.clipboard.writeText(txt);ok=true}catch(e){const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);try{ok=document.execCommand('copy')}catch(_){ok=false}s.removeAllRanges()}
  b.textContent=ok?'Copied ✓':'Select + copy';announce&&announce(ok?'Copied to clipboard':'Copy failed. Select the text manually.');clearTimeout(b._t);b._t=setTimeout(()=>b.textContent=b.dataset.label,1600)})})};
S.mount=()=>{const B=window.BLUEPRINT;S.validate(B);const live=document.body.appendChild(Object.assign(document.createElement('p'),{className:'sr-only'}));live.setAttribute('aria-live','polite');const announce=m=>{live.textContent='';setTimeout(()=>live.textContent=m,30)};
  const total=B.total||30;$$('[data-part]').forEach(e=>e.textContent=e.dataset.part==='long'?`Part ${B.part} of ${total}`:`Part ${pad2(B.part)} / ${total}`);
  const run=(name,f)=>{try{return f()}catch(e){console.error('Series widget failed:',name,e)}};
  run('progress',()=>S.progress($('[data-progress]'),B.part,total));const dia=run('diagram',()=>S.diagram($('#arch-svg'),$('#arch-panel'),B,{announce}))||{};
  run('flow',()=>S.flow($('#flow'),B.steps,dia));run('scenario',()=>S.scenario($('#scenario'),B.scenario));run('failures',()=>S.failures($('#failures'),B.failures,B.layers,announce));
  run('checklist',()=>S.checklist($('#checklist'),B.checklist,'vynema-blueprint-'+B.part+'-checklist'));run('copy',()=>S.copy(announce))};
window.Series=S;})();
