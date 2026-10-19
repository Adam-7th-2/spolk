import type {InferenceProvider} from './rag';
export class GeminiProvider implements InferenceProvider{
 async complete(messages:{role:string;content:string}[]){
  const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('Gemini is not configured.');
  const model=process.env.GEMINI_MODEL||'gemini-3.5-flash-lite';
  if(!/^gemini-[a-zA-Z0-9._-]+$/.test(model))throw new Error('Invalid Gemini model.');
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({systemInstruction:{parts:[{text:messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n')}]},contents:messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:1500}}),signal:AbortSignal.timeout(35000),
  });
  if(!response.ok)throw new Error(response.status===429?'Gemini usage limit reached.':'Gemini is temporarily unavailable.');
  const result=await response.json();const candidate=result.candidates?.[0];
  if(candidate?.finishReason&&!['STOP','MAX_TOKENS'].includes(candidate.finishReason))throw new Error('Gemini could not answer this request.');
  const answer=candidate?.content?.parts?.filter((p:{text?:string;thought?:boolean})=>typeof p.text==='string'&&!p.thought).map((p:{text:string})=>p.text).join('\n').trim();
  if(!answer)throw new Error('Gemini did not return an answer.');
  return answer as string;
 }
}
