import {requireUser} from "@/lib/access";
import {ActionForm} from "@/components/action-form";
import {updatePassword} from "./actions";
export default async function Password(){await requireUser();return <section className="section page-section"><div className="form-card"><h1>A fresh start.</h1><ActionForm action={updatePassword} label="Update password"><label>New password<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label></ActionForm></div></section>}
