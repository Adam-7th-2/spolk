import {z} from 'zod';
export const profileSchema=z.object({
 first_name:z.string().trim().min(1).max(80),last_name:z.string().trim().min(1).max(80),country:z.string().trim().min(2).max(100),city:z.string().trim().min(1).max(100),
 timezone:z.string().max(100).refine(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}},'Choose a valid time zone.'),
 english_level:z.enum(['Not sure','A1','A2','B1','B2','C1','C2']),learning_goal:z.string().trim().min(10).max(2000),
 explanation_language:z.enum(['en','ru','am']),interface_language:z.enum(['en','ru','am']),email_notifications:z.boolean(),
});
export function profileComplete(profile:Record<string,unknown>|null){return Boolean(profile&&profileSchema.safeParse(profile).success);}
