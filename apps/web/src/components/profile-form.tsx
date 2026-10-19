"use client";
import {useState} from 'react';
import {ActionForm} from './action-form';
import {updateProfile} from '@/app/workspace/profile/actions';
type Profile={first_name:string;last_name:string;country:string;city:string;timezone:string;english_level:string;learning_goal:string;explanation_language:string;interface_language:string;email_notifications:boolean};
export function ProfileForm({profile}:{profile:Profile}){
 const[timezone,setTimezone]=useState(profile.timezone||'UTC');
 return <ActionForm action={updateProfile} label="Save profile">
  <div className="profile-fields"><label>First name<input name="first_name" required maxLength={80} autoComplete="given-name" defaultValue={profile.first_name}/></label><label>Last name<input name="last_name" required maxLength={80} autoComplete="family-name" defaultValue={profile.last_name}/></label><label>Country<input name="country" required minLength={2} maxLength={100} autoComplete="country-name" defaultValue={profile.country}/></label><label>City<input name="city" required maxLength={100} autoComplete="address-level2" defaultValue={profile.city}/></label></div>
  <label>Time zone<input name="timezone" required value={timezone} onChange={event=>setTimezone(event.target.value)} list="profile-timezones" placeholder="Africa/Addis_Ababa"/><datalist id="profile-timezones">{['UTC','Africa/Addis_Ababa','Africa/Nairobi','Europe/London','Europe/Moscow','Asia/Dubai','Asia/Kolkata','America/New_York','America/Los_Angeles','Australia/Sydney'].map(zone=><option key={zone} value={zone}/>)}</datalist></label><button type="button" className="text-link" onClick={()=>setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)}>Use my device time zone</button>
  <label>English level<select name="english_level" aria-label="English level" required defaultValue={profile.english_level}>{['Not sure','A1','A2','B1','B2','C1','C2'].map(level=><option key={level}>{level}</option>)}</select></label>
  <label>Learning goal<textarea name="learning_goal" aria-label="Learning goal" required minLength={10} maxLength={2000} defaultValue={profile.learning_goal} placeholder="What would you like to be able to do in English?"/></label>
  <label>Preferred explanation language<select name="explanation_language" aria-label="Preferred explanation language" required defaultValue={profile.explanation_language}><option value="en">English</option><option value="ru">Russian</option><option value="am">Amharic</option></select></label>
  <label>Interface language preference<select name="interface_language" aria-label="Interface language preference" required defaultValue={profile.interface_language}><option value="en">English</option><option value="ru">Russian</option><option value="am">Amharic</option></select><small>Saved as a preference. Available interface translations depend on the page.</small></label>
  <label className="notification-preference"><input type="checkbox" name="email_notifications" defaultChecked={profile.email_notifications}/>Email me teacher replies, grades, announcements, and schedule updates</label><p className="fine">Workspace notifications remain available even if you turn off email.</p>
 </ActionForm>;
}
