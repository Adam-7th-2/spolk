export function cloudUploads(){return process.env.SPOLK_DATA_MODE!=='local'&&process.env.PRIVATE_UPLOAD_STORAGE==='supabase';}
