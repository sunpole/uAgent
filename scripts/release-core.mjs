import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
export const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
export const pathAt=(...parts)=>join(ROOT,...parts);
export const readJson=(file)=>JSON.parse(readFileSync(pathAt(file),"utf8"));
export const VERSION_RE=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function cmpVersion(a,b){
 const aa=a.split(".").map(Number),bb=b.split(".").map(Number);
 for(let i=0;i<3;i++)if(aa[i]!==bb[i])return Math.sign(aa[i]-bb[i]);
 return 0;
}
export function bumpPatch(v){
 if(!VERSION_RE.test(v))throw new Error("Неверный SemVer: "+v);
 const p=v.split(".").map(Number);p[2]++;return p.join(".");
}
export function loadPatches(){
 return readdirSync(pathAt("patches")).filter(x=>/^\d+\.\d+\.\d+\.json$/.test(x)).map(name=>{
 const p=readJson(join("patches",name));
 if(name!==p.version+".json"||!VERSION_RE.test(p.version))throw new Error("Версия не совпадает: "+name);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||Number.isNaN(Date.parse(p.date+"T00:00:00Z")))throw new Error("Неверная дата: "+name);
 if(!["foundation","website","feature","fix","docs","release","audit"].includes(p.type))throw new Error("Неверный тип: "+name);
 if(typeof p.title!=="string"||!p.title.trim()||typeof p.summary!=="string"||!p.summary.trim()||
 !Array.isArray(p.tags)||p.tags.some(t=>typeof t!=="string"||!t.trim())||
 !Array.isArray(p.details)||p.details.some(d=>typeof d!=="string")||
 typeof p.verified!=="boolean")throw new Error("Неверная структура: "+name);
 return p;
 }).sort((a,b)=>-cmpVersion(a.version,b.version));
}
export function validateRelease(){
 const current=readJson("version.json"),patches=loadPatches();
 if(!VERSION_RE.test(current.version)||!patches.length||patches[0].version!==current.version)throw new Error("version.json должен соответствовать новейшему патчу");
 return {current,patches};
}
export const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
