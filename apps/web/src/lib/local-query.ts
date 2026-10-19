import type {Transaction} from "@electric-sql/pglite";
import type {openLocalStore} from "./local-store";

type Store=Awaited<ReturnType<typeof openLocalStore>>;
type Row=Record<string,unknown>;
type Reply={data:unknown;error:null|{code:string;message:string};count?:number};
export function identifier(value:string){if(!/^[a-z_][a-z0-9_]*$/i.test(value))throw new Error("Invalid database identifier");return `"${value}"`;}
const normalize=(value:unknown):unknown=>JSON.parse(JSON.stringify(value,(_,item)=>typeof item==="bigint"?Number(item):item));
function failure(error:unknown):Reply{const detail=error as {code?:string;message?:string};return {data:null,error:{code:detail.code||"LOCAL_QUERY_ERROR",message:detail.message||"Local database request failed"}};}

// Keeps the small query surface used by the application, executing real SQL and RLS.
export class LocalQuery implements PromiseLike<Reply>{
 private columns="*";
 private action="select";
 private rows:Row[]=[];
 private filters:{column:string;op:string;value:unknown}[]=[];
 private orders:{column:string;ascending:boolean}[]=[];
 private maximum?:number;
 private conflict?:string;
 private ignore=false;
 private returning=false;
 private cardinality="many";
 constructor(private store:Store,private accountId:string|null,private table:string){}
 select(columns="*"){this.columns=columns;this.returning=true;return this;}
 insert(value:Row|Row[]){this.action="insert";this.rows=Array.isArray(value)?value:[value];return this;}
 upsert(value:Row|Row[],options?:{onConflict?:string;ignoreDuplicates?:boolean}){this.action="upsert";this.rows=Array.isArray(value)?value:[value];this.conflict=options?.onConflict;this.ignore=Boolean(options?.ignoreDuplicates);return this;}
 update(value:Row){this.action="update";this.rows=[value];return this;}
 delete(){this.action="delete";return this;}
 eq(column:string,value:unknown){this.filters.push({column,op:"=",value});return this;}
 neq(column:string,value:unknown){this.filters.push({column,op:"<>",value});return this;}
 gt(column:string,value:unknown){this.filters.push({column,op:">",value});return this;}
 gte(column:string,value:unknown){this.filters.push({column,op:">=",value});return this;}
 lt(column:string,value:unknown){this.filters.push({column,op:"<",value});return this;}
 lte(column:string,value:unknown){this.filters.push({column,op:"<=",value});return this;}
 in(column:string,value:unknown[]){this.filters.push({column,op:"in",value});return this;}
 is(column:string,value:null|boolean){this.filters.push({column,op:"is",value});return this;}
 not(column:string,operator:string,value:null){if(operator!=="is"||value!==null)throw new Error("Unsupported local predicate");this.filters.push({column,op:"is not",value});return this;}
 order(column:string,options?:{ascending?:boolean}){this.orders.push({column,ascending:options?.ascending!==false});return this;}
 limit(count:number){this.maximum=Math.max(0,Math.min(10000,Math.trunc(count)));return this;}
 single(){this.cardinality="one";return this;}
 maybeSingle(){this.cardinality="optional";return this;}
 then<T=Reply,E=never>(fulfilled?:((value:Reply)=>T|PromiseLike<T>)|null,rejected?:((reason:unknown)=>E|PromiseLike<E>)|null){return this.execute().then(fulfilled,rejected);}
 private selection(){
  if(this.columns==="*")return "*";
  // The only embedded relationship used by the course tutor is public document chunks.
  const embedded="ai_document_chunks(id,content)";
  const plain=this.columns.replace(embedded,"").split(",").filter(Boolean).map(identifier);
  if(this.columns.includes(embedded)){
   if(this.table!=="ai_knowledge_documents")throw new Error("Unsupported embedded relationship");
   plain.push(`(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'content',c.content)),'[]'::jsonb) from public.ai_document_chunks c where c.document_id=ai_knowledge_documents.id) as ai_document_chunks`);
  }
  return plain.join(",");
 }
 private async execute():Promise<Reply>{
  try{return await this.store.actor(this.accountId,async tx=>{
   const params:unknown[]=[];
   const bind=(value:unknown)=>{params.push(value!==null&&typeof value==="object"?JSON.stringify(value):value);return `$${params.length}`;};
   const table=`public.${identifier(this.table)}`;
   const condition=()=>this.filters.length?" where "+this.filters.map(f=>{
    const key=identifier(f.column);
    if(f.op==="is"||f.op==="is not")return `${key} ${f.op} ${f.value===null?"null":f.value?"true":"false"}`;
    if(f.op==="in"){const values=f.value as unknown[];return values.length?`${key} in (${values.map(bind).join(",")})`:"false";}
    return `${key} ${f.op} ${bind(f.value)}`;
   }).join(" and "):"";
   let sql:string;
   if(this.action==="select"){
    sql=`select ${this.selection()} from ${table}${condition()}`;
    if(this.orders.length)sql+=" order by "+this.orders.map(o=>`${identifier(o.column)} ${o.ascending?"asc":"desc"}`).join(",");
    if(this.maximum!==undefined)sql+=` limit ${this.maximum}`;
   }else if(this.action==="delete")sql=`delete from ${table}${condition()}${this.returning?` returning ${this.selection()}`:""}`;
   else if(this.action==="update")sql=`update ${table} set ${Object.entries(this.rows[0]).map(([key,value])=>`${identifier(key)}=${bind(value)}`).join(",")}${condition()}${this.returning?` returning ${this.selection()}`:""}`;
   else{
    const keys=Object.keys(this.rows[0]);
    sql=`insert into ${table} (${keys.map(identifier).join(",")}) values ${this.rows.map(row=>`(${keys.map(key=>bind(row[key]??null)).join(",")})`).join(",")}`;
    if(this.action==="upsert"){
     const conflict=this.conflict?.split(",").map(identifier).join(",");
     sql+=` on conflict${conflict?` (${conflict})`:""} `;
     if(this.ignore)sql+="do nothing";
     else if(conflict)sql+="do update set "+keys.map(key=>`${identifier(key)}=excluded.${identifier(key)}`).join(",");
     else throw new Error("Local upserts need an explicit conflict key");
    }
    if(this.returning)sql+=` returning ${this.selection()}`;
   }
   const result=await tx.query<Row>(sql,params);
   if(this.cardinality!=="many"){
    if(result.rows.length>1||(this.cardinality==="one"&&result.rows.length!==1))return {data:null,error:{code:"PGRST116",message:"Unexpected number of rows"}};
    return {data:normalize(result.rows[0]||null),error:null};
   }
   return {data:this.action==="select"||this.returning?normalize(result.rows):null,error:null};
  });}catch(error){return failure(error);}
 }
}
export async function localRpc(store:Store,accountId:string|null,name:string,args:Row={}):Promise<Reply>{
 try{return await store.actor(accountId,async(tx:Transaction)=>{
  const values=Object.values(args).map(value=>value!==null&&typeof value==="object"?JSON.stringify(value):value);
  const params=Object.keys(args).map((key,i)=>`${identifier(key)} => $${i+1}`).join(",");
  const result=await tx.query<{data:unknown}>(`select public.${identifier(name)}(${params}) as data`,values);
  return {data:normalize(result.rows[0]?.data??null),error:null};
 });}catch(error){return failure(error);}
}
