import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ydhgxyklucrcqmivtvcu.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_SBS-hnI6lAOdi5UnrLu2HA_GlvG0_av';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' } });
const AUTH_PRODUCTION_ORIGIN = 'https://xedruo-platform.vercel.app';
const productionUrl = (path = '/') => new URL(path, AUTH_PRODUCTION_ORIGIN).toString();
const getProfile = async (user) => { if (!user) return null; const { data } = await supabase.from('profiles').select('full_name,avatar_url,role').eq('id', user.id).maybeSingle(); return data || null; };
const auth = {
  async me() { const { data, error } = await supabase.auth.getUser(); if (error || !data?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 }); const profile = await getProfile(data.user); return { ...data.user, role: profile?.role || data.user.app_metadata?.role || 'user', name: profile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email, full_name: profile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || null, avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url || null }; },
  async isAuthenticated() { try { await this.me(); return true; } catch { return false; } },
  async loginViaEmailPassword(email,password) { const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw Object.assign(new Error(error.message),{status:error.status||401,data:error}); return data; },
  async sendLoginOtp(email) { const {data,error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:true}}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async verifyLoginOtp(email,otpCode) { const {data,error}=await supabase.auth.verifyOtp({email,token:otpCode,type:'email'}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async register({email,password}) { const {data,error}=await supabase.auth.signUp({email,password}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async verifyOtp({email,otpCode}) { const {data,error}=await supabase.auth.verifyOtp({email,token:otpCode,type:'signup'}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async resendOtp(email) { const {data,error}=await supabase.auth.resend({type:'signup',email}); if(error) throw new Error(error.message); return data; },
  async sendPhoneOtp(phone) { const {data,error}=await supabase.auth.updateUser({phone}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async verifyPhoneOtp(phone,token) { const {data,error}=await supabase.auth.verifyOtp({phone,token,type:'phone_change'}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async resetPasswordRequest(email) { const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:productionUrl('/reset-password')}); if(error) throw new Error(error.message); return true; },
  async resetPassword({newPassword}) { const {data,error}=await supabase.auth.updateUser({password:newPassword}); if(error) throw new Error(error.message); return data; },
  setToken() {},
  async updateMe(patch={}) { const {data:current}=await supabase.auth.getUser(); if(!current?.user) throw Object.assign(new Error('Not authenticated'),{status:401}); const {data,error}=await supabase.auth.updateUser({data:patch}); if(error) throw new Error(error.message); if(patch.role||patch.staff_role) await supabase.from('profiles').update({role:patch.role||patch.staff_role,updated_at:new Date().toISOString()}).eq('id',current.user.id); return data?.user; },
  async logout() { await supabase.auth.signOut(); window.location.assign(productionUrl('/')); },
  redirectToLogin() { window.location.assign(productionUrl('/login')); },
  async loginWithProvider(provider) { const callbackUrl=productionUrl('/auth/callback'); const {data,error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:callbackUrl}}); if(error) throw new Error(error.message); if(data?.url&&window.location.href!==data.url) window.location.assign(data.url); return data; },
  async refresh() { const {data,error}=await supabase.auth.refreshSession(); if(error) throw new Error(error.message); return data; },
};
const entity=(name)=>({
  async list(sort='-created_date',limit=50){let query=supabase.from('xedruo_records').select('*').eq('entity',name); query=query.order('created_at',{ascending:!sort?.startsWith('-')}).limit(limit); const {data,error}=await query;if(error)throw error;return(data||[]).map(normalize);},
  async filter(filters={},sort='-created_date',limit=50){let query=supabase.from('xedruo_records').select('*').eq('entity',name);for(const[key,value]of Object.entries(filters))query=query.eq(`data->>${key}`,String(value));query=query.order('created_at',{ascending:!sort?.startsWith('-')}).limit(limit);const{data,error}=await query;if(error)throw error;return(data||[]).map(normalize);},
  async get(id){const{data,error}=await supabase.from('xedruo_records').select('*').eq('entity',name).eq('id',id).maybeSingle();if(error)throw error;if(!data)throw new Error('Record not found');return normalize(data);},
  async create(payload){const{data:userData}=await supabase.auth.getUser();const{data,error}=await supabase.from('xedruo_records').insert({entity:name,owner_id:userData?.user?.id||null,data:payload}).select().single();if(error)throw error;return normalize(data);},
  async update(id,patch){const current=await this.get(id);const next={...current};delete next.id;delete next.created_date;delete next.updated_date;const{data,error}=await supabase.from('xedruo_records').update({data:{...next,...patch},updated_at:new Date().toISOString()}).eq('entity',name).eq('id',id).select().single();if(error)throw error;return normalize(data);},
  async delete(id){const{error}=await supabase.from('xedruo_records').delete().eq('entity',name).eq('id',id);if(error)throw error;},
  async bulkUpdate(items=[]){return Promise.all(items.map(item=>this.update(item.id,item.data||item.patch||{})));},
  subscribe(callback,intervalMs=5000){if(typeof callback!=='function')return()=>{};const timer=window.setInterval(()=>callback(),intervalMs);return()=>window.clearInterval(timer);}
});
const normalize=(row)=>({...row?.data||{},id:row?.id,created_date:row?.created_at,updated_date:row?.updated_at});
const entities=new Proxy({},{get:(_,name)=>entity(name)});
export const xedruo={auth,entities,integrations:{Core:{async UploadFile({file,bucket='xedruo-media'}){const{data:userData}=await supabase.auth.getUser();if(!userData?.user)throw Object.assign(new Error('Not authenticated'),{status:401});const safeName=String(file?.name||'file').replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${userData.user.id}/${Date.now()}-${safeName}`;const{error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined});if(error)throw new Error(error.message);if(bucket==='xedruo-media'){const{data}=supabase.storage.from(bucket).getPublicUrl(path);return{file_url:data.publicUrl,path};}const{data,error:signedError}=await supabase.storage.from(bucket).createSignedUrl(path,3600);if(signedError)throw new Error(signedError.message);return{file_url:data.signedUrl,path};},async SendEmail(){return{success:true};}}}};
export {supabase};
