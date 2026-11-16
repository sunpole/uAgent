import test from "node:test";
import assert from "node:assert/strict";
import {bumpPatch,cmpVersion,validateRelease,escapeHtml} from "../scripts/release-core.mjs";
import {normalizeLineEndings} from "../scripts/line-endings.mjs";
test("SemVer patch increment",()=>{
 assert.equal(bumpPatch("0.2.0"),"0.2.1");
 assert.equal(bumpPatch("1.4.9"),"1.4.10");
 assert.throws(()=>bumpPatch("v1.0"));
});
test("SemVer ordering is numeric",()=>{
 assert.equal(cmpVersion("0.10.0","0.9.9"),1);
 assert.equal(cmpVersion("1.0.0","1.0.0"),0);
 assert.equal(cmpVersion("0.2.0","0.3.0"),-1);
});
test("HTML escaping protects user-authored patch fields",()=>{
 assert.equal(escapeHtml('<img src="x" onerror="y">&'),"&lt;img src=&quot;x&quot; onerror=&quot;y&quot;&gt;&amp;");
});
test("global version matches newest patch",()=>{
 const {current,patches}=validateRelease();
 assert.equal(current.version,patches[0].version);
 assert.equal(new Set(patches.map(p=>p.version)).size,patches.length);
 assert.ok(patches.length>=2);
});

test("Windows CRLF and Unix LF compare as equivalent",()=>{
 assert.equal(normalizeLineEndings("Строка 1\r\nСтрока 2\r\n"),"Строка 1\nСтрока 2\n");
 assert.equal(normalizeLineEndings("A\rB\r\nC\n"),"A\nB\nC\n");
 assert.notEqual(normalizeLineEndings("A\nB"),normalizeLineEndings("A\nC"));
});
