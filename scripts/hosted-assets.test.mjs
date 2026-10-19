import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,sep} from 'node:path';
import {prepareHostedAssets} from './hosted-assets.mjs';
test('seeds private course files and preserves existing files and student work on restart',async()=>{
 const base=await mkdtemp(resolve(tmpdir(),'spolk-hosted-assets-')),source=resolve(base,'source'),destination=resolve(base,'persistent');
 try{
  await mkdir(resolve(source,'books/traveller'),{recursive:true});await writeFile(resolve(source,'books/traveller/source.pdf'),'%PDF-fixture');
  await prepareHostedAssets(source,destination);assert.equal(await readFile(resolve(destination,'books/traveller/source.pdf'),'utf8'),'%PDF-fixture');
  await writeFile(resolve(destination,'homework-uploads/student.txt'),'Submitted work');await writeFile(resolve(destination,'books/traveller/source.pdf'),'Existing copy');
  await prepareHostedAssets(source,destination);assert.equal(await readFile(resolve(destination,'homework-uploads/student.txt'),'utf8'),'Submitted work');assert.equal(await readFile(resolve(destination,'books/traveller/source.pdf'),'utf8'),'Existing copy');assert.ok((await stat(resolve(destination,'answer-uploads'))).isDirectory());
  await assert.rejects(prepareHostedAssets(source,source),/must differ/);
 }finally{if(base.startsWith(resolve(tmpdir())+sep))await rm(base,{recursive:true,force:true});}
});
