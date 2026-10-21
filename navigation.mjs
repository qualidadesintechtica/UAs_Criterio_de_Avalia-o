import {materialKind,buildRecords} from './core.mjs?v=v6-6-9-filtros-pessoas-20261021';

export const SECTIONS={
  PE:{label:'Planilha de entrada',title:'Planilhas de entrada',plural:'planilhas',itemLabel:'Planilha',allLabel:'Todas as planilhas',tableTitle:'Avaliações das planilhas de entrada'},
  UA:{label:'UA',title:'Unidades de aprendizagem',plural:'UAs',itemLabel:'UA',allLabel:'Todas as UAs',tableTitle:'Avaliações das UAs'},
  BDQ:{label:'BDQ',title:'Bancos de questões',plural:'BDQs',itemLabel:'BDQ',allLabel:'Todos os BDQs',tableTitle:'Avaliações dos bancos de questões'},
  UC:{label:'UC',title:'Unidades curriculares',plural:'UCs',itemLabel:'Material',allLabel:'Todas as UCs',tableTitle:'Avaliações das unidades curriculares'}
};

export function buildSections(criteria,materials){
  const source=Object.fromEntries(Object.keys(SECTIONS).map(key=>[key,{criteria:[],materials:[]}]));
  for(const row of criteria){const kind=materialKind(row);if(kind)source[kind].criteria.push(row);}
  for(const row of materials){const kind=materialKind(row);if(kind)source[kind].materials.push(row);}
  return Object.fromEntries(Object.keys(SECTIONS).map(key=>[key,buildRecords(source[key].criteria,source[key].materials,key)]));
}
