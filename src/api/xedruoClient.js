import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ydhgxyklucrcqmivtvcu.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_SBS-hnI6lAOdi5UnrLu2HA_GlvG0_av';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
import { appUrl as productionUrl } from '@/lib/appOrigin';
const getProfile = async (user) => { if (!user) return null; const { data, error } = await supabase.from('profiles').select('full_name,avatar_url,role').eq('id', user.id).maybeSingle(); if (error) console.warn('[xedruo] Could not load profile/role from Supabase (check RLS on public.profiles):', error.message); return data || null; };
const STAFF_ROLES = ['governor','ceo','cfo','developer','customer_service','operations'];
const resolveStaffRole = (profileRole, appRole) => [profileRole, appRole].find((r) => STAFF_ROLES.includes(r)) || null;
const auth = {
  async me() { const { data, error } = await supabase.auth.getUser(); if (error || !data?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 }); const profile = await getProfile(data.user); return { ...data.user, role: profile?.role || data.user.app_metadata?.role || 'user', staff_role: resolveStaffRole(profile?.role, data.user.app_metadata?.role), name: profile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email, full_name: profile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || null, avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url || null, phone: data.user.phone || null, phone_confirmed_at: data.user.phone_confirmed_at || null }; },
  async isAuthenticated() { try { await this.me(); return true; } catch { return false; } },
  async loginViaEmailPassword(email,password) { const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw Object.assign(new Error(error.message),{status:error.status||401,data:error}); return data; },
  async sendLoginOtp(email) { const {data,error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:true}}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async verifyLoginOtp(email,otpCode) { const {data,error}=await supabase.auth.verifyOtp({email,token:otpCode,type:'email'}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async sendPhoneLoginOtp(phone) { const normalized=String(phone||'').trim(); if(!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error('Enter a valid phone number with country code, e.g. +2348012345678'); const {data,error}=await supabase.auth.signInWithOtp({phone:normalized,options:{shouldCreateUser:true}}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async verifyPhoneLoginOtp(phone,token) { const normalized=String(phone||'').trim(); const {data,error}=await supabase.auth.verifyOtp({phone:normalized,token,type:'sms'}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async register({email,password}) { const {data,error}=await supabase.auth.signUp({email,password}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async verifyOtp({email,otpCode}) { const {data,error}=await supabase.auth.verifyOtp({email,token:otpCode,type:'signup'}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async resendOtp(email) { const {data,error}=await supabase.auth.resend({type:'signup',email}); if(error) throw new Error(error.message); return data; },
  async sendPhoneOtp(phone) { const normalized=String(phone||'').trim(); if(!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error('Enter a valid phone number with country code, e.g. +2348012345678'); const {data,error}=await supabase.auth.updateUser({phone:normalized}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async verifyPhoneOtp(phone,token) { const {data,error}=await supabase.auth.verifyOtp({phone:String(phone||'').trim(),token,type:'phone_change'}); if(error) throw Object.assign(new Error(error.message),{status:error.status||400,data:error}); return data; },
  async resetPasswordRequest(email) { const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:productionUrl('/reset-password')}); if(error) throw new Error(error.message); return true; },
  async resetPassword({newPassword}) { const {data,error}=await supabase.auth.updateUser({password:newPassword}); if(error) throw new Error(error.message); return data; },
  setToken() {},
  async updateMe(patch={}) { const {data:current}=await supabase.auth.getUser(); if(!current?.user) throw Object.assign(new Error('Not authenticated'),{status:401}); const {role:_r,staff_role:_s,...safePatch}=patch; const {data,error}=await supabase.auth.updateUser({data:safePatch}); if(error) throw new Error(error.message); return data?.user; },
  async logout() { const returnTo=`${window.location.pathname}${window.location.search}${window.location.hash}`; if(returnTo.startsWith('/')&&returnTo!=='/login') localStorage.setItem('xedruo_logout_return_to',returnTo); await supabase.auth.signOut(); window.location.assign(productionUrl('/login')); },
  redirectToLogin() { const returnTo=`${window.location.pathname}${window.location.search}${window.location.hash}`; const target=returnTo.startsWith('/')&&returnTo!=='/login'?`/login?returnTo=${encodeURIComponent(returnTo)}`:'/login'; window.location.assign(productionUrl(target)); },
  async loginWithProvider(provider, options={}) { const callbackUrl=options.redirectTo || productionUrl('/auth/callback'); const {data,error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:callbackUrl}}); if(error) throw new Error(error.message); if(data?.url&&window.location.href!==data.url) window.location.assign(data.url); return data; },
  async refresh() { const {data,error}=await supabase.auth.refreshSession(); if(error) throw new Error(error.message); return data; },
};
const CORE_API_URL = import.meta.env.VITE_XEDRUO_CORE_API_URL || `${SUPABASE_URL}/functions/v1/xedruo-core-api`;

async function coreApi(path, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  const response = await fetch(`${CORE_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body?.error || 'Xedruo Core API request failed'), { status: response.status, data: body });
  return body;
}

const entity=(name)=>({
  async list(sort='-created_date',limit=50){return coreApi(`?entity=${encodeURIComponent(name)}&sort=${encodeURIComponent(sort)}&limit=${Math.min(Number(limit)||50,200)}`);},
  async filter(filters={},sort='-created_date',limit=50){return coreApi(`?entity=${encodeURIComponent(name)}&filters=${encodeURIComponent(JSON.stringify(filters||{}))}&sort=${encodeURIComponent(sort)}&limit=${Math.min(Number(limit)||50,200)}`);},
  async get(id){const data=await coreApi(`?entity=${encodeURIComponent(name)}&id=${encodeURIComponent(id)}`);if(!data)throw new Error('Record not found');return data;},
  async create(payload){return coreApi(`?entity=${encodeURIComponent(name)}`,{method:'POST',body:JSON.stringify(payload||{})});},
  async update(id,patch){return coreApi(`?entity=${encodeURIComponent(name)}&id=${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(patch||{})});},
  async delete(id){await coreApi(`?entity=${encodeURIComponent(name)}&id=${encodeURIComponent(id)}`,{method:'DELETE'});},
  async bulkUpdate(items=[]){return Promise.all(items.map(item=>this.update(item.id,item.data||item.patch||{})));},
  subscribe(callback,intervalMs=5000){if(typeof callback!=='function')return()=>{};const timer=window.setInterval(()=>callback(),intervalMs);return()=>window.clearInterval(timer);}
});
const normalize=(row)=>({...row?.data||{},id:row?.id,created_date:row?.created_at,updated_date:row?.updated_at});
const entities=new Proxy({},{get:(_,name)=>entity(name)});
export const xedruo={auth,entities,integrations:{Core:{async UploadFile({file,bucket='xedruo-media'}){const{data:userData}=await supabase.auth.getUser();if(!userData?.user)throw Object.assign(new Error('Not authenticated'),{status:401});const safeName=String(file?.name||'file').replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${userData.user.id}/${Date.now()}-${safeName}`;const{error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined});if(error)throw new Error(error.message);if(bucket==='xedruo-media'){const{data}=supabase.storage.from(bucket).getPublicUrl(path);return{file_url:data.publicUrl,path};}const{data,error:signedError}=await supabase.storage.from(bucket).createSignedUrl(path,3600);if(signedError)throw new Error(signedError.message);return{file_url:data.signedUrl,path};},async SendEmail(){return{success:true};}}}};
export {supabase};
