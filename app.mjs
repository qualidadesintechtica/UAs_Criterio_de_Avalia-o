import {isInstitutionalEmail} from './auth-policy.mjs?v=v6-ulife-20261016';
import {RELEASE} from './release.mjs?v=v6-ulife-20261016';
import {norm,filterRecords,groupUAs,escapeHTML as esc,exportCSV} from './core.mjs?v=v6-ulife-20261016';
import {highlightHTML} from './view-model.mjs?v=v6-ulife-20261016';
import {WORKFLOW_LABELS,countWorkflow,selectWorkflow,filterOptions,includeMaterialInventory,materialWorkflow,materialTableRows} from './workflow.mjs?v=v6-ulife-20261016';
import {SECTIONS,buildSections} from './navigation.mjs?v=v6-ulife-20261016';
import {adaptMondayForms,mergeMondayData} from './monday-data.mjs?v=v6-ulife-20261016';
import {commentSourceKey,applyPortalComments,validateComment,commentError} from './portal-comments.mjs?v=v6-ulife-20261016';
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat('pt-BR');
const statusLabel={good:'Conforme',bad:'Inconformidade',pending:'Não avaliado',rated:'Avaliado por conceito',comment:'Parecer / registro Monday'};
const state={section:'UA',sections:{},sectionErrors:{},records:[],filtered:[],groups:[],filters:{},query:'',status:'all',view:'table',commentsOnly:false,page:1,size:20,loading:false,loaded:false,run:0,user:null,controller:null,baseSections:{},portalComments:[],commentsReady:false,dialogKey:null,dialogUnit:null,detailRecords:[],editor:null,saving:false};
const uaLabels={...WORKFLOW_LABELS};
let client;
const defaults={track:'Todas as esteiras',batch:'Todos os lotes',uc:'Todas as UCs',ua:'Todas as UAs',reviewers:'Todos os revisores',specialists:'Todos os especialistas'};
function source(label,kind=''){ $('sourceStatus').className='source-pill '+kind;$('sourceStatus').innerHTML='<i></i>'+esc(label); }
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{$('toast').hidden=true;},4000);}
function clearSensitive(){
  state.run++;state.controller?.abort();state.baseSections={};state.portalComments=[];state.commentsReady=false;
  state.dialogKey=null;state.dialogUnit=null;state.detailRecords=[];state.editor=null;state.saving=false;state.user=null;
  state.sections={};state.sectionErrors={};state.records=[];state.filtered=[];state.groups=[];
  state.loaded=false;state.loading=false;state.filters={};state.query='';state.status='all';state.commentsOnly=false;state.page=1;
  $('search').value='';$('commentsOnly').checked=false;
  for(const b of $('detailDialog').querySelectorAll('button'))b.disabled=false;
  $('detailDialog').close();document.body.classList.remove('drawer-open');
  $('dialogContent').replaceChildren();$('dialogUA').textContent='';$('dialogUC').textContent='';
  $('tableBody').innerHTML='<tr><td colspan="3" class="empty-table">Entre para consultar as avaliações.</td></tr>';
  $('commentList').replaceChildren();$('filterChips').replaceChildren();$('filterChips').hidden=true;
  for(const id of ['countReleased','countValidating','countDesign','countValidated','navCountPE','navCountUA','navCountBDQ','navCountUC'])$(id).textContent='—';
  $('tableCount').textContent='Aguardando dados';$('pageInfo').textContent='—';$('updatedAt').textContent='Aguardando dados';
  source('Conectando à base');document.querySelectorAll('[data-ua-status]').forEach(b=>b.disabled=true);
  $('userName').textContent='Usuário';$('userEmail').textContent='';$('loadError').hidden=true;$('loadError').textContent='';
  $('dataWarning').hidden=true;$('dataWarning').textContent='';
  for(const select of document.querySelectorAll('[data-filter]'))select.innerHTML='<option value="">'+esc(defaults[select.dataset.filter])+'</option>';
  $('dashboard').hidden=true;$('login').hidden=false;$('boot').hidden=true;
}
function showLogin(message=''){clearSensitive();$('loginError').textContent=message;$('loginError').hidden=!message;$('password').value='';}
async function activate(user){
  if (!isInstitutionalEmail(user.email,window.UA_CONFIG.allowedDomains)) { await client.auth.signOut({scope:'local'});showLogin('Esta conta não possui um domínio institucional autorizado.');return; }
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
async function readAccessPolicy(signal){
  const {data,error}=await client.rpc('nq_painel_acesso_institucional',{}).abortSignal(signal);
  if(error)throw error;return data===true;
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
    if(!isInstitutionalEmail(auth.user.email,window.UA_CONFIG.allowedDomains)){await client.auth.signOut({scope:'local'});showLogin('Esta conta não possui acesso institucional.');return;}
    const criteriaColumns='*';
    const materialColumns='*';
    const formsColumns='id,monday_item_id,nome_item,data_avaliacao,data_avaliacao_hora,avaliador,categoria_material,matriz_oferta,conceito_final,validacao_material_item_id,indicador_1,indicador_2,indicador_3,indicador_4,indicador_5,indicador_6,indicador_7,indicador_1_score,indicador_2_score,indicador_3_score,indicador_4_score,indicador_5_score,indicador_6_score,indicador_7_score,synced_at,updated_at';
    const commentsColumns='id,monday_item_id,nome_item,avaliador,categoria_material,matriz_oferta,numero_criterio,criterio_id,criterio_titulo,parecer_id,parecer_titulo,parecer,tipo_formulario,data_avaliacao,data_avaliacao_hora,updated_at,synced_at';
    const results=await Promise.allSettled([
      readAll(window.UA_CONFIG.criteriaView,criteriaColumns,'subitem_id',signal,'criteria'),
      readAll(window.UA_CONFIG.materialsView,materialColumns,'chave_material',signal,'materials'),
      readAll(window.UA_CONFIG.assessmentsView,formsColumns,'id',signal,'forms'),
      readAll(window.UA_CONFIG.commentsView,commentsColumns,'id',signal,'comments'),
      readAll('nq_comentarios','*','id',signal,'portal'),
      readAccessPolicy(signal)
    ]);
    if(run!==state.run)return;
    for(const result of results.slice(0,2))if(result.status==='rejected')throw result.reason;
    const criteria=results[0].value,materials=results[1].value;
    const formError=results.slice(2,4).some(r=>r.status==='rejected');
    const formData=adaptMondayForms(results[2].status==='fulfilled'?results[2].value:[],results[3].status==='fulfilled'?results[3].value:[],materials);
    state.baseSections=includeMaterialInventory(mergeMondayData(buildSections(criteria,materials),formData),materials);
    state.commentsReady=results[4].status==='fulfilled';state.portalComments=state.commentsReady?results[4].value:[];
    state.sections=applyPortalComments(state.baseSections,state.portalComments);
    state.sectionErrors={};if(formError){for(const key of ['PE','BDQ','UC'])state.sectionErrors[key]='Os formulários desta seção não puderam ser consultados. Atualize os dados ou confira a configuração da conexão.';}
    state.records=state.sections[state.section].records;state.loaded=true;state.page=1;
    source('Monday · base sincronizada','connected');
    $('updatedAt').textContent=(formData.lastSync?'Sincronização Monday: '+new Date(formData.lastSync).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})+' · ':'')+'Consulta: '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const warnings=[];if(formError)warnings.push('Os critérios da esteira foram consultados, mas parte dos formulários ou pareceres não está disponível nesta conexão.');
    if(!state.commentsReady)warnings.push(commentError(results[4].reason));
    if(results[5].status!=='fulfilled'||!results[5].value)warnings.push('A base ainda não confirmou a atualização V6. Solicite a atualização do painel ao responsável para habilitar o acesso Ulife e os recursos desta versão.');
    if(materials.length&&!Object.hasOwn(materials[0],'bloco'))warnings.push('Solicite a atualização V6 da base para disponibilizar o lote e os status completos neste painel.');
    $('dataWarning').textContent=warnings.join(' ');$('dataWarning').hidden=!warnings.length;
    renderNavigation();updateSectionLabels();render();
  }catch(error){
    if(run!==state.run)return;
    source('Falha ao atualizar','failed');$('loadError').textContent=friendly(error)+(state.loaded?' Os resultados abaixo são da última consulta concluída.':'');$('loadError').hidden=false;
    if(!state.loaded){$('updatedAt').textContent='Consulta não concluída';$('tableBody').innerHTML='<tr><td colspan="3" class="empty-table">Não foi possível consultar as avaliações. Clique em Atualizar dados para tentar novamente.</td></tr>';}
  }finally{clearTimeout(timeout);if(run===state.run){state.loading=false;$('refresh').disabled=false;}}
}
function renderFilters(){
  for(const select of document.querySelectorAll('[data-filter]')){
    const field=select.dataset.filter,{values,missing}=filterOptions(state.sections,field,state.filters);
    const current=state.filters[field]||'';
    select.innerHTML='<option value="">'+esc(defaults[field])+'</option>'+values.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')+(missing?'<option value="__missing__">Não informado</option>':'');
    select.value=current;
  }
}
function updateSectionLabels(){
  const section=SECTIONS[state.section];uaLabels.all=section.allLabel;
  $('pageTitle').innerHTML=esc(section.title)+'<span class="title-dot">.</span>';
  $('pageSubtitle').textContent='Acompanhe os status e clique no material para consultar ou editar os comentários.';
  $('breadcrumbSection').textContent=section.label;
  $('materialFilterLabel').textContent='UA / material';$('materialColumn').textContent='UA';
  $('tableTitle').textContent=section.tableTitle;$('search').placeholder='Buscar UC, UA, unidade ou comentário…';
  defaults.ua='Todas as UAs / materiais';
}
function renderNavigation(){
  document.querySelectorAll('[data-section]').forEach(b=>{const key=b.dataset.section;const active=key===state.section;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');const rows=state.sections[key]?.records||[];$('navCount'+key).textContent=state.loaded?(state.sectionErrors[key]&&!rows.length?'!':nf.format(new Set(rows.map(r=>r.uaKey)).size)):'—';$('navCount'+key).title=state.sectionErrors[key]||'Materiais com registros nesta fonte';});
}
function selectSection(key){
  if(!SECTIONS[key])return;state.section=key;state.records=state.sections[key]?.records||[];state.page=1;$('detailDialog').close();updateSectionLabels();renderNavigation();if(state.loaded)render();
}
function baseScope(skip='') {
  let rows=filterRecords(state.records,state.filters,'','all',skip);
  if(state.query){const keys=new Set(filterRecords(rows,{},state.query).map(r=>r.uaKey));rows=rows.filter(r=>keys.has(r.uaKey));}
  if(state.commentsOnly){const keys=new Set(groupUAs(rows).filter(g=>g.comments.length).map(g=>g.uaKey));rows=rows.filter(r=>keys.has(r.uaKey));}
  return rows;
}
function renderCards(scope){
  const counts=countWorkflow(scope);
  for(const [key,id] of [['released','countReleased'],['validating','countValidating'],['design','countDesign'],['validated','countValidated']])$(id).textContent=nf.format(counts[key]);
  document.querySelectorAll('[data-ua-status]').forEach(b=>{const selected=b.dataset.uaStatus===state.status;b.disabled=!state.loaded;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('selectionLabel').textContent=uaLabels[state.status];
}
function renderChips(){
  const labels={track:'Esteira',batch:'Lote',uc:'UC',ua:SECTIONS[state.section].itemLabel,reviewers:'Revisor',specialists:'Especialista'};
  let html=Object.entries(state.filters).filter(([,v])=>v).map(([key,value])=>'<button data-clear-filter="'+key+'" aria-label="Remover filtro de '+esc(labels[key])+'">'+esc(labels[key])+': '+esc(value==='__missing__'?'Não informado':value)+'<span aria-hidden="true">×</span></button>').join('');
  if(state.status!=='all')html+='<button data-clear-filter="status" aria-label="Remover filtro de resultado">'+esc(uaLabels[state.status])+'<span aria-hidden="true">×</span></button>';
  if(state.query)html+='<button data-clear-filter="query" aria-label="Limpar pesquisa">Busca: '+esc(state.query)+'<span aria-hidden="true">×</span></button>';
  if(state.commentsOnly)html+='<button data-clear-filter="comments" aria-label="Mostrar registros sem comentários">Com comentários<span aria-hidden="true">×</span></button>';
  $('filterChips').innerHTML=html;$('filterChips').hidden=!html;
}
function previewComment(group){return group.comments.find(c=>state.query&&norm(c.text).includes(norm(state.query)))||group.comments[0];}
function renderTable(){
  state.groups=groupUAs(state.filtered);const groups=state.groups;
  const entries=state.view==='table'?materialTableRows(groups):groups.map((group,detailIndex)=>({group,detailIndex,name:group.ua,unit:group.unitLabel}));
  const pages=Math.max(1,Math.ceil(entries.length/state.size));state.page=Math.min(state.page,pages);
  const start=(state.page-1)*state.size;const rows=entries.slice(start,start+state.size);
  $('tableCount').textContent=nf.format(groups.length)+' '+SECTIONS[state.section].plural+' · '+nf.format(state.filtered.length)+' registro(s) no recorte · Clique na UA para abrir os comentários.';
  $('tableBody').innerHTML=rows.length?rows.map(({group:g,detailIndex:index,name,unit,unitId})=>
    '<tr class="material-row" data-unit-id="'+esc(unitId||'')+'" data-detail="'+index+'"><td><span class="material-uc">'+highlightHTML(g.uc,state.query)+'</span></td><td><button type="button" class="material-link" data-unit-id="'+esc(unitId||'')+'" data-detail="'+index+'" aria-label="Abrir comentários de '+esc(name)+'"><span>'+highlightHTML(name,state.query)+'</span><span aria-hidden="true">↗</span></button></td><td>'+highlightHTML(unit||'Não informada',state.query)+'</td></tr>'
  ).join(''):'<tr><td colspan="3" class="empty-table">'+esc(state.records.length?'Nenhum material encontrado. Ajuste ou limpe os filtros.':state.sectionErrors[state.section]||'Não há registros sincronizados de '+SECTIONS[state.section].title.toLowerCase()+' nesta fonte para esta conta.')+'</td></tr>';
  renderCommentList(rows);
  $('pageInfo').textContent=entries.length?nf.format(start+1)+'–'+nf.format(start+rows.length)+' de '+nf.format(entries.length)+' linha(s)'+' · Página '+state.page+' de '+pages:'Nenhum material neste recorte';$('prev').disabled=state.page<=1;$('next').disabled=state.page>=pages;$('export').disabled=!state.filtered.length;
  $('tableView').hidden=state.view!=='table';$('commentList').hidden=state.view!=='list';
  document.querySelectorAll('[data-view]').forEach(b=>{const selected=b.dataset.view===state.view;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
}
function renderCommentList(rows){
  const byUC=new Map(),seen=new Set();rows.forEach(({group:g,detailIndex:index})=>{if(seen.has(index))return;seen.add(index);const key=g.ucId||g.uc;if(!byUC.has(key))byUC.set(key,{uc:g.uc,id:g.ucId,rows:[]});byUC.get(key).rows.push({g,index});});
  $('commentList').innerHTML=rows.length?[...byUC.values()].map(uc=>'<details class="uc-group" open><summary><span><strong>'+highlightHTML(uc.uc,state.query)+'</strong><small>'+(uc.id?'ID '+esc(uc.id):'Unidade Curricular')+'</small></span><span class="count-pill">'+uc.rows.length+' UA(s) nesta página</span></summary><div>'+uc.rows.map(({g,index})=>{const comment=previewComment(g);const type=materialWorkflow(g);return '<button class="comment-row" data-detail="'+index+'" aria-label="Ler os pareceres de '+esc(g.ua)+'"><span class="comment-row-main"><span class="comment-row-title">'+highlightHTML(g.ua,state.query)+'<span class="tag '+type+'">'+esc(uaLabels[type])+'</span></span><span class="comment-row-people">Revisor: '+esc(g.reviewers.join('; ')||'Não informado')+' · Especialista: '+esc(g.specialists.join('; ')||'Não informado')+'</span><span class="comment-row-preview">'+(comment?highlightHTML(comment.text,state.query):'Sem comentário registrado')+'</span></span><span class="comment-row-count"><b>'+g.comments.length+'</b> parecer(es)<span aria-hidden="true">→</span></span></button>';}).join('')+'</div></details>').join(''):'<div class="empty-table">'+esc(state.sectionErrors[state.section]||'Nenhum material encontrado neste recorte.')+'</div>';
}
function render(){const scope=baseScope();state.filtered=selectWorkflow(scope,state.status);renderFilters();renderCards(scope);renderChips();renderTable();}
function portalHistoryMarkup(note){
  return '<details class="previous-versions comment-history" data-history-id="'+esc(note.id)+'"><summary>Histórico de comentários · versão '+note.revision+'</summary><div class="comment-history-content" aria-live="polite"></div></details>';
}
function criterionCard(r,index){
  const previous=r.history||[];
  const versions=previous.length?'<details class="previous-versions"><summary>'+previous.length+' classificação(ões) anterior(es) da Monday</summary>'+previous.map(v=>'<div class="previous-version"><span class="tag '+v.status+'">'+esc(v.status==='rated'?v.classification:statusLabel[v.status])+'</span><small>'+esc(v.date?formatDate(v.date):'Data não informada')+' · '+esc(v.specialists.join('; ')||'Responsável não informado')+'</small><p>'+highlightHTML(v.comment||'Sem parecer registrado.',state.query)+'</p><small>Classificação: '+esc(v.classification||'Não informada')+'</small>'+(v.portal?'<small>Editado no painel por '+esc(v.portal.updated_name)+' · '+esc(formatDateTime(v.portal.updated_at))+'</small>'+portalHistoryMarkup(v.portal):'')+'</div>').join('')+'</details>':'';
  const portal=r.portal;
  const attribution=portal?'<small class="comment-attribution">'+(r.portalAddition?'Registrado':'Editado')+' no painel por <strong>'+esc(portal.updated_name)+'</strong> · '+esc(portal.updated_email)+' · '+esc(formatDateTime(portal.updated_at))+' · versão '+portal.revision+'</small>':'';
  const edit=commentSourceKey(r)?'<div class="comment-actions"><button type="button" class="btn secondary comment-edit" data-edit-comment="'+index+'"'+(!state.commentsReady?' disabled':'')+'>'+(r.comment?'Editar comentário':'Adicionar informação')+'</button></div>':'';
  const monday=portal&&!r.portalAddition?'<details class="previous-versions"><summary>Texto atual da fonte Monday</summary><p class="comment source-comment">'+esc(r.mondayComment||'Sem comentário na fonte.')+'</p><small>A avaliação e a classificação da fonte permanecem registradas.</small></details>':'';
  return '<article class="detail-criterion '+r.status+'"><div><h3>'+highlightHTML(r.criterion,state.query)+'</h3><span class="tag '+r.status+'">'+esc(r.portalAddition?'Comentário do painel':r.status==='rated'?r.classification:statusLabel[r.status])+'</span></div>'+(r.question&&r.question!==r.criterion?'<p class="question">'+esc(r.question)+'</p>':'')+'<p class="comment">'+highlightHTML(r.comment||'Sem comentário registrado para este critério.',state.query)+'</p>'+attribution+'<small>Classificação: '+esc(r.classification||'Não informada')+' · Responsável pela avaliação: '+esc(r.specialists.join('; ')||'Não informado')+(r.date?' · '+esc(formatDate(r.date)):'')+'</small><small>'+esc(r.sourceLabel||'Critérios da esteira — Monday')+'</small>'+edit+'<div data-editor-slot="'+index+'"></div>'+(portal?portalHistoryMarkup(portal):'')+monday+versions+'</article>';
}
function showDetails(index,unit=null){
  const selected=state.groups[index];if(selected)openMaterialDetails(selected.uaKey,unit);
}
function openMaterialDetails(key,unit=null){
  const records=state.records.filter(r=>r.uaKey===key);
  const selected=unit?records.filter(r=>(r.unitSourceId||r.uaId||r.ua)===unit):records;
  const g=groupUAs(selected)[0];if(!g)return;
  state.dialogKey=key;state.dialogUnit=unit;state.editor=null;
  $('dialogUA').textContent=unit?(g.displayUA||g.ua):g.ua;$('dialogUC').textContent=g.uc+(g.ucId?' · ID '+g.ucId:'');
  const missing=g.criteria.filter(r=>r.status==='bad'&&!r.comment);const s=g.summary;
  state.detailRecords=[...g.criteria].sort((a,b)=>({bad:0,good:1,rated:2,pending:3,comment:4}[a.status]-{bad:0,good:1,rated:2,pending:3,comment:4}[b.status])||a.criterion.localeCompare(b.criterion,'pt-BR',{numeric:true}));
  const canAdd=state.commentsReady&&state.detailRecords.some(commentSourceKey);
  $('dialogContent').innerHTML='<div class="detail-meta"><div><b>Esteira / Lote / Matriz</b>'+esc([g.track,g.batch,g.matrix,g.semester].filter(Boolean).join(' · '))+'</div><div><b>Unidade da UA</b>'+esc(g.unitLabel||'Não informada')+'</div><div><b>Especialista(s)</b>'+esc(g.specialists.join('; ')||'Não informado')+'</div><div><b>Revisor(es)</b>'+esc(g.reviewers.join('; ')||'Não informado')+'</div></div>'+(unit&&g.kind==='UC'?'<button type="button" class="text-button" data-show-full-uc>Ver todos os registros da UC</button>':'')+'<div class="drawer-summary"><strong>Registros e critérios deste material</strong><span>'+s.assessed+' de '+s.total+' avaliados</span><div><span class="tag good">'+s.good+' conforme(s)</span><span class="tag bad">'+s.bad+' inconformidade(s)</span>'+(s.pending?'<span class="tag pending">'+s.pending+' não avaliado(s)</span>':'')+(s.rated?'<span class="tag rated">'+s.rated+' por conceito</span>':'')+'</div>'+(g.materialStatuses.length?'<span>Status Monday: '+esc(g.materialStatuses.join('; '))+'</span>':'')+'</div><div class="add-comment-area"><div><strong>Comentários dos professores</strong><p>Acrescente informações ou edite os comentários. Cada versão fica registrada com autor e data.</p></div><button type="button" class="btn primary" data-add-comment'+(!canAdd?' disabled':'')+'>Adicionar comentário</button></div><div id="newCommentSlot"></div>'+(!state.commentsReady?'<p class="comment-setup-note">Não foi possível consultar os comentários do painel. Atualize os dados; se a edição ainda não foi instalada, solicite a atualização V6 da base.</p>':'')+'<p class="comment-scope-note">As edições são compartilhadas entre as contas institucionais autorizadas e salvas no painel. O original da Monday fica preservado no histórico.</p>'+(missing.length?'<p class="missing-comment-note"><strong>Inconformidade sem parecer</strong>'+esc(missing.map(r=>r.criterion).join('; '))+'</p>':'')+state.detailRecords.map((r,i)=>criterionCard(r,i)).join('');
  if(!$('detailDialog').open)$('detailDialog').showModal();document.body.classList.add('drawer-open');
}
function formatDateTime(value){if(/^\d{4}-\d{2}-\d{2}$/.test(value||''))return formatDate(value);const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'Data não informada';}
function setCommentBusy(busy){
  state.saving=busy;
  for(const b of $('detailDialog').querySelectorAll('button'))b.disabled=busy||(!state.commentsReady&&(b.matches('[data-edit-comment]')||b.matches('[data-add-comment]')));
  const input=$('commentBody');if(input)input.readOnly=busy;
  const submit=$('commentSave');if(submit)submit.textContent=busy?'Salvando…':'Salvar comentário';
}
function beginCommentEditor(index,addition=false){
  if(!state.commentsReady||state.saving)return;
  if(state.editor){$('commentBody')?.focus();toast('Salve ou cancele o comentário aberto antes de editar outro.');return;}
  const r=state.detailRecords[index];if(!r||!commentSourceKey(r))return;
  const portal=addition?null:r.portal;
  state.editor={sourceKey:commentSourceKey(r),mode:addition?'addition':portal?.mode||'source',
    id:portal?.id||(addition?crypto.randomUUID():null),revision:portal?.revision||0,
    sourceBody:r.mondayComment??r.comment??'',initial:addition?'':r.comment||''};
  const slot=addition?$('newCommentSlot'):$('dialogContent').querySelector('[data-editor-slot="'+index+'"]');
  slot.innerHTML='<form id="commentEditor" class="comment-editor"><label for="commentBody">'+(addition?'Novo comentário do professor':'Editar comentário')+'</label><textarea id="commentBody" rows="6" maxlength="20000" required placeholder="Escreva suas observações ou informações complementares…" aria-describedby="commentHelp commentEditorError"></textarea><p id="commentHelp">O texto anterior ficará no histórico. Salvo com o nome e o e-mail da conta conectada.</p><p id="commentEditorError" class="comment-editor-error" role="alert" hidden></p><div class="comment-editor-footer"><span id="commentChars">0 / 10.000</span><div><button type="button" class="btn secondary" data-cancel-comment>Cancelar</button><button id="commentSave" type="submit" class="btn primary">Salvar comentário</button></div></div></form>';
  $('commentBody').value=state.editor.initial;updateCommentChars();$('commentBody').focus();
}
function updateCommentChars(){if($('commentChars'))$('commentChars').textContent=nf.format([...$('commentBody').value].length)+' / 10.000';}
function cancelCommentEditor(){if(state.saving)return;const editor=$('commentEditor');const slot=editor?.parentElement;editor?.remove();state.editor=null;if(slot?.id==='newCommentSlot')$('detailDialog').querySelector('[data-add-comment]')?.focus();else slot?.previousElementSibling?.querySelector('button')?.focus();}
async function saveComment(event){
  event.preventDefault();if(state.saving||!state.editor||!state.user)return;
  const validated=validateComment($('commentBody').value);const errorBox=$('commentEditorError');
  if(validated.error){errorBox.textContent=validated.error;errorBox.hidden=false;return;}
  const editor={...state.editor},run=state.run,key=state.dialogKey,unit=state.dialogUnit;errorBox.hidden=true;setCommentBusy(true);
  try{
    const {data,error}=await client.rpc('nq_salvar_comentario',{p_source_key:editor.sourceKey,p_body:validated.body,
      p_comment_id:editor.id,p_expected_revision:editor.revision,p_mode:editor.mode,p_expected_source_body:editor.sourceBody});
    if(run!==state.run)return;if(error)throw error;
    const saved=data?.[0];if(!saved?.id)throw new Error('Resposta de gravação incompleta');
    state.portalComments=state.portalComments.filter(c=>c.id!==saved.id);state.portalComments.push(saved);
    state.sections=applyPortalComments(state.baseSections,state.portalComments);state.records=state.sections[state.section].records;
    setCommentBusy(false);state.editor=null;renderNavigation();render();openMaterialDetails(key,unit);
    toast('Comentário salvo. As versões anteriores continuam no histórico.');
    const updatedIndex=state.detailRecords.findIndex(r=>r.portal?.id===saved.id);
    const savedArticle=$('dialogContent').querySelector('[data-editor-slot="'+updatedIndex+'"]')?.closest('article');
    savedArticle?.scrollIntoView({block:'nearest'});savedArticle?.querySelector('[data-edit-comment]')?.focus({preventScroll:true});
  }catch(error){if(run===state.run){errorBox.textContent=commentError(error);errorBox.hidden=false;}}
  finally{if(run===state.run)setCommentBusy(false);}
}
async function loadCommentHistory(details){
  if(!details.open||details.dataset.loaded==='true'||details.dataset.loading==='true')return;
  const run=state.run,box=details.querySelector('.comment-history-content');details.dataset.loading='true';box.textContent='Carregando versões…';
  try{
    const rows=[];const size=200;
    for(let from=0;;from+=size){const {data,error}=await client.from('nq_comentarios_historico').select('*').eq('comment_id',details.dataset.historyId).order('revision',{ascending:false}).range(from,from+size-1).abortSignal(state.controller.signal);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<size)break;}
    if(run!==state.run||!details.isConnected)return;
    if(!rows.length)throw new Error('Histórico indisponível');
    box.innerHTML=rows.map(v=>'<div class="previous-version"><strong>'+(v.revision===0?'Original da Monday':'Versão '+v.revision+' · Painel')+'</strong><small>'+esc(v.author_name||v.author_email||'Autor não informado')+(v.author_email&&v.author_email!==v.author_name?' · '+esc(v.author_email):'')+' · '+esc(v.revision===0?(v.source_date?formatDateTime(v.source_date):'Data da fonte não informada'):formatDateTime(v.recorded_at))+'</small><p>'+esc(v.body||'Sem comentário registrado.')+'</p>'+(v.revision===0?'<small>Original preservado em '+esc(formatDateTime(v.recorded_at))+'</small>':'')+'</div>').join('');
    details.dataset.loaded='true';
  }catch{if(run===state.run&&details.isConnected){box.textContent='Não foi possível consultar o histórico. Feche e abra esta seção para tentar novamente.';}}
  finally{details.dataset.loading='false';}
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
  if(!isInstitutionalEmail(email,window.UA_CONFIG.allowedDomains)){$('loginError').textContent='Use seu e-mail @animaeducacao.com.br ou @ulife.com.br cadastrado no BI.';$('loginError').hidden=false;return;}
  $('loginSubmit').disabled=true;$('loginError').hidden=true;
  try{const {data,error}=await client.auth.signInWithPassword({email,password:$('password').value});$('password').value='';if(error)throw error;if(!data.user)throw new Error('Login não concluído');await activate(data.user);}catch(error){$('loginError').textContent=friendly(error);$('loginError').hidden=false;}finally{$('loginSubmit').disabled=false;}
});
$('showPassword').addEventListener('click',()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('showPassword').textContent=show?'Ocultar':'Mostrar';$('showPassword').setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');});
$('logout').addEventListener('click',async()=>{clearSensitive();state.user=null;await client.auth.signOut({scope:'local'});showLogin();});
$('refresh').addEventListener('click',load);
document.querySelectorAll('[data-filter]').forEach(select=>select.addEventListener('change',()=>{state.filters[select.dataset.filter]=select.value;state.page=1;render();}));
$('clearFilters').addEventListener('click',()=>{state.filters={};state.query='';state.status='all';state.commentsOnly=false;state.page=1;$('search').value='';$('commentsOnly').checked=false;if(state.loaded)render();});
document.querySelectorAll('[data-ua-status]').forEach(b=>b.addEventListener('click',()=>{if(!state.loaded)return;state.status=state.status===b.dataset.uaStatus?'all':b.dataset.uaStatus;state.page=1;render();}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;state.page=1;if(state.loaded)renderTable();}));
$('commentsOnly').addEventListener('change',()=>{state.commentsOnly=$('commentsOnly').checked;state.page=1;if(state.loaded)render();});
$('filterChips').addEventListener('click',e=>{const b=e.target.closest('[data-clear-filter]');if(!b)return;const key=b.dataset.clearFilter;if(key==='status')state.status='all';else if(key==='query'){state.query='';$('search').value='';}else if(key==='comments'){state.commentsOnly=false;$('commentsOnly').checked=false;}else delete state.filters[key];state.page=1;render();});
let searchTimer;$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=$('search').value;state.page=1;if(state.loaded)render();},150);});
$('prev').addEventListener('click',()=>{state.page--;renderTable();});$('next').addEventListener('click',()=>{state.page++;renderTable();});
for(const id of ['tableBody','commentList'])$(id).addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(b)showDetails(Number(b.dataset.detail),b.dataset.unitId||null);});
for(const id of ['closeDialog','closeDrawer'])$(id).addEventListener('click',()=>{$('detailDialog').close();});
$('detailDialog').addEventListener('close',()=>{document.body.classList.remove('drawer-open');state.editor=null;state.detailRecords=[];state.dialogKey=null;state.dialogUnit=null;});
$('detailDialog').addEventListener('cancel',e=>{if(state.saving)e.preventDefault();});
$('dialogContent').addEventListener('submit',e=>{if(e.target.id==='commentEditor')saveComment(e);});
$('dialogContent').addEventListener('input',e=>{if(e.target.id==='commentBody')updateCommentChars();});
$('dialogContent').addEventListener('toggle',e=>{if(e.target.matches('.comment-history'))loadCommentHistory(e.target);},true);
$('dialogContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||state.saving)return;if(b.hasAttribute('data-show-full-uc')){if(state.editor){$('commentBody')?.focus();toast('Salve ou cancele o comentário aberto antes de ver todos os registros.');}else openMaterialDetails(state.dialogKey);}else if(b.hasAttribute('data-add-comment'))beginCommentEditor(state.detailRecords.findIndex(commentSourceKey),true);else if(b.hasAttribute('data-edit-comment'))beginCommentEditor(Number(b.dataset.editComment));else if(b.hasAttribute('data-cancel-comment'))cancelCommentEditor();});
$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const r=e.target.getBoundingClientRect();if(!state.saving&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))e.target.close();}});
$('export').addEventListener('click',()=>{if(!state.loaded||!state.filtered.length)return;const url=URL.createObjectURL(new Blob([exportCSV(state.filtered)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Resultados_'+state.section+'_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Exportação concluída com o recorte selecionado.');});
document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>selectSection(b.dataset.section)));
function setTheme(theme){document.documentElement.dataset.theme=theme;$('themeToggle').setAttribute('aria-label',theme==='dark'?'Ativar tema claro':'Ativar tema escuro');$('themeToggle').title=theme==='dark'?'Tema claro':'Tema escuro';}
let initialTheme;try{initialTheme=localStorage.getItem('ua-results-theme');}catch{}setTheme(initialTheme==='dark'||initialTheme==='light'?initialTheme:window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light');
$('themeToggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(theme);try{localStorage.setItem('ua-results-theme',theme);}catch{}});
document.querySelectorAll('[data-release]').forEach(el=>{el.textContent=RELEASE.version+' · '+RELEASE.date;});
updateSectionLabels();renderNavigation();
start();
