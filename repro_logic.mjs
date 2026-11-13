// 精确复现 10:42 现场：真实 payload + 人工点选推荐项 → 提交
// 目的：证明「点选是否真的写进 answers」。
import fs from "fs";
import path from "path";
import { createRequire } from "module";

// 复用 harness 的 fake 环境太重，这里直接抽取源码里的纯函数做单元级验证：
// 但 answers 写入靠 React 效应，纯函数测不到。改为驱动 harness：
// 我们 import harness 的 dist 不现实，故此处用最小 React 复算 toggle 语义。

// —— 复制自 src/index.tsx 的关键纯函数（保持同步）——
function optValue(o){ return (o&&typeof o==="object")?String(o.value??o.label??""):String(o); }
function optLabel(o){ return (o&&typeof o==="object")?String(o.label??o.value??""):String(o); }
function qType(q){ if(q&&q.type&&["single","multi","text"].includes(q.type))return q.type; if(q&&(q.options||[]).length)return q.multiple===true?"multi":"single"; return "text"; }
function questionRecommended(q){ if(!q||typeof q!=="object")return[]; const raw=q.recommended!==undefined?q.recommended:q.ai_recommended; if(raw==null)return[]; const list=Array.isArray(raw)?raw:[raw]; return list.map(x=>String(x??"" ).trim()).filter(s=>s.length>0); }
function isRecommendedOption(q,opt,recs){ if(!recs.length)return false; const v=optValue(opt),l=optLabel(opt); return recs.some(r=>r===v||r===l||r.replace(/^\s*推荐\s*[·:：\-]\s*/,"")===v||r.replace(/^\s*推荐\s*[·:：\-]\s*/,"")===l); }

const qs = JSON.parse(fs.readFileSync("/tmp/repro_payload.json","utf8"));
console.log("题目数:", qs.length);
for (let i=0;i<qs.length;i++){
  const q=qs[i], qt=qType(q), recs=questionRecommended(q);
  const opts=q.options||[];
  const recIdx = opts.findIndex(o=>isRecommendedOption(q,o,recs));
  console.log(`q${i}: 推断type=${qt} 推荐数=${recs.length} 推荐命中的选项下标=${recIdx} (应为某条)`);
  console.log(`     recommended[0][:40]=${(recs[0]||"").slice(0,40)}`);
  // 归一化：单选会把 optValue 存进 answers.value
  if (recIdx>=0){
    const norm = recs[0].replace(/^\s*推荐\s*[·:：\-]\s*/,"").trim();
    const hit = opts.find(o=>optValue(o)===recs[0]||optLabel(o)===recs[0])||opts.find(o=>optValue(o)===norm||optLabel(o)===norm);
    console.log(`     驱动归一化后 value=${hit?optValue(hit).slice(0,40):"(未命中)"}`);
  }
}
