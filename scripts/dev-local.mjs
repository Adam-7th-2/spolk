import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const port=process.env.PORT||"3001";
console.log(`Starting the offline academy at http://127.0.0.1:${port}/login`);
const child=spawn(process.execPath,[resolve(root,"node_modules/next/dist/bin/next"),"dev","--hostname","127.0.0.1","--port",port],{
 cwd:resolve(root,"apps/web"),stdio:"inherit",env:{...process.env,SPOLK_DATA_MODE:"local",SPOLK_NEXT_OUTPUT:process.env.SPOLK_NEXT_OUTPUT||".next-local",NEXT_PUBLIC_SITE_URL:`http://127.0.0.1:${port}`,NEXT_TELEMETRY_DISABLED:"1"},
});
child.on("error",error=>{console.error(error.message);process.exitCode=1;});
child.on("exit",code=>{process.exitCode=code||0;});
process.on("SIGINT",()=>child.kill("SIGINT"));
process.on("SIGTERM",()=>child.kill("SIGTERM"));
