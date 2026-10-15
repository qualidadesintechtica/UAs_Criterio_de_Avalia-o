import {norm,text,names,materialKind} from './core.mjs';

export const UC_INDICATORS=['Recursos multimídia','Taxonomia da neuroaprendizagem','Fundamentação científica','Recursos inovadores','Atualização dos referenciais','Competências profissionais','Jornada integrada à UC'];

function unique(rows){
  if(!rows?.length)return null;
  const identities=new Set(rows.map(r=>[text(r.id_titulo),text(r.id_ua),norm(r.matriz_oferta),norm(r.esteira_producao),text(r.semestre_oferta)].join('|')));
  return identities.size===1?rows[0]:null;
}
function index(rows,field){const result=new Map();for(const r of rows){const key=norm(r[field]);if(!key)continue;if(!result.has(key))result.set(key,[]);result.get(key).push(r);}return result;}
function latest(rows){return [...rows].sort((a,b)=>stamp(b)-stamp(a)||text(b.id).localeCompare(text(a.id),undefined,{numeric:true}))[0];}
function stamp(row){for(const key of ['data_avaliacao_hora','data_avaliacao','updated_at','synced_at']){const n=Date.parse(row[key]||'');if(Number.isFinite(n))return n;}return 0;}

export function adaptMondayForms(assessments,comments,materials){
  const byID=index(materials,'monday_item_validacao'),byUA=index(materials,'id_ua'),byUC=index(materials,'id_titulo'),byName=index(materials,'titulo');
  const forms=new Map();for(const r of assessments){const key=text(r.monday_item_id);if(!forms.has(key)||stamp(r)>stamp(forms.get(key)))forms.set(key,r);}
  const commentsByForm=new Map();for(const r of comments){const key=text(r.monday_item_id);if(!commentsByForm.has(key))commentsByForm.set(key,[]);commentsByForm.get(key).push(r);}
  const eventIDs=new Set([...forms.keys(),...commentsByForm.keys()]);
  const all=[];
  for(const id of eventIDs){
    const assessment=forms.get(id);const notes=commentsByForm.get(id)||[];const r=assessment||latest(notes);
    const kind=materialKind(r);if(!kind)continue;
    const originalName=text(r.nome_item);const match=originalName.match(/^(.*)_(UA\d+|A[13])$/i);const codeUC=match?match[1]:originalName;const unit=match?match[2].toUpperCase():'';
    const material=unique(byID.get(norm(r.validacao_material_item_id)))||unique(byUA.get(norm(originalName)))||unique(byUC.get(norm(codeUC)))||(kind==='PE'?unique(byName.get(norm(originalName))):null);
    const ucId=text(material?.id_titulo||(match?codeUC:''));const uc=text(material?.titulo||codeUC||'UC não localizada');
    const matrix=text(material?.matriz_oferta||r.matriz_oferta);const track=text(material?.esteira_producao||r.esteira_producao)||'Não informada';const semester=text(material?.semestre_oferta||r.semestre_oferta);
    const uaId=kind==='UA'?text(material?.id_ua||originalName):kind==='BDQ'?originalName:ucId||codeUC;
    const ua=kind==='UC'?uc:kind==='PE'?originalName:text(material?.titulo_ua||unit||material?.item_name||originalName);
    const key=JSON.stringify([kind,ucId||codeUC,uaId,matrix,track,semester]);
    const common={kind,uaKey:key,uc,ucId,ua,uaId,parent:text(r.validacao_material_item_id),track,matrix,semester,specialists:names(material?.especialista_modelagem),reviewers:names(r.avaliador||material?.revisor_validador),date:text(r.data_avaliacao_hora||r.data_avaliacao),materialStatus:text(material?.status_validacao||r.conceito_final),sourceLabel:'Formulário de critérios — Monday',unmatched:!material,history:[],sourceEvent:id};
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
      all.push({...common,id:'comment:'+text(note.id),criterion:title,criterionKey:text(note.criterio_id||note.numero_criterio||note.parecer_id||note.id),unit,question:'',classification:'Resposta do critério não disponível nesta fonte',status:'comment',comment:text(note.parecer),commentOnly:true,date:text(note.data_avaliacao_hora||note.data_avaliacao||common.date),reviewers:names(note.avaliador||r.avaliador||material?.revisor_validador),_stamp:stamp(note)});added=true;
    }
    if(!added)all.push({...common,id:'form:'+id,criterion:'Registro do formulário',criterionKey:'metadata',unit,question:'',classification:text(r.conceito_final)||'Resultado do critério não sincronizado',status:'comment',comment:'',commentOnly:true,metadataOnly:true,_stamp:stamp(r)});
  }
  const grouped=new Map();
  for(const r of all){const key=JSON.stringify([r.uaKey,r.unit,r.criterionKey,r.commentOnly?'comment':'result']);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r);}
  const records=[];for(const list of grouped.values()){list.sort((a,b)=>b._stamp-a._stamp||b.id.localeCompare(a.id,undefined,{numeric:true}));const [current,...past]=list;records.push({...current,history:past});}
  return {records,lastSync:[...assessments,...comments].reduce((max,r)=>text(r.synced_at)>max?text(r.synced_at):max,'')};
}

export function mergeMondayData(sections,formData){
  for(const r of formData.records){
    const bucket=sections[r.kind];if(!bucket)continue;
    // Texto recebido não substitui uma classificação formal da esteira.
    if(r.commentOnly&&r.comment&&bucket.records.some(x=>x.uaKey===r.uaKey&&norm(x.criterion)===norm(r.criterion)&&text(x.comment)===r.comment))continue;
    bucket.records.push(r);
  }
  return sections;
}
