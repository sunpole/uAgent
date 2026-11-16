import {execFileSync} from "node:child_process";
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {posix} from "node:path";
import {pathAt} from "./release-core.mjs";
import {normalizeLineEndings} from "./line-endings.mjs";

const check=process.argv.includes("--check");
const raw=execFileSync("git",["ls-files","--cached","--others","--exclude-standard"],{cwd:pathAt(),encoding:"utf8"});
const excluded=new Set(["docs/index.html","docs/repo-graph.json","docs/REPO_MAP.md"]);
const extensions=/\.(?:mjs|js|ts|tsx|jsx|json|md|html|css|yml|yaml)$/;
const fileList=[...new Set(raw.split(/\r?\n/).filter(Boolean).map(s=>s.replaceAll("\\","/")))]
 .filter(f=>extensions.test(f)&&!excluded.has(f)&&!f.split("/").some(x=>x.startsWith(".env")||x==="node_modules"||x===".git"||x===".cache")).sort();
const known=new Set(fileList),edges=[];
function resolve(from,target){
 if(!target.startsWith("."))return null;
 target=decodeURIComponent(target.split(/[?#]/)[0]);
 const base=posix.normalize(posix.join(posix.dirname(from),target));
 if(base.startsWith("../")||base.startsWith("/"))return null;
 for(const candidate of [base,base+".mjs",base+".js",base+".ts",base+".tsx",base+".json",base+".md",posix.join(base,"index.js"),posix.join(base,"index.mjs")])
  if(known.has(candidate))return candidate;
 return null;
}
for(const file of fileList){
 let content;try{content=readFileSync(pathAt(file),"utf8");}catch{continue;}
 const refs=[];
 if(/\.(mjs|js|ts|tsx|jsx)$/.test(file)){
  const re=/(?:\bfrom\s*|\bimport\s*\(|\brequire\s*\()\s*["'](\.[^"']+)["']/g;
  for(const m of content.matchAll(re))refs.push(m[1]);
 }
 if(file.endsWith(".md")){
  for(const m of content.matchAll(/\]\((\.[^)]+)\)/g))refs.push(m[1]);
 }
 if(file.endsWith(".html")){
  for(const m of content.matchAll(/\b(?:href|src)=["'](\.[^"']+)["']/g))refs.push(m[1]);
 }
 for(const ref of new Set(refs)){
  const target=resolve(file,ref);
  if(target&&target!==file)edges.push({from:file,to:target,kind:"relative-reference"});
 }
}
edges.sort((a,b)=>a.from.localeCompare(b.from,"en")||a.to.localeCompare(b.to,"en"));
const inbound=new Map(fileList.map(f=>[f,0]));
for(const edge of edges)inbound.set(edge.to,(inbound.get(edge.to)||0)+1);
const graph={schema:"uagent-file-graph-v1",scope:"tracked-and-unignored-files",precision:"file-relative-references-only-not-AST-or-call-graph",
 nodes:fileList.map(path=>({path,inbound:inbound.get(path)})),edges};
const json=JSON.stringify(graph,null,2)+"\n";
const summary=["# uAgent — карта репозитория","","Эта карта генерируется из файлов проекта: **не** полноценный AST/граф вызовов. Для каждого изменения агент обязан читать актуальные файлы.","",
"Файлов: "+fileList.length+" · подтверждённых относительных ссылок: "+edges.length,"",
"## Самые связанные файлы","",...graph.nodes.filter(n=>n.inbound).sort((a,b)=>b.inbound-a.inbound||a.path.localeCompare(b.path,"en")).slice(0,15).map(n=>"- "+n.path+" — входящих ссылок: "+n.inbound),
"","## Дерево файлов","",...fileList.map(f=>"- "+"  ".repeat(f.split("/").length-1)+f),
"","## Проверенные локальные связи","",...edges.map(e=>"- "+e.from+" → "+e.to),
"","Расширение до Tree-sitter/SCIP: [CODE_GRAPH.md](CODE_GRAPH.md).",""].join("\n");
let fail=0;
for(const [p,value] of [["docs/repo-graph.json",json],["docs/REPO_MAP.md",summary]]){
 const target=pathAt(p);
 if(check){if(!existsSync(target)||normalizeLineEndings(readFileSync(target,"utf8"))!==normalizeLineEndings(value)){console.error("Карта устарела: "+p);fail++;}}
 else {writeFileSync(target,value,"utf8");console.log("Обновлено: "+p);}
}
if(fail)process.exit(1);
if(check)console.log("Файловый граф: OK");
