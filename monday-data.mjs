import {norm,text,names,materialKind,materialGroupKey,unitLabel,entryValidationId,bdqAssessmentType} from './core.mjs?v=v6-6-8-comentarios-download-20261021';

export const UC_INDICATORS=['Recursos multimídia','Taxonomia da neuroaprendizagem','Fundamentação científica','Recursos inovadores','Atualização dos referenciais','Competências profissionais','Jornada integrada à UC'];

function unique(rows){
  if(!rows?.length)return null;
  const identities=new Set(rows.map(r=>[text(r.id_titulo),text(r.id_ua),norm(r.matriz_oferta),norm(r.esteira_producao),text(r.semestre_oferta),norm(r.bloco||r.lote),entryValidationId(r),materialKind(r)==='BDQ'?text(r.monday_item_validacao)||text(r.chave_material):''].join('|')));
  return identities.size===1?rows[0]:null;
}
function courseContext(rows){
  if(!rows?.length)return null;
  const ids=new Set(rows.map(r=>text(r.id_titulo)).filter(Boolean));
  if(ids.size!==1||rows.some(r=>!text(r.id_titulo)))return null;
  const common=field=>{const values=new Set(rows.map(r=>text(r[field])));return values.size===1?[...values][0]:'';};
  return {id_titulo:[...ids][0],titulo:common('titulo'),esteira_producao:common('esteira_producao'),
    matriz_oferta:common('matriz_oferta'),semestre_oferta:common('semestre_oferta'),bloco:common('bloco'),
    contextOnly:true};
}
function index(rows,field){const result=new Map();for(const r of rows){const key=norm(r[field]);if(!key)continue;if(!result.has(key))result.set(key,[]);result.get(key).push(r);}return result;}
function latest(rows){return [...rows].sort((a,b)=>stamp(b)-stamp(a)||text(b.id).localeCompare(text(a.id),undefined,{numeric:true}))[0];}
function stamp(row){for(const key of ['data_avaliacao_hora','data_avaliacao','updated_at','synced_at']){const n=Date.parse(row[key]||'');if(Number.isFinite(n))return n;}return 0;}
function formKind(row){
  const kind=materialKind(row);if(kind)return kind;
  const type=norm(row.tipo_formulario).replace(/\s+/g,' ');
  return /\b(?:planilhas? de entrada|plano de producao)\b/.test(type)?'PE':null;
}

function entryPlanMaterial(row,code,byID,byUA,byUC,byName){
  const pick=(rows,checkOffer=false)=>{
    const candidates=(rows||[]).filter(m=>materialKind(m)==='PE'&&(!checkOffer||
      [['matriz_oferta',row.matriz_oferta],['esteira_producao',row.esteira_producao],
        ['semestre_oferta',row.semestre_oferta],['bloco',row.bloco||row.lote]]
        .every(([field,value])=>!text(value)||norm(m[field])===norm(value))));
    // Uma UC pode ter mais de um plano, lote ou oferta. Só um vínculo inequívoco
    // permite herdar o status do material e reuni-lo ao formulário.
    const sources=new Set(candidates.map(m=>text(m.monday_item_validacao)||text(m.chave_material)));
    return sources.size<=1?unique(candidates):null;
  };
  return pick(byID.get(norm(row.validacao_material_item_id)))||
    pick(byUA.get(norm(row.nome_item)),true)||pick(byUC.get(norm(code)),true)||
    pick(byName.get(norm(row.nome_item)),true);
}

