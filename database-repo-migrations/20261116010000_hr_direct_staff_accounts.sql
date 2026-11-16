-- Direct HR-created staff accounts for the private Xedruo platform.
-- Existing administrator accounts remain valid; username/department are added nullable.
ALTER TABLE public.xedruo_platform_admins
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.xedruo_platform_admins
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE public.xedruo_platform_admins
  DROP CONSTRAINT IF EXISTS xedruo_platform_admins_role_check;

ALTER TABLE public.xedruo_platform_admins
  ADD CONSTRAINT xedruo_platform_admins_role_check
  CHECK (role IN ('governor','ceo','cfo','hr','developer','technical_officer','customer_service','operations'));

CREATE UNIQUE INDEX IF NOT EXISTS xedruo_platform_admins_username_lower_uidx
  ON public.xedruo_platform_admins (lower(username))
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS xedruo_platform_admins_email_lower_uidx
  ON public.xedruo_platform_admins (lower(email))
  WHERE email IS NOT NULL;
