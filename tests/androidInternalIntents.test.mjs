import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const path=new URL('../app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java',import.meta.url);
const source=await readFile(path,'utf8');

test('internal dartscorepro analytics/ad intent resolves only within own app package',()=>{
  assert.match(source,/if \("dartscorepro"\.equals\(scheme\)\) \{\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*startActivity\(new Intent\(Intent\.ACTION_VIEW, uri\)\.setPackage\(getPackageName\(\)\)\);/);
});
test('regular external HTTP/HTTPS links remain unrestricted',()=>{
  assert.match(source,/if \("http"\.equals\(scheme\) \|\| "https"\.equals\(scheme\)\) \{\s*startActivity\(new Intent\(Intent\.ACTION_VIEW, uri\)\);/);
});
