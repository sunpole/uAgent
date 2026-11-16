import {readdirSync,readFileSync,statSync} from "node:fs";
import {validateRelease,cmpVersion,VERSION_RE,pathAt} from "./release-core.mjs";
const {current,patches}=validateRelease();
const names=readdirSync(pathAt("news")).filter(n=>/^\d{4}-\d{2}-\d{2}-.*\.md$/.test(n)).sort();
const allowed=new Set(["intro","test","release","patch","bugfix","docs","documentation","audit","ui","feature","warning","idea","roadmap","report","note"]);
let intros=0;
for(const name of names){
 const source=readFileSync(pathAt("news",name),"utf8");
 const match=/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
 if(!match)throw new Error("Нет YAML frontmatter: "+name);
 const meta=Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map(line=>{
  const m=/^([a-z_]+):\s*(.*?)\s*$/.exec(line);
  if(!m)throw new Error("Неподдерживаемый YAML: "+name+" / "+line);
  return [m[1],m[2].replace(/^['"]|['"]$/g,"")];
 }));
 for(const k of ["type","project","series","title","version","queued_at","repo_url","web_url","image","image_origin"])
  if(!meta[k])throw new Error("Отсутствует поле "+k+" в "+name);
 if(!allowed.has(meta.type)||meta.project!=="uAgent"||meta.series!=="uagent")throw new Error("Неверные проект, серия или тип");
 if(meta.type==="intro")intros++;
 if(!VERSION_RE.test(meta.version)||cmpVersion(meta.version,current.version)>0||
   !patches.some(p=>p.version===meta.version))throw new Error("Версия uNews не найдена в истории uAgent");
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(meta.queued_at)||Number.isNaN(Date.parse(meta.queued_at)))throw new Error("Некорректное время UTC");
 if(meta.image_origin!=="real")throw new Error("Нужен реальный скриншот, image_origin: real");
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp|gif)$/i.test(meta.image))throw new Error("Небезопасное имя изображения");
 const p=pathAt("news",meta.image);
 try{if(statSync(p).size===0)throw Error("Пустой файл");}catch{throw new Error("Нет изображения "+meta.image+" для "+name);}
 if(meta.repo_url!=="https://github.com/sunpole/uAgent"||meta.web_url!=="https://sunpole.github.io/uAgent/")throw new Error("Неверная ссылка");
 if(/(?:^|\n)\s*(?:Ссылка:|О проекте:|#[A-Za-zА-Яа-я]+.*#uNews)/im.test(match[2]))throw new Error("Ручной footer запрещён");
 if(/(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})/.test(source))throw new Error("Похоже на секрет в "+name);
}
if(names.length&&(!intros||names[0].includes("intro")===false))throw new Error("Первым постом uAgent должен быть intro");
console.log("uNews preflight: OK, готовых датированных записей: "+names.length+". Финальная проверка — в sunpole/uNews.");
