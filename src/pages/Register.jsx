import React,{useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {UserPlus,Ticket,UserRound} from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import GoogleIcon from '@/components/GoogleIcon';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {xedruo} from '@/api/xedruoClient';
import {safeReturnTo} from '@/lib/authReturnTo';
import {appOrigin} from '@/lib/appOrigin';

const AUTH_RETURN_KEY='xedruo_oauth_return_to';
const SPORTRUO_URL='https://sportruo.vercel.app/';

export default function Register(){
 const location=useLocation(),params=new URLSearchParams(location.search),company=params.get('company');
 const requestedReturnTo=params.has('returnTo')?safeReturnTo():null;
 const [role,setRole]=useState(params.get('role')==='participant'?'participant':'fan');
 const [error,setError]=useState(''),[loading,setLoading]=useState(false);
 const destination=company==='sportruo'?SPORTRUO_URL:requestedReturnTo||(company?'/company/'+encodeURIComponent(company)+'/dashboard':'/');
 const loginUrl='/login'+(company?'?company='+encodeURIComponent(company):'');
 const google=async()=>{
  setError('');setLoading(true);localStorage.setItem(AUTH_RETURN_KEY,destination);
  if(company==='sportruo')localStorage.setItem('sportruo_registration_role',role);
  try{
   const callback=new URL('/auth/callback',appOrigin());
   if(company)callback.searchParams.set('company',company);
   await xedruo.auth.loginWithProvider('google',{redirectTo:callback.toString()});
  }catch(err){setError(err.message||'Google registration failed.');setLoading(false);}
 };
 return <AuthLayout icon={UserPlus} title="Create your Xedruo account" subtitle="Register once with Google, then add your country and phone number for your shared Xedruo ID." footer={<>Already have an account? <Link to={loginUrl} className="text-primary font-medium hover:underline">Continue to login</Link></>}>
  {company==='sportruo'&&<div className="mb-6"><Label>SPORTRUO experience</Label><div className="grid grid-cols-2 gap-2 mt-2 p-1 rounded-xl bg-muted"><button type="button" onClick={()=>setRole('fan')} className={'rounded-lg px-4 py-3 text-sm font-semibold '+(role==='fan'?'bg-background shadow-sm':'')}><span className="inline-flex items-center gap-2"><Ticket className="w-4 h-4"/>Fan</span></button><button type="button" onClick={()=>setRole('participant')} className={'rounded-lg px-4 py-3 text-sm font-semibold '+(role==='participant'?'bg-background shadow-sm':'')}><span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4"/>Participant</span></button></div></div>}
  {error&&<div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
  <Button variant="outline" className="w-full h-12" onClick={google} disabled={loading}><GoogleIcon className="mr-2 h-5 w-5"/>{loading?'Connecting…':'Continue with Google'}</Button>
 </AuthLayout>;
}
