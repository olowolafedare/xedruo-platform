-- Separate private platform-admin authentication from customer identity.
CREATE TABLE IF NOT EXISTS public.xedruo_platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('governor','ceo','cfo','developer','customer_service','operations')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS xedruo_platform_admins_email_lower_uidx
  ON public.xedruo_platform_admins (lower(email));

CREATE TABLE IF NOT EXISTS public.xedruo_platform_admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.xedruo_platform_admins(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text
);
CREATE INDEX IF NOT EXISTS xedruo_platform_admin_sessions_active_idx
  ON public.xedruo_platform_admin_sessions (admin_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.xedruo_platform_admin_login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email_hash char(64) NOT NULL,
  ip_hash char(64) NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xedruo_platform_admin_login_attempts_email_time_idx
  ON public.xedruo_platform_admin_login_attempts (email_hash, attempted_at DESC);
CREATE INDEX IF NOT EXISTS xedruo_platform_admin_login_attempts_ip_time_idx
  ON public.xedruo_platform_admin_login_attempts (ip_hash, attempted_at DESC);
