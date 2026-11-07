import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/api/xedruoClient';
import { useAuth } from '@/lib/AuthContext';

export default function IdentityGate({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState(false);

  useEffect(() => {
    let alive = true;

    const checkIdentity = async () => {
      if (!isAuthenticated || !user?.id) {
        if (alive) {
          setNeeds(false);
          setLoading(false);
        }
        return;
      }

      if (alive) setLoading(true);

      try {
      
        const { data: identity, error: identityError } = await supabase
          .from('xedruo_identity')
          .select(
            'xedruo_id,country_code,legal_name,phone_e164,phone_verified_at'
          )
          .eq('user_id', user.id)
          .maybeSingle();

        if (identityError) throw identityError;

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        const phoneVerified =
          Boolean(authUser?.phone) &&
          Boolean(authUser?.phone_confirmed_at) &&
          Boolean(identity?.phone_verified_at) &&
          identity.phone_e164 === authUser.phone;

        const identityComplete =
          Boolean(identity?.xedruo_id) &&
          Boolean(identity?.country_code) &&
          Boolean(identity?.legal_name?.trim()) &&
          Boolean(identity?.phone_e164) &&
          phoneVerified;

        if (alive) {
          setNeeds(!identityComplete);
        }
      } catch (error) {
        console.error('Xedruo identity check failed:', error);

        if (alive) setNeeds(true);
      } finally {
        if (alive) setLoading(false);
      }
    };

    checkIdentity();

    return () => {
      alive = false;
    };
  }, [isAuthenticated, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (needs && location.pathname !== '/onboarding') {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}