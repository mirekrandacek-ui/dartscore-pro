import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk('dist');
for(const file of files)assert.equal(hash(file),hash(path.join('ios/App/App/public',path.relative('dist',file))),file);
const assets=files.filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(f,'utf8')).join('\n');
for(const marker of ['winnerTeamId','stats-title-icon','stats-filter-row','stats-picker-pair','requestTrackingAuthorization'])assert.ok(assets.includes(marker),marker);
const project=fs.readFileSync('ios/App/App.xcodeproj/project.pbxproj','utf8');
assert.ok(project.includes('MARKETING_VERSION = 2.08;'));
assert.ok(project.includes('CURRENT_PROJECT_VERSION = 12;'));
console.log(`PASS: ${files.length} web files match iOS bundle; UI, ATT and 2.08 / 12 identity present`);
