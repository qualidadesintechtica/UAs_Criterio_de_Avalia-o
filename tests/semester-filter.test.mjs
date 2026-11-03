import test from 'node:test';
import assert from 'node:assert/strict';
import {filterRecords} from '../core.mjs';
import {filterOptions} from '../workflow.mjs';
const rows=[
 {uaKey:'a',semester:'2026.2',track:'A',batch:'L1',uc:'UC1',ua:'UA1',specialists:[],reviewers:[]},
 {uaKey:'b',semester:'2027.1',track:'A',batch:'L1',uc:'UC2',ua:'UA2',specialists:[],reviewers:[]},
 {uaKey:'c',semester:'',track:'B',batch:'L2',uc:'UC3',ua:'UA3',specialists:[],reviewers:[]}
];
test('filtro semestre respeita seleção',()=>assert.deepEqual(filterRecords(rows,{semester:'2027.1'}).map(r=>r.uaKey),['b']));
test('semestre combina com esteira',()=>assert.deepEqual(filterRecords(rows,{semester:'2027.1',track:'B'}),[]));
test('semestre sem informação é filtrável',()=>assert.deepEqual(filterRecords(rows,{semester:'__missing__'}).map(r=>r.uaKey),['c']));
test('opções de semestre respeitam esteira',()=>assert.deepEqual(filterOptions({UA:{records:rows}},'semester',{track:'B'}).values,[]));