export function adaptMondayForms(assessments,comments,materials){
  const byID=index(materials,'monday_item_validacao'),byUA=index(materials,'id_ua'),byUC=index(materials,'id_titulo'),byName=index(materials,'titulo');
  const forms=new Map();for(const r of assessments){const key=text(r.monday_item_id);if(!forms.has(key)||stamp(r)>stamp(forms.get(key)))forms.set(key,r);}
  const commentsByForm=new Map();for(const r of comments){const key=text(r.monday_item_id);if(!commentsByForm.has(key))commentsByForm.set(key,[]);commentsByForm.get(key).push(r);}
  const eventIDs=new Set([...forms.keys(),...commentsByForm.keys()]);
  const all=[];
  for(const id of eventIDs){
    const assessment=forms.get(id);const notes=commentsByForm.get(id)||[];const r=assessment||latest(notes);
    const kind=formKind(r)||notes.map(formKind).find(Boolean);if(!kind)continue;
    const originalName=text(r.nome_item);const match=originalName.match(/^(.*)_(UA\d+|A[123]|PP)$/i);const codeUC=match?match[1]:originalName;const unit=match?match[2].toUpperCase():'';
    const requestedBankType=kind==='BDQ'?bdqAssessmentType(r):'';
    const bankMatches=rows=>(rows||[]).filter(m=>materialKind(m)==='BDQ'&&(!requestedBankType||bdqAssessmentType(m)===requestedBankType));
    const material=kind==='PE'
      ?entryPlanMaterial(r,codeUC,byID,byUA,byUC,byName)||courseContext(byUC.get(norm(codeUC)))||courseContext(byName.get(norm(originalName)))
      :kind==='BDQ'?unique(bankMatches(byID.get(norm(r.validacao_material_item_id))))||unique(bankMatches(byUA.get(norm(originalName))))||unique(bankMatches(byUC.get(norm(codeUC))).filter(m=>!text(m.id_ua)))||courseContext(byUC.get(norm(codeUC)))
      :unique(byID.get(norm(r.validacao_material_item_id)))||unique(byUA.get(norm(originalName)))||unique((byUC.get(norm(codeUC))||[]).filter(m=>materialKind(m)===kind&&!text(m.id_ua)))||courseContext(byUC.get(norm(codeUC)));
    const linkedPlan=kind==='PE'&&material&&!material.contextOnly;
    const validationItemId=linkedPlan?entryValidationId(material):'';
    const ucId=text(material?.id_titulo||(match?codeUC:''));const uc=text(material?.titulo||codeUC||'UC não localizada');
    const matrix=text(material?.matriz_oferta||r.matriz_oferta);const track=text(material?.esteira_producao||r.esteira_producao)||'Não informada';const semester=text(material?.semestre_oferta||r.semestre_oferta);
    const uaId=kind==='UA'?text(material?.id_ua||originalName):kind==='BDQ'?originalName:linkedPlan?text(material.id_ua):ucId||codeUC;
    const ua=kind==='UC'?uc:kind==='PE'?originalName:text(material?.titulo_ua||originalName||material?.item_name);
    const displayUA=kind==='UC'&&/^UA\d+$/i.test(unit)?text(material?.titulo_ua)||originalName:ua;
    const batch=text(material?.bloco||r.bloco||r.lote);
    const parent=text(linkedPlan?material.monday_item_validacao:kind==='BDQ'&&material&&!material.contextOnly?material.monday_item_validacao||r.validacao_material_item_id:r.validacao_material_item_id);
    const key=linkedPlan
      ?materialGroupKey(kind,text(material.id_titulo)||parent||uaId,uaId||parent||text(material.chave_material),matrix,track,semester,batch,validationItemId)
      :materialGroupKey(kind,ucId||codeUC,uaId,matrix,track,semester,batch);
    const common={kind,uaKey:key,validationItemId,uc,ucId,ua,uaId,parent,track,matrix,semester,batch,displayUA,unitSourceId:kind==='UC'?originalName:uaId,unitLabel:unitLabel({...material,id_ua:kind==='UC'?originalName:uaId}),materialKey:text(material?.chave_material),specialists:names(material?.especialista_modelagem),reviewers:kind==='BDQ'?names([r.avaliador,material?.revisor_validador]):names(r.avaliador||material?.revisor_validador),assignedReviewers:names(material&&!material.contextOnly?material.revisor_validador:''),managers:names(material&&!material.contextOnly?material.gestor_validacao_nq:''),assessmentType:kind==='BDQ'?bdqAssessmentType(material)||bdqAssessmentType(r):'',date:text(r.data_avaliacao_hora||r.data_avaliacao),materialStatus:text(material?.status_validacao||r.conceito_final),sourceLabel:'Formulário de critérios — Monday',unmatched:!material,history:[],sourceEvent:id};
    let added=false;
    if(kind==='UC'&&assessment){
      for(let i=1;i<=7;i++){
        const classification=text(assessment['indicador_'+i]);
        const numeric=assessment['indicador_'+i+'_score'];const score=numeric!==null&&numeric!==undefined&&text(numeric)!==''&&Number.isFinite(Number(numeric))?Number(numeric):null;
        all.push({...common,id:'form:'+id+':I'+i,criterion:(unit?unit+' · ':'')+'I'+i+' — '+UC_INDICATORS[i-1],criterionKey:'I'+i,unit,question:'Avaliação da unidade curricular'+(unit?' referente à '+unit:''),classification:classification||'Classificação não sincronizada',status:classification?'rated':'pending',score,comment:'',commentOnly:false,_stamp:stamp(assessment)});added=true;
      }
    }
    for(const note of notes){
      const title=text(note.criterio_titulo||note.parecer_titulo)||(note.numero_criterio?'Critério '+note.numero_criterio:'Parecer registrado');
      all.push({...common,id:'comment:'+text(note.id),criterion:title,criterionKey:text(note.criterio_id||note.numero_criterio||note.parecer_id||note.id),unit,question:'',classification:'Resposta do critério não disponível nesta fonte',status:'comment',comment:text(note.parecer),commentOnly:true,date:text(note.data_avaliacao_hora||note.data_avaliacao||common.date),reviewers:kind==='BDQ'?names([note.avaliador,r.avaliador,material?.revisor_validador]):names(note.avaliador||r.avaliador||material?.revisor_validador),_stamp:stamp(note)});added=true;
    }
    if(!added)all.push({...common,id:'form:'+id,criterion:'Registro do formulário',criterionKey:'metadata',unit,question:'',classification:text(r.conceito_final)||'Resultado do critério não sincronizado',status:'comment',comment:'',commentOnly:true,metadataOnly:true,_stamp:stamp(r)});
  }
  const grouped=new Map();
  for(const r of all){const key=JSON.stringify([r.uaKey,r.unit,r.criterionKey,r.commentOnly?'comment':'result',r.kind==='PE'&&r.commentOnly?r.id:'']);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r);}
  const records=[];for(const list of grouped.values()){list.sort((a,b)=>b._stamp-a._stamp||b.id.localeCompare(a.id,undefined,{numeric:true}));const [current,...past]=list;records.push({...current,history:past});}
  return {records,lastSync:[...assessments,...comments].reduce((max,r)=>text(r.synced_at)>max?text(r.synced_at):max,'')};
}

export function mergeMondayData(sections,formData){
  for(const r of formData.records){
    const bucket=sections[r.kind];if(!bucket)continue;
    // Texto recebido não substitui uma classificação formal da esteira.
    if(r.kind==='PE'?bucket.records.some(x=>x.id===r.id):r.commentOnly&&r.comment&&bucket.records.some(x=>x.uaKey===r.uaKey&&norm(x.criterion)===norm(r.criterion)&&text(x.comment)===r.comment))continue;
    bucket.records.push(r);
  }
  return sections;
}
