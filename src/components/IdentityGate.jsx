import React,{useEffect,useState} from 'react';
import {Navigate,useLocation} from 'react-router-dom';
import {Loader2} from 'lucide-react';
import {supabase} from '@/api/xedruoClient';
import {useAuth} from '@/lib/AuthContext';

export default function IdentityGate({children}){
 const {isAuthenticated}=useAuth(); const location=useLocation(); const [loading,setLoading]=useState(true); const [needs,setNeeds]=useState(false);
 useEffect(()=>{let alive=true;(async()=>{if(!isAuthenticated){if(alive)setLoading(false);return;} const {data,error}=await supabase.from('xedruo_customer_profiles').select('country_code,phone_e164,phone_verified').eq('user_id',(await supabase.auth.getUser()).data.user.id).maybeSingle(); if(alive){setNeeds(Boolean(error||!data?.country_code||!data?.phone_e164||!data?.phone_verified));setLoading(false);}})();return()=>{alive=false;}},[isAuthenticated]);
 if(loading)return <div className="fixed inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin"/></div>;
 if(needs && location.pathname!=='/onboarding')return <Navigate to="/onboarding" replace state={{from:location.pathname}}/>;
 return children;
}
