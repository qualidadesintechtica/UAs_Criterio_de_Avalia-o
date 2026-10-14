import {norm, names, buildRecords, filterRecords, summarize, groupUAs, criteriaSummary, escapeHTML as esc, exportCSV} from './core.mjs';
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat('pt-BR');
const percent=n=>n==null?'—':n.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const statusLabel={good:'Conforme',bad:'Inconformidade',pending:'Não avaliado'};
const state={records:[],filtered:[],groups:[],filters:{},query:'',status:'all',page:1,size:20,loading:false,loaded:false,run:0,user:null,controller:null};
let client;
const defaults={track:'Todas as esteiras',uc:'Todas as UCs',ua:'Todas as UAs',reviewers:'Todos os revisores',specialists:'Todos os especialistas'};
function source(label,kind=''){ $('sourceStatus').className='source-pill '+kind;$('sourceStatus').innerHTML='<i></i>'+esc(label); }
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{$('toast').hidden=true;},4000);}
function clearSensitive(){state.run++;state.controller?.abort();state.records=[];state.filtered=[];state.groups=[];state.loaded=false;state.loading=false;state.filters={};state.query='';state.status='all';state.page=1;$('search').value='';$('detailDialog').close();$('dialogContent').replaceChildren();$('dialogUA').textContent='';$('dialogUC').textContent='';$('tableBody').innerHTML='<tr><td colspan="7" class="empty-table">Entre para consultar as avaliações.</td></tr>';$('criteriaChart').replaceChildren();$('userName').textContent='Usuário';$('userEmail').textContent='';$('loadError').hidden=true;$('loadError').textContent='';$('dataWarning').hidden=true;$('dataWarning').textContent='';for(const id of ['kpiUA','kpiAssessed','kpiRate','kpiBad','donutTotal','totalGood','totalBad','totalPending'])$(id).textContent='—';for(const select of document.querySelectorAll('[data-filter]'))select.innerHTML='<option value="">'+esc(defaults[select.dataset.filter])+'</option>';$('dashboard').hidden=true;$('login').hidden=false;$('boot').hidden=true;}
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
    const available=filterRecords(state.records,state.filters,state.query,state.status,field);
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
function renderTable(){
  state.groups=groupUAs(state.filtered);const groups=state.groups;const pages=Math.max(1,Math.ceil(groups.length/state.size));state.page=Math.min(state.page,pages);
  const start=(state.page-1)*state.size;const rows=groups.slice(start,start+state.size);
  $('tableCount').textContent=nf.format(groups.length)+' UA(s) · '+nf.format(state.filtered.length)+' critério(s) no recorte';
  $('tableBody').innerHTML=rows.length?rows.map((g,i)=>{
    const s=g.summary;const badges=(s.good?'<span class="tag good">'+s.good+' conforme(s)</span>':'')+(s.bad?'<span class="tag bad">'+s.bad+' inconformidade(s)</span>':'')+(s.pending?'<span class="tag pending">'+s.pending+' não avaliado(s)</span>':'');
    const comments=g.comments.length?'<div class="comment-snippet">'+esc(g.comments[0].text)+'</div><small>'+nf.format(g.comments.length)+' parecer(es) · Abra para ler todos</small>':'<span class="no-comment">Sem comentário registrado</span>';
    return '<tr><td><strong>'+esc(g.uc)+'</strong><small>'+(g.ucId?'ID '+esc(g.ucId)+' · ':'')+esc(g.track)+'</small></td><td><strong>'+esc(g.ua)+'</strong><small>'+(g.uaId?'ID '+esc(g.uaId)+' · ':'')+esc([g.matrix,g.semester].filter(Boolean).join(' · '))+'</small></td><td>'+people(g.specialists)+'</td><td>'+people(g.reviewers)+'</td><td class="result-tags">'+badges+'</td><td>'+comments+'</td><td><button class="view-button" data-detail="'+(start+i)+'" aria-label="Ver avaliação de '+esc(g.ua)+'">Ver avaliação ↗</button></td></tr>';
  }).join(''):'<tr><td colspan="7" class="empty-table">'+(state.records.length?'Nenhuma avaliação encontrada. Ajuste ou limpe os filtros.':'Não há critérios de UAs disponíveis na base para esta conta.')+'</td></tr>';
  $('pageInfo').textContent=groups.length?nf.format(start+1)+'–'+nf.format(start+rows.length)+' de '+nf.format(groups.length)+' UAs · Página '+state.page+' de '+pages:'Nenhuma UA neste recorte';$('prev').disabled=state.page<=1;$('next').disabled=state.page>=pages;$('export').disabled=!state.filtered.length;
}
function render(){state.filtered=filterRecords(state.records,state.filters,state.query,state.status);renderFilters();renderSummary();renderTable();document.querySelectorAll('[data-status]').forEach(b=>{const selected=b.dataset.status===state.status;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});}
function showDetails(index){
  const g=state.groups[index];if(!g)return;
  $('dialogUA').textContent=g.ua;$('dialogUC').textContent=g.uc+(g.ucId?' · ID '+g.ucId:'');
  $('dialogContent').innerHTML='<div class="detail-meta"><div><b>Esteira / Matriz</b>'+esc([g.track,g.matrix,g.semester].filter(Boolean).join(' · '))+'</div><div><b>Especialista(s)</b>'+esc(g.specialists.join('; ')||'Não informado')+'</div><div><b>Revisor(es)</b>'+esc(g.reviewers.join('; ')||'Não informado')+'</div></div>'+g.criteria.map(r=>'<article class="detail-criterion"><div><h3>'+esc(r.criterion)+'</h3><span class="tag '+r.status+'">'+statusLabel[r.status]+'</span></div>'+(r.question&&r.question!==r.criterion?'<p class="question">'+esc(r.question)+'</p>':'')+'<p class="comment">'+esc(r.comment||'Sem comentário registrado para este critério.')+'</p><small>Classificação do especialista: '+esc(r.classification||'Não informada')+' · Responsável: '+esc(r.specialists.join('; ')||'Não informado')+(r.date?' · Data: '+esc(formatDate(r.date)):'')+'</small></article>').join('');
  $('detailDialog').showModal();
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
$('clearFilters').addEventListener('click',()=>{state.filters={};state.query='';state.status='all';state.page=1;$('search').value='';if(state.loaded)render();});
document.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{if(!state.loaded)return;state.status=b.dataset.status;state.page=1;render();}));
let searchTimer;$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=$('search').value;state.page=1;if(state.loaded)render();},150);});
$('prev').addEventListener('click',()=>{state.page--;renderTable();});$('next').addEventListener('click',()=>{state.page++;renderTable();});
$('tableBody').addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(b)showDetails(Number(b.dataset.detail));});
$('closeDialog').addEventListener('click',()=>{$('detailDialog').close();});
$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('export').addEventListener('click',()=>{if(!state.loaded||!state.filtered.length)return;const url=URL.createObjectURL(new Blob([exportCSV(state.filtered)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Resultados_UAs_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Exportação concluída com o recorte selecionado.');});
document.querySelectorAll('.nav-item').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));a.classList.add('active');}));
start();
