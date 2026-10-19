import {access,cp,mkdir,realpath} from 'node:fs/promises';
import {resolve} from 'node:path';

// Seed private storage without replacing existing teacher uploads or source files.
export async function prepareHostedAssets(source,destination){
 const from=resolve(source),to=resolve(destination);
 if(from===to)throw new Error('Course source and persistent storage must differ.');
 await access(resolve(from,'books/traveller/source.pdf'));
 await mkdir(to,{recursive:true});
 if(await realpath(from)===await realpath(to))throw new Error('Course source and persistent storage must differ.');
 await cp(from,to,{recursive:true,force:false,errorOnExist:false});
 await mkdir(resolve(to,'homework-uploads'),{recursive:true});
 await mkdir(resolve(to,'answer-uploads'),{recursive:true});
}
