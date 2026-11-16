import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {validateRelease,escapeHtml,pathAt} from "./release-core.mjs";
const {current,patches}=validateRelease(),check=process.argv.includes("--check");
const types={foundation:"Основа",website:"Сайт",feature:"Функция",fix:"Исправление",docs:"Документация",release:"Релиз",audit:"Аудит"};
const tags=new Map();
for(const p of patches)for(const t of new Set(p.tags))tags.set(t,(tags.get(t)||0)+1);
const cloud=[...tags].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"ru")).map(([t,n])=>
 '<button type="button" class="tag" data-tag="'+escapeHtml(t.toLocaleLowerCase("ru"))+'" aria-pressed="false">#'+escapeHtml(t)+' <small>'+n+'</small></button>').join("\n");
const cards=patches.map(p=>{
 const search=[p.version,p.title,p.summary,p.type,...p.tags,...p.details].join(" ").toLocaleLowerCase("ru");
 return '<article class="patch-card" data-search="'+escapeHtml(search)+'" data-tags="'+escapeHtml(p.tags.join("|").toLocaleLowerCase("ru"))+
 '" data-type="'+escapeHtml(p.type)+'"><div class="patch-top"><span class="patch-ver">v'+escapeHtml(p.version)+'</span>'+
 '<span class="patch-type">'+escapeHtml(types[p.type])+'</span><time datetime="'+escapeHtml(p.date)+'">'+escapeHtml(p.date)+'</time>'+
 '<span class="'+(p.verified?'confirmed':'draft')+'">'+(p.verified?'Подтверждено':'Подготовка / проверка')+'</span></div>'+
 '<h3>'+escapeHtml(p.title)+'</h3><p>'+escapeHtml(p.summary)+'</p>'+
 '<div class="patch-tags">'+p.tags.map(t=>'<span>#'+escapeHtml(t)+'</span>').join("")+'</div>'+
 (p.details.length?'<details><summary>Что изменилось</summary><ul>'+p.details.map(d=>'<li>'+escapeHtml(d)+'</li>').join("")+'</ul></details>':'')+'</article>';
}).join("\n");
let page=readFileSync(pathAt("site","index.template.html"),"utf8");
for(const [k,v] of Object.entries({"{{VERSION}}":escapeHtml(current.version),"{{PATCH_COUNT}}":String(patches.length),"{{PATCHES}}":cards,"{{TAG_CLOUD}}":cloud,"{{LAST_UPDATED}}":escapeHtml(current.updated)}))page=page.replaceAll(k,v);
if(/\{\{[A-Z_]+\}\}/.test(page))throw new Error("Остались маркеры шаблона");
const tick=String.fromCharCode(96);
const versionMd="# uAgent — версия\n\n**Текущая глобальная версия:** "+tick+current.version+tick+"\n\n**Канал:** "+current.channel+"\n\n**Обновлено:** "+current.updated+"\n\nЕдинственный источник: [version.json](version.json).\nИстория: [patches/](patches/) и [сайт](https://sunpole.github.io/uAgent/#updates).\n";
let readme=readFileSync(pathAt("README.md"),"utf8");
const start="<!-- UA_VERSION_START -->",end="<!-- UA_VERSION_END -->";
const a=readme.indexOf(start),b=readme.indexOf(end);
if(a<0||b<0||b<a)throw new Error("В README отсутствуют маркеры версии");
readme=readme.slice(0,a+start.length)+"\n**Глобальная версия: v"+current.version+"** · [История](https://sunpole.github.io/uAgent/#updates)\n"+readme.slice(b);
let errors=0;
for(const [file,content] of [["docs/index.html",page],["version.md",versionMd],["README.md",readme]]){
 const target=pathAt(file);
 if(check){if(!existsSync(target)||readFileSync(target,"utf8")!==content){console.error("Неактуально: "+file);errors++;}}
 else{writeFileSync(target,content,"utf8");console.log("Обновлено: "+file);}
}
if(errors)process.exit(1);
if(check)console.log("Версия и сайт согласованы: v"+current.version);
