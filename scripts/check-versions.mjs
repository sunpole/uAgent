import {execFileSync} from "node:child_process";
import {validateRelease,cmpVersion} from "./release-core.mjs";
const {current,patches}=validateRelease();
for(let i=1;i<patches.length;i++)if(cmpVersion(patches[i-1].version,patches[i].version)<=0)throw new Error("Патчи не по порядку");
const base=process.env.GITHUB_BASE_REF;
if(base){
 if(!/^[\w./-]+$/.test(base))throw new Error("Неверное имя базовой ветки");
 let original;
 try{original=JSON.parse(execFileSync("git",["show","origin/"+base+":version.json"],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}));}
 catch{console.log("Исходная ветка без version.json: первичное внедрение");}
 if(original&&cmpVersion(current.version,original.version)<=0)throw new Error("Каждый PR должен повышать версию: "+original.version+" → "+current.version);
}
if(current.updated!==patches[0].date)throw new Error("Дата version.json не совпадает с новым патчем");
console.log("Согласованность версий: OK "+current.version);
