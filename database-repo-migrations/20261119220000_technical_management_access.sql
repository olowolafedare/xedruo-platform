-- Additive management expansion. Existing roles and records are retained.
ALTER TABLE public.xedruo_platform_admins
  DROP CONSTRAINT IF EXISTS xedruo_platform_admins_role_check;
ALTER TABLE public.xedruo_platform_admins
  ADD CONSTRAINT xedruo_platform_admins_role_check
  CHECK (role IN ('governor','chairman','ceo','cfo','cos','developer','cto','customer_service','operations'));

CREATE TABLE IF NOT EXISTS public.xedruo_staff_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (length(full_name) BETWEEN 2 AND 160),
  work_email text NOT NULL CHECK (length(work_email) BETWEEN 5 AND 254),
  requested_unit text NOT NULL CHECK (requested_unit IN ('chairman','ceo','cfo','cos','operations','customer_service','cto')),
  position_title text NOT NULL CHECK (length(position_title) BETWEEN 2 AND 120),
  reason text NOT NULL CHECK (length(reason) BETWEEN 10 AND 2000),
  sponsor_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decision_by uuid REFERENCES public.xedruo_platform_admins(id),
  decision_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xedruo_staff_access_requests_status_created_idx
  ON public.xedruo_staff_access_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS xedruo_staff_access_requests_email_idx
  ON public.xedruo_staff_access_requests(lower(work_email));
