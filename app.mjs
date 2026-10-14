import {norm, names, buildRecords, filterRecords, summarize, groupUAs, criteriaSummary, escapeHTML as esc, exportCSV} from './core.mjs';
import {countUAOutcomes,selectUAOutcome,highlightHTML,uaOutcome} from './view-model.mjs';
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat('pt-BR');
const percent=n=>n==null?'—':n.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const statusLabel={good:'Conforme',bad:'Inconformidade',pending:'Não avaliado'};
const state={records:[],filtered:[],groups:[],filters:{},query:'',status:'all',view:'table',commentsOnly:false,page:1,size:20,loading:false,loaded:false,run:0,user:null,controller:null};
const uaLabels={all:'Todas as UAs',bad:'Com inconformidade',good:'Sem inconformidade',pending:'Sem avaliação'};
let client;
const defaults={track:'Todas as esteiras',uc:'Todas as UCs',ua:'Todas as UAs',reviewers:'Todos os revisores',specialists:'Todos os especialistas'};
function source(label,kind=''){ $('sourceStatus').className='source-pill '+kind;$('sourceStatus').innerHTML='<i></i>'+esc(label); }
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{$('toast').hidden=true;},4000);}
function clearSensitive(){state.run++;state.controller?.abort();state.records=[];state.filtered=[];state.groups=[];state.loaded=false;state.loading=false;state.filters={};state.query='';state.status='all';state.commentsOnly=false;state.page=1;$('search').value='';$('commentsOnly').checked=false;$('detailDialog').close();document.body.classList.remove('drawer-open');$('dialogContent').replaceChildren();$('dialogUA').textContent='';$('dialogUC').textContent='';$('tableBody').innerHTML='<tr><td colspan="7" class="empty-table">Entre para consultar as avaliações.</td></tr>';$('criteriaChart').replaceChildren();$('commentList').replaceChildren();$('filterChips').replaceChildren();$('filterChips').hidden=true;for(const id of ['countAll','countBad','countGood','countPending'])$(id).textContent='—';$('kpiPending').textContent='Aguardando resultados';$('criteriaCount').textContent='— critérios';$('tableCount').textContent='Aguardando dados';$('pageInfo').textContent='—';$('updatedAt').textContent='Aguardando dados';$('insight').textContent='Selecione uma esteira ou uma UC para explorar seus resultados.';for(const id of ['donutGood','donutBad','donutPending'])$(id).style.strokeDasharray='0 1000';source('Conectando à base');document.querySelectorAll('[data-ua-status]').forEach(b=>b.disabled=true);$('userName').textContent='Usuário';$('userEmail').textContent='';$('loadError').hidden=true;$('loadError').textContent='';$('dataWarning').hidden=true;$('dataWarning').textContent='';for(const id of ['kpiUA','kpiAssessed','kpiRate','kpiBad','donutTotal','totalGood','totalBad','totalPending'])$(id).textContent='—';for(const select of document.querySelectorAll('[data-filter]'))select.innerHTML='<option value="">'+esc(defaults[select.dataset.filter])+'</option>';$('dashboard').hidden=true;$('login').hidden=false;$('boot').hidden=true;}
function showLogin(message=''){clearSensitive();$('loginError').textContent=message;$('loginError').hidden=!message;$('password').value='';}
async function activate(user){
  if (!window.UA_CONFIG.allowedDomains.includes(norm(user.email).split('@').pop())) { await client.auth.signOut({scope:'local'});showLogin('Esta conta não possui um domínio institucional autorizado.');return; }
  state.user=user;const name=user.user_metadata?.nome || user.user_metadata?.full_name || user.email.split('@')[0];
  $('userName').textContent=name;$('userEmail').textContent=user.email;$('avatar').textContent=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  $('boot').hidden=true;$('login').hidden=true;$('dashboard').hidden=false;
  await load();
}
function friendly(error){
  const m=String(error?.message||'');
  if (/invalid login|invalid_credentials/i.test(m)) return 'E-mail ou senha incorretos. Confira os dados da sua conta do BI.';
  if (/email not confirmed/i.test(m)) return 'O e-mail desta conta ainda precisa ser confirmado.';
  if (/fetch|network|timeout|abort/i.test(m)||error?.name==='AbortError') return 'Não foi possível concluir a conexão. Verifique sua internet e tente novamente.';
  if (error?.code==='PGRST301'||error?.status===401) return 'Sua sessão expirou. Entre novamente para consultar os resultados.';
  if (error?.code==='42501'||error?.status===403) return 'Sua conta não tem permissão para consultar esta fonte de avaliações.';
  if (error?.code==='42P01'||error?.code==='PGRST205') return 'A fonte de avaliações não foi localizada na base do BI.';
  return 'Não foi possível carregar os resultados da base. Tente atualizar os dados.';
}
async function readAll(table,columns,order,signal,kind){
  const size=500,rows=[];
  const read=async from=>{
    const {data,error}=await client.from(table).select(columns).order(order,{ascending:true}).range(from,from+size-1).abortSignal(signal);
    if(error)throw error;
    return data||[];
  };
  const first=await read(0);rows.push(...first);
  if(first.length<size)return rows;
  for(let offset=size;;offset+=size*4){
    const chunks=await Promise.all(Array.from({length:4},(_,i)=>read(offset+i*size)));
    let end=false;
    for(const part of chunks){rows.push(...part);if(part.length<size){end=true;break;}}
    if(kind==='criteria'&&!signal.aborted)$('updatedAt').textContent='Lendo critérios… '+nf.format(rows.length)+' registros';
    if(end)break;
  }
  return rows;
}
async function load(){
  if(state.loading)return;
  state.loading=true;const run=++state.run;const controller=new AbortController();state.controller=controller;const signal=controller.signal;
  const timeout=setTimeout(()=>controller.abort(),60000);
  $('refresh').disabled=true;$('loadError').hidden=true;$('dataWarning').hidden=true;source('Atualizando resultados');
  if(!state.loaded)$('updatedAt').textContent='Consultando avaliações e materiais…';
  try{
    const {data:auth,error:authError}=await client.auth.getUser();
    if(authError||!auth.user){showLogin('Sua sessão expirou. Entre novamente.');return;}
    if(!window.UA_CONFIG.allowedDomains.includes(norm(auth.user.email).split('@').pop())){await client.auth.signOut({scope:'local'});showLogin('Esta conta não possui acesso institucional.');return;}
    const criteriaColumns='subitem_id,parent_item_id,matriz_oferta,id_ua,titulo_ua,pergunta,criterio,classificacao_especialista,parecer_especialista,classificacao_feita_por,data_classificacao_especialista,apontamos_inconformidade,esteira_producao,categoria_material,revisor_validador,entra_no_calculo';
    const materialColumns='chave_material,monday_item_validacao,id_titulo,id_ua,titulo,titulo_ua,item_name,esteira_producao,matriz_oferta,semestre_oferta,categoria_material,eh_ua,revisor_validador';
    const [criteria,materials]=await Promise.all([
      readAll(window.UA_CONFIG.criteriaView,criteriaColumns,'subitem_id',signal,'criteria'),
      readAll(window.UA_CONFIG.materialsView,materialColumns,'chave_material',signal,'materials')
    ]);
    if(run!==state.run)return;
    const {records,diagnostics}=buildRecords(criteria,materials);state.records=records;state.loaded=true;state.page=1;
    source('Conectado à base do BI','connected');$('updatedAt').textContent='Última consulta: '+new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
    const warnings=[];
    if(diagnostics.unmatched)warnings.push(nf.format(diagnostics.unmatched)+' critério(s) sem vínculo inequívoco com uma UC. Os registros permanecem visíveis como “UC não localizada”.');
    if(diagnostics.missingSpecialists)warnings.push(nf.format(diagnostics.missingSpecialists)+' critério(s) sem a pessoa responsável pela classificação. O campo aparece como “Não informado”.');
    if(warnings.length){$('dataWarning').textContent=warnings.join(' ');$('dataWarning').hidden=false;}
    render();
  }catch(error){
    if(run!==state.run)return;
    source('Falha ao atualizar','failed');$('loadError').textContent=friendly(error)+(state.loaded?' Os resultados abaixo são da última consulta concluída.':'');$('loadError').hidden=false;
    if(!state.loaded){$('updatedAt').textContent='Consulta não concluída';$('tableBody').innerHTML='<tr><td colspan="7" class="empty-table">Não foi possível consultar as avaliações. Clique em Atualizar dados para tentar novamente.</td></tr>';}
  }finally{clearTimeout(timeout);if(run===state.run){state.loading=false;$('refresh').disabled=false;}}
}
function renderFilters(){
  for(const select of document.querySelectorAll('[data-filter]')){
    const field=select.dataset.filter;
    const available=selectUAOutcome(baseScope(field),state.status);
    const values=new Set();let missing=false;
    for(const r of available){const list=Array.isArray(r[field])?r[field]:[r[field]];if(!list.length)missing=true;list.forEach(v=>values.add(v));}
    const current=state.filters[field]||'';
    // Mantém uma escolha anterior visível quando o novo recorte não tem registros.
    if(current&&current!=='__missing__')values.add(current);
    select.innerHTML='<option value="">'+esc(defaults[field])+'</option>'+[...values].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true})).map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')+(missing||current==='__missing__'?'<option value="__missing__">Não informado</option>':'');
    select.value=current;
  }
}
function renderSummary(){
  const s=summarize(state.filtered);$('kpiUA').textContent=nf.format(s.uas);$('kpiAssessed').textContent=nf.format(s.assessed);$('kpiPending').textContent=nf.format(s.pending)+' critério(s) não avaliado(s)';$('kpiRate').textContent=percent(s.rate);$('kpiBad').textContent=nf.format(s.bad);
  $('donutTotal').textContent=nf.format(s.total);$('totalGood').textContent=nf.format(s.good);$('totalBad').textContent=nf.format(s.bad);$('totalPending').textContent=nf.format(s.pending);
  let offset=0;const circumference=2*Math.PI*76;
  for(const [id,value] of [['donutGood',s.good],['donutBad',s.bad],['donutPending',s.pending]]){const len=s.total?value/s.total*circumference:0;$(id).style.strokeDasharray=len+' '+circumference;$(id).style.strokeDashoffset=-offset;offset+=len;}
  $('insight').textContent=!s.total?'Nenhum critério encontrado neste recorte. Ajuste os filtros para ampliar a consulta.':s.bad?nf.format(s.bad)+' critério(s) sinaliza(m) inconformidade. Abra os pareceres para entender os ajustes necessários.':s.pending?'Há '+nf.format(s.pending)+' critério(s) ainda fora do cálculo. A conformidade considera apenas as avaliações concluídas.':'Nenhuma inconformidade apontada nos critérios avaliados deste recorte.';
  const criteria=criteriaSummary(state.filtered);$('criteriaCount').textContent=nf.format(criteria.length)+' critérios';
  $('criteriaChart').innerHTML=criteria.length?criteria.map(c=>'<div class="criterion-row"><div class="criterion-line"><span>'+esc(c.name)+'</span><strong>'+percent(c.rate)+' <small>· '+nf.format(c.total)+'</small></strong></div><div class="bar-track" role="img" aria-label="'+esc(c.name+': '+c.good+' conformes, '+c.bad+' com inconformidade e '+c.pending+' não avaliados')+'"><span class="good" style="width:'+c.good/c.total*100+'%"></span><span class="bad" style="width:'+c.bad/c.total*100+'%"></span><span class="pending" style="width:'+c.pending/c.total*100+'%"></span></div></div>').join(''):'<div class="empty-chart">Nenhum critério encontrado nos filtros atuais.</div>';
}
function people(list){return list.length?list.map(p=>'<span>'+esc(p)+'</span>').join('<br>'):'<span class="no-comment">Não informado</span>';}
function baseScope(skip='') {
  let rows=filterRecords(state.records,state.filters,'','all',skip);
  if(state.query){const keys=new Set(filterRecords(rows,{},state.query).map(r=>r.uaKey));rows=rows.filter(r=>keys.has(r.uaKey));}
  if(state.commentsOnly){const keys=new Set(groupUAs(rows).filter(g=>g.comments.length).map(g=>g.uaKey));rows=rows.filter(r=>keys.has(r.uaKey));}
  return rows;
}
function renderCards(scope){
  const counts=countUAOutcomes(scope);
  for(const [key,id] of [['all','countAll'],['bad','countBad'],['good','countGood'],['pending','countPending']])$(id).textContent=nf.format(counts[key]);
  document.querySelectorAll('[data-ua-status]').forEach(b=>{const selected=b.dataset.uaStatus===state.status;b.disabled=!state.loaded;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('selectionLabel').textContent=uaLabels[state.status];
}
function renderChips(){
  const labels={track:'Esteira',uc:'UC',ua:'UA',reviewers:'Revisor',specialists:'Especialista'};
  let html=Object.entries(state.filters).filter(([,v])=>v).map(([key,value])=>'<button data-clear-filter="'+key+'" aria-label="Remover filtro de '+esc(labels[key])+'">'+esc(labels[key])+': '+esc(value==='__missing__'?'Não informado':value)+'<span aria-hidden="true">×</span></button>').join('');
  if(state.status!=='all')html+='<button data-clear-filter="status" aria-label="Remover filtro de resultado">'+esc(uaLabels[state.status])+'<span aria-hidden="true">×</span></button>';
  if(state.query)html+='<button data-clear-filter="query" aria-label="Limpar pesquisa">Busca: '+esc(state.query)+'<span aria-hidden="true">×</span></button>';
  if(state.commentsOnly)html+='<button data-clear-filter="comments" aria-label="Mostrar registros sem comentários">Com comentários<span aria-hidden="true">×</span></button>';
  $('filterChips').innerHTML=html;$('filterChips').hidden=!html;
}
function previewComment(group){return group.comments.find(c=>state.query&&norm(c.text).includes(norm(state.query)))||group.comments[0];}
function renderTable(){
  state.groups=groupUAs(state.filtered);const groups=state.groups;const pages=Math.max(1,Math.ceil(groups.length/state.size));state.page=Math.min(state.page,pages);
  const start=(state.page-1)*state.size;const rows=groups.slice(start,start+state.size);
  $('tableCount').textContent=nf.format(groups.length)+' UA(s) · '+nf.format(state.filtered.length)+' critério(s) no recorte';
  $('tableBody').innerHTML=rows.length?rows.map((g,i)=>{
    const s=g.summary;const badges=(s.good?'<span class="tag good">'+s.good+' conforme(s)</span>':'')+(s.bad?'<span class="tag bad">'+s.bad+' inconformidade(s)</span>':'')+(s.pending?'<span class="tag pending">'+s.pending+' não avaliado(s)</span>':'');
    const comment=previewComment(g);
    const comments=comment?'<span class="comment-label">'+highlightHTML(comment.criterion,state.query)+'</span><div class="comment-snippet">'+highlightHTML(comment.text,state.query)+'</div><small>'+nf.format(g.comments.length)+' parecer(es) · Leia no painel lateral</small>':'<span class="no-comment">Sem comentário registrado</span>';
    return '<tr><td><strong>'+highlightHTML(g.uc,state.query)+'</strong><small>'+(g.ucId?'ID '+esc(g.ucId)+' · ':'')+esc(g.track)+'</small></td><td><strong>'+highlightHTML(g.ua,state.query)+'</strong><small>'+(g.uaId?'ID '+esc(g.uaId)+' · ':'')+esc([g.matrix,g.semester].filter(Boolean).join(' · '))+'</small></td><td>'+people(g.specialists)+'</td><td>'+people(g.reviewers)+'</td><td class="result-tags">'+badges+'</td><td>'+comments+'</td><td><button class="view-button" data-detail="'+(start+i)+'" aria-label="Ver pareceres de '+esc(g.ua)+'">Ver pareceres <span aria-hidden="true">↗</span></button></td></tr>';
  }).join(''):'<tr><td colspan="7" class="empty-table">'+(state.records.length?'Nenhuma avaliação encontrada. Ajuste ou limpe os filtros.':'Não há critérios de UAs disponíveis na base para esta conta.')+'</td></tr>';
  renderCommentList(rows,start);
  $('pageInfo').textContent=groups.length?nf.format(start+1)+'–'+nf.format(start+rows.length)+' de '+nf.format(groups.length)+' UAs · Página '+state.page+' de '+pages:'Nenhuma UA neste recorte';$('prev').disabled=state.page<=1;$('next').disabled=state.page>=pages;$('export').disabled=!state.filtered.length;
  $('tableView').hidden=state.view!=='table';$('commentList').hidden=state.view!=='list';
  document.querySelectorAll('[data-view]').forEach(b=>{const selected=b.dataset.view===state.view;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
}
function renderCommentList(rows,start){
  const byUC=new Map();rows.forEach((g,i)=>{const key=g.ucId||g.uc;if(!byUC.has(key))byUC.set(key,{uc:g.uc,id:g.ucId,rows:[]});byUC.get(key).rows.push({g,index:start+i});});
  $('commentList').innerHTML=rows.length?[...byUC.values()].map(uc=>'<details class="uc-group" open><summary><span><strong>'+highlightHTML(uc.uc,state.query)+'</strong><small>'+(uc.id?'ID '+esc(uc.id):'Unidade Curricular')+'</small></span><span class="count-pill">'+uc.rows.length+' UA(s) nesta página</span></summary><div>'+uc.rows.map(({g,index})=>{const comment=previewComment(g);const type=uaOutcome(g);return '<button class="comment-row" data-detail="'+index+'" aria-label="Ler os pareceres de '+esc(g.ua)+'"><span class="comment-row-main"><span class="comment-row-title">'+highlightHTML(g.ua,state.query)+'<span class="tag '+type+'">'+esc(uaLabels[type])+'</span></span><span class="comment-row-people">Revisor: '+esc(g.reviewers.join('; ')||'Não informado')+' · Especialista: '+esc(g.specialists.join('; ')||'Não informado')+'</span><span class="comment-row-preview">'+(comment?highlightHTML(comment.text,state.query):'Sem comentário registrado')+'</span></span><span class="comment-row-count"><b>'+g.comments.length+'</b> parecer(es)<span aria-hidden="true">→</span></span></button>';}).join('')+'</div></details>').join(''):'<div class="empty-table">Nenhuma UA encontrada neste recorte.</div>';
}
function render(){const scope=baseScope();state.filtered=selectUAOutcome(scope,state.status);renderFilters();renderCards(scope);renderChips();renderSummary();renderTable();}
function criterionCard(r,history=false){
  const previous=r.history||[];
  const versions=!history&&previous.length?'<details class="previous-versions"><summary>'+previous.length+' classificação(ões) anterior(es)</summary>'+previous.map(v=>'<div class="previous-version"><span class="tag '+v.status+'">'+statusLabel[v.status]+'</span><small>'+esc(v.date?formatDate(v.date):'Data não informada')+' · '+esc(v.specialists.join('; ')||'Responsável não informado')+'</small><p>'+highlightHTML(v.comment||'Sem parecer registrado.',state.query)+'</p><small>Classificação: '+esc(v.classification||'Não informada')+'</small></div>').join('')+'</details>':'';
  return '<article class="detail-criterion '+r.status+'"><div><h3>'+highlightHTML(r.criterion,state.query)+'</h3><span class="tag '+r.status+'">'+statusLabel[r.status]+'</span></div>'+(r.question&&r.question!==r.criterion?'<p class="question">'+esc(r.question)+'</p>':'')+'<p class="comment">'+highlightHTML(r.comment||'Sem comentário registrado para este critério.',state.query)+'</p><small>Classificação: '+esc(r.classification||'Não informada')+' · Responsável: '+esc(r.specialists.join('; ')||'Não informado')+(r.date?' · '+esc(formatDate(r.date)):'')+'</small>'+versions+'</article>';
}
function showDetails(index){
  const selected=state.groups[index];if(!selected)return;
  const g=groupUAs(state.records.filter(r=>r.uaKey===selected.uaKey))[0]||selected;
  $('dialogUA').textContent=g.ua;$('dialogUC').textContent=g.uc+(g.ucId?' · ID '+g.ucId:'');
  const missing=g.criteria.filter(r=>r.status==='bad'&&!r.comment);const s=g.summary;
  $('dialogContent').innerHTML='<div class="detail-meta"><div><b>Esteira / Matriz</b>'+esc([g.track,g.matrix,g.semester].filter(Boolean).join(' · '))+'</div><div><b>Especialista(s)</b>'+esc(g.specialists.join('; ')||'Não informado')+'</div><div><b>Revisor(es)</b>'+esc(g.reviewers.join('; ')||'Não informado')+'</div></div><div class="drawer-summary"><strong>Todos os critérios desta UA</strong><span>'+s.assessed+' de '+s.total+' avaliados</span><div><span class="tag good">'+s.good+' conforme(s)</span><span class="tag bad">'+s.bad+' inconformidade(s)</span>'+(s.pending?'<span class="tag pending">'+s.pending+' não avaliado(s)</span>':'')+'</div></div>'+(missing.length?'<p class="missing-comment-note"><strong>Inconformidade sem parecer</strong>'+esc(missing.map(r=>r.criterion).join('; '))+'</p>':'')+g.criteria.sort((a,b)=>({bad:0,good:1,pending:2}[a.status]-{bad:0,good:1,pending:2}[b.status])||a.criterion.localeCompare(b.criterion,'pt-BR',{numeric:true})).map(r=>criterionCard(r)).join('');
  $('detailDialog').showModal();document.body.classList.add('drawer-open');
}
function formatDate(value){const d=new Date(value.length===10?value+'T12:00:00':value);return Number.isFinite(d.getTime())?d.toLocaleDateString('pt-BR'):value;}
async function start(){
  try{
    if(!window.supabase||!window.UA_CONFIG)throw new Error('SDK indisponível');
    const storage={getItem:k=>{try{return sessionStorage.getItem(k);}catch{return null;}},setItem:(k,v)=>{try{sessionStorage.setItem(k,v);}catch{}},removeItem:k=>{try{sessionStorage.removeItem(k);}catch{}}};
    client=window.supabase.createClient(window.UA_CONFIG.supabaseUrl,window.UA_CONFIG.publishableKey,{auth:{storage,storageKey:'ua-results-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')showLogin();});
    const {data,error}=await client.auth.getSession();
    if(error||!data.session){showLogin();return;}
    const {data:verified,error:verifyError}=await client.auth.getUser();
    if(verifyError||!verified.user){showLogin('Entre novamente para continuar.');return;}
    await activate(verified.user);
  }catch{showLogin('Não foi possível iniciar a conexão do painel. Atualize esta página.');$('loginSubmit').disabled=true;}
}
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!client)return;
  const email=$('email').value.trim();
  if(!window.UA_CONFIG.allowedDomains.includes(norm(email).split('@').pop())){$('loginError').textContent='Use seu e-mail @animaeducacao.com.br cadastrado no BI.';$('loginError').hidden=false;return;}
  $('loginSubmit').disabled=true;$('loginError').hidden=true;
  try{const {data,error}=await client.auth.signInWithPassword({email,password:$('password').value});$('password').value='';if(error)throw error;if(!data.user)throw new Error('Login não concluído');await activate(data.user);}catch(error){$('loginError').textContent=friendly(error);$('loginError').hidden=false;}finally{$('loginSubmit').disabled=false;}
});
$('showPassword').addEventListener('click',()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('showPassword').textContent=show?'Ocultar':'Mostrar';$('showPassword').setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');});
$('logout').addEventListener('click',async()=>{clearSensitive();state.user=null;await client.auth.signOut({scope:'local'});showLogin();});
$('refresh').addEventListener('click',load);
document.querySelectorAll('[data-filter]').forEach(select=>select.addEventListener('change',()=>{state.filters[select.dataset.filter]=select.value;state.page=1;render();}));
$('clearFilters').addEventListener('click',()=>{state.filters={};state.query='';state.status='all';state.commentsOnly=false;state.page=1;$('search').value='';$('commentsOnly').checked=false;if(state.loaded)render();});
document.querySelectorAll('[data-ua-status]').forEach(b=>b.addEventListener('click',()=>{if(!state.loaded)return;state.status=state.status===b.dataset.uaStatus?'all':b.dataset.uaStatus;state.page=1;render();}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;if(state.loaded)renderTable();}));
$('commentsOnly').addEventListener('change',()=>{state.commentsOnly=$('commentsOnly').checked;state.page=1;if(state.loaded)render();});
$('filterChips').addEventListener('click',e=>{const b=e.target.closest('[data-clear-filter]');if(!b)return;const key=b.dataset.clearFilter;if(key==='status')state.status='all';else if(key==='query'){state.query='';$('search').value='';}else if(key==='comments'){state.commentsOnly=false;$('commentsOnly').checked=false;}else delete state.filters[key];state.page=1;render();});
let searchTimer;$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=$('search').value;state.page=1;if(state.loaded)render();},150);});
$('prev').addEventListener('click',()=>{state.page--;renderTable();});$('next').addEventListener('click',()=>{state.page++;renderTable();});
for(const id of ['tableBody','commentList'])$(id).addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(b)showDetails(Number(b.dataset.detail));});
for(const id of ['closeDialog','closeDrawer'])$(id).addEventListener('click',()=>{$('detailDialog').close();});
$('detailDialog').addEventListener('close',()=>document.body.classList.remove('drawer-open'));
$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('export').addEventListener('click',()=>{if(!state.loaded||!state.filtered.length)return;const url=URL.createObjectURL(new Blob([exportCSV(state.filtered)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Resultados_UAs_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Exportação concluída com o recorte selecionado.');});
document.querySelectorAll('.nav-item').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));a.classList.add('active');}));
function setTheme(theme){document.documentElement.dataset.theme=theme;$('themeToggle').setAttribute('aria-label',theme==='dark'?'Ativar tema claro':'Ativar tema escuro');$('themeToggle').title=theme==='dark'?'Tema claro':'Tema escuro';}
let initialTheme;try{initialTheme=localStorage.getItem('ua-results-theme');}catch{}setTheme(initialTheme==='dark'||initialTheme==='light'?initialTheme:window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light');
$('themeToggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(theme);try{localStorage.setItem('ua-results-theme',theme);}catch{}});
start();
