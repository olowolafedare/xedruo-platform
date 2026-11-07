
CREATE TABLE public.xedruo_accounts (
  id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'deactivated'::text])),
  account_type text NOT NULL DEFAULT 'individual'::text CHECK (account_type = ANY (ARRAY['individual'::text, 'business'::text, 'system'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  phone_number text NOT NULL UNIQUE,
  country_code text NOT NULL,
  xedruo_identity text NOT NULL UNIQUE,
  is_verified boolean NOT NULL DEFAULT false,
  CONSTRAINT xedruo_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_accounts_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.xedruo_profiles (
  id uuid NOT NULL,
  full_name text,
  username text UNIQUE,
  avatar_url text,
  bio text,
  phone_number text,
  country text,
  state text,
  city text,
  date_of_birth date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedruo_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.xedruo_account_roles (
  account_id uuid NOT NULL,
  role_id uuid NOT NULL,
  granted_by uuid,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_account_roles_pkey PRIMARY KEY (account_id, role_id),
  CONSTRAINT xedruo_account_roles_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id),
  CONSTRAINT xedruo_account_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.xedruo_roles(id),
  CONSTRAINT xedruo_account_roles_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedruo_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.xedruo_role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  CONSTRAINT xedruo_role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT xedruo_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.xedruo_roles(id),
  CONSTRAINT xedruo_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.xedruo_permissions(id)
);
CREATE TABLE public.xedruo_organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  organization_type text NOT NULL DEFAULT 'company'::text CHECK (organization_type = ANY (ARRAY['company'::text, 'startup'::text, 'agency'::text, 'institution'::text, 'nonprofit'::text, 'other'::text])),
  logo_url text,
  website text,
  description text,
  email text,
  phone_number text,
  country text,
  state text,
  city text,
  address text,
  registration_number text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'suspended'::text, 'archived'::text])),
  created_by uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_organizations_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedruo_organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  account_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'member'::text])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['invited'::text, 'active'::text, 'suspended'::text, 'removed'::text])),
  joined_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.xedruo_organizations(id),
  CONSTRAINT xedruo_organization_members_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedruo_organization_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'member'::text])),
  invited_by uuid NOT NULL,
  token_hash text UNIQUE,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'revoked'::text])),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_organization_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.xedruo_organizations(id),
  CONSTRAINT xedruo_organization_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedruo_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  bucket_name text NOT NULL,
  object_path text NOT NULL,
  file_name text,
  mime_type text,
  file_size bigint CHECK (file_size IS NULL OR file_size >= 0),
  visibility text NOT NULL DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['private'::text, 'public'::text])),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_media_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_media_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedruo_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  service text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general'::text,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_notifications_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedruo_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  service text NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.hireuo_candidate_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE,
  headline text,
  professional_summary text,
  phone_number text,
  years_experience numeric CHECK (years_experience IS NULL OR years_experience >= 0::numeric AND years_experience <= 100::numeric),
  job_search_timing text CHECK (job_search_timing IS NULL OR (job_search_timing = ANY (ARRAY['immediately'::text, 'within_2_weeks'::text, 'within_1_month'::text, 'within_3_months'::text, 'exploring'::text]))),
  preferred_workplace_type text CHECK (preferred_workplace_type IS NULL OR (preferred_workplace_type = ANY (ARRAY['remote'::text, 'hybrid'::text, 'onsite'::text, 'any'::text]))),
  onboarding_completed boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_candidate_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_candidate_profiles_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.hireuo_recruiter_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE,
  professional_title text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_recruiter_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_recruiter_profiles_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.hireuo_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  organization_id uuid,
  recruiter_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  responsibilities text,
  city text,
  state text,
  country text,
  employment_type text NOT NULL CHECK (employment_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'contract'::text, 'internship'::text, 'temporary'::text, 'freelance'::text])),
  workplace_type text NOT NULL CHECK (workplace_type = ANY (ARRAY['onsite'::text, 'remote'::text, 'hybrid'::text])),
  experience_level text,
  salary_min numeric CHECK (salary_min IS NULL OR salary_min >= 0::numeric),
  salary_max numeric CHECK (salary_max IS NULL OR salary_max >= 0::numeric),
  salary_currency character,
  salary_is_public boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'paused'::text, 'closed'::text, 'expired'::text])),
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_jobs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.xedruo_organizations(id),
  CONSTRAINT hireuo_jobs_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.hireuo_question_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  created_by uuid NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type = ANY (ARRAY['short_text'::text, 'long_text'::text, 'single_choice'::text, 'multiple_choice'::text, 'yes_no'::text, 'number'::text, 'url'::text, 'date'::text, 'file'::text])),
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'::text),
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_question_templates_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_question_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.xedruo_organizations(id),
  CONSTRAINT hireuo_question_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.hireuo_job_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type = ANY (ARRAY['short_text'::text, 'long_text'::text, 'single_choice'::text, 'multiple_choice'::text, 'yes_no'::text, 'number'::text, 'url'::text, 'date'::text, 'file'::text])),
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'::text),
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_job_questions_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_job_questions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.hireuo_jobs(id)
);
CREATE TABLE public.hireuo_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'reviewing'::text, 'shortlisted'::text, 'interview'::text, 'offered'::text, 'hired'::text, 'rejected'::text, 'withdrawn'::text])),
  cover_letter text,
  questionnaire_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(questionnaire_snapshot) = 'array'::text),
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_applications_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.hireuo_jobs(id),
  CONSTRAINT hireuo_applications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.hireuo_application_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  job_id uuid NOT NULL,
  job_question_id uuid NOT NULL,
  answer_text text,
  answer_value jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_application_answers_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_answers_application_job_fk FOREIGN KEY (application_id) REFERENCES public.hireuo_applications(id),
  CONSTRAINT hireuo_answers_application_job_fk FOREIGN KEY (job_id) REFERENCES public.hireuo_applications(job_id),
  CONSTRAINT hireuo_answers_question_job_fk FOREIGN KEY (job_question_id) REFERENCES public.hireuo_job_questions(id),
  CONSTRAINT hireuo_answers_question_job_fk FOREIGN KEY (job_id) REFERENCES public.hireuo_job_questions(job_id)
);
CREATE TABLE public.hireuo_candidate_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  application_id uuid,
  media_id uuid,
  file_name text NOT NULL,
  file_url text,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['resume'::text, 'cover_letter'::text, 'portfolio'::text, 'certificate'::text, 'other'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_candidate_documents_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_candidate_documents_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.xedruo_accounts(id),
  CONSTRAINT hireuo_candidate_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.hireuo_applications(id),
  CONSTRAINT hireuo_candidate_documents_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.xedruo_media(id)
);
CREATE TABLE public.hireuo_application_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  actor_id uuid,
  event_type text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_application_events_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_application_events_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.hireuo_applications(id),
  CONSTRAINT hireuo_application_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.hireuo_saved_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  job_id uuid NOT NULL,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_saved_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_saved_jobs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.xedruo_accounts(id),
  CONSTRAINT hireuo_saved_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.hireuo_jobs(id)
);
CREATE TABLE public.hireuo_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general'::text,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hireuo_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT hireuo_notifications_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedrion_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New chat'::text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedrion_chats_pkey PRIMARY KEY (id),
  CONSTRAINT xedrion_chats_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedrion_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  account_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text, 'tool'::text])),
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedrion_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT xedrion_messages_chat_owner_fk FOREIGN KEY (chat_id) REFERENCES public.xedrion_chats(id),
  CONSTRAINT xedrion_messages_chat_owner_fk FOREIGN KEY (account_id) REFERENCES public.xedrion_chats(account_id)
);
CREATE TABLE public.xedrion_ai_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid,
  query_text text NOT NULL,
  answer_text text NOT NULL,
  rating text NOT NULL CHECK (rating = ANY (ARRAY['helpful'::text, 'needs_work'::text])),
  feedback_note text,
  model_name text NOT NULL DEFAULT 'unknown'::text,
  task_type text NOT NULL DEFAULT 'general'::text CHECK (task_type = ANY (ARRAY['general'::text, 'sports'::text, 'file_analysis'::text, 'coding'::text, 'business'::text, 'other'::text])),
  review_status text NOT NULL DEFAULT 'pending'::text CHECK (review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  evaluated_at timestamp with time zone,
  CONSTRAINT xedrion_ai_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT xedrion_ai_feedback_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedrion_ai_feedback_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  feedback_count integer NOT NULL DEFAULT 0 CHECK (feedback_count >= 0),
  model_name text NOT NULL,
  summary text NOT NULL,
  recommended_changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedrion_ai_feedback_evaluations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.xedrion_plugin_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  server_url text NOT NULL CHECK (server_url ~ '^https://'::text),
  description text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'connected'::text, 'error'::text, 'disabled'::text])),
  server_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_checked_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedrion_plugin_connections_pkey PRIMARY KEY (id),
  CONSTRAINT xedrion_plugin_connections_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.xedruo_accounts(id)
);
CREATE TABLE public.xedrion_answer_cache (
  query_key text NOT NULL,
  query_text text NOT NULL,
  answer text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  hits bigint NOT NULL DEFAULT 0 CHECK (hits >= 0),
  CONSTRAINT xedrion_answer_cache_pkey PRIMARY KEY (query_key)
);
CREATE TABLE public.xedrion_web_pages (
  url text NOT NULL,
  canonical_url text NOT NULL,
  title text NOT NULL DEFAULT ''::text,
  content text NOT NULL DEFAULT ''::text,
  description text NOT NULL DEFAULT ''::text,
  language text,
  domain text NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  last_status integer,
  content_hash text,
  search_document tsvector DEFAULT ((setweight(to_tsvector('simple'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, COALESCE(description, ''::text)), 'B'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(content, ''::text)), 'C'::"char")),
  CONSTRAINT xedrion_web_pages_pkey PRIMARY KEY (url)
);
CREATE TABLE public.xedrion_crawl_queue (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  url text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'queued'::text CHECK (status = ANY (ARRAY['queued'::text, 'processing'::text, 'done'::text, 'failed'::text])),
  priority integer NOT NULL DEFAULT 100,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  discovered_from text,
  next_crawl_at timestamp with time zone NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedrion_crawl_queue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.xedruo_identity (
  user_id uuid NOT NULL,
  xedruo_id text NOT NULL UNIQUE CHECK (xedruo_id ~ '^(Xedruo [A-Z]{2} [0-9]{10}|[A-Z]{2}-[0-9]{10})$'::text),
  country_code character NOT NULL,
  status text NOT NULL DEFAULT 'unverified'::text CHECK (status = ANY (ARRAY['unverified'::text, 'verified'::text, 'suspended'::text])),
  kyc_status text NOT NULL DEFAULT 'not_started'::text CHECK (kyc_status = ANY (ARRAY['not_started'::text, 'pending'::text, 'verified'::text, 'rejected'::text, 'review_required'::text])),
  kyc_level integer NOT NULL DEFAULT 0 CHECK (kyc_level >= 0),
  phone_e164 text,
  phone_verified_at timestamp with time zone,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  legal_name text,
  CONSTRAINT xedruo_identity_pkey PRIMARY KEY (user_id),
  CONSTRAINT xedruo_identity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.xedruo_company_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  xedruo_id text NOT NULL,
  company_slug text NOT NULL CHECK (company_slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'::text),
  display_name text,
  avatar_url text,
  bio text,
  company_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_company_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_company_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT xedruo_company_profiles_xedruo_id_fkey FOREIGN KEY (xedruo_id) REFERENCES public.xedruo_identity(xedruo_id)
);
CREATE TABLE public.xedruo_company_app_registry (
  company_slug text NOT NULL CHECK (company_slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'::text),
  display_name text NOT NULL,
  app_origin text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  allowed_callbacks ARRAY NOT NULL DEFAULT '{}'::text[],
  allowed_logout_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  CONSTRAINT xedruo_company_app_registry_pkey PRIMARY KEY (company_slug)
);
CREATE TABLE public.xedruo_identity_event_outbox (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type = 'identity.created'::text),
  user_id uuid NOT NULL,
  xedruo_id text NOT NULL,
  issuing_country character NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  available_at timestamp with time zone NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  processed_at timestamp with time zone,
  last_error text,
  CONSTRAINT xedruo_identity_event_outbox_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_identity_event_outbox_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT xedruo_identity_event_outbox_xedruo_id_fkey FOREIGN KEY (xedruo_id) REFERENCES public.xedruo_identity(xedruo_id)
);
CREATE TABLE public.xedruo_push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_slug text NOT NULL DEFAULT 'xedruo'::text,
  endpoint text NOT NULL CHECK (endpoint ~ '^https://'::text),
  p256dh text NOT NULL CHECK (length(p256dh) >= 40 AND length(p256dh) <= 256),
  auth text NOT NULL CHECK (length(auth) >= 16 AND length(auth) <= 128),
  user_agent text,
  active boolean NOT NULL DEFAULT true,
  expiration_time timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT xedruo_push_subscriptions_company_slug_fkey FOREIGN KEY (company_slug) REFERENCES public.xedruo_company_app_registry(company_slug)
);
CREATE TABLE public.xedruo_country_calling_codes (
  country_code character NOT NULL,
  calling_code text NOT NULL CHECK (calling_code ~~ '+%'::text),
  CONSTRAINT xedruo_country_calling_codes_pkey PRIMARY KEY (country_code)
);
CREATE TABLE public.xedruo_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity text NOT NULL CHECK (length(btrim(entity)) > 0),
  owner_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_slug text,
  CONSTRAINT xedruo_records_pkey PRIMARY KEY (id),
  CONSTRAINT xedruo_records_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.xedruo_phone_otp_challenges (
  challenge_id uuid NOT NULL,
  user_id uuid NOT NULL,
  country_code character NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'::text),
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'::text),
  code_hash text NOT NULL CHECK (code_hash ~ '^[a-f0-9]{64}$'::text),
  expires_at timestamp with time zone NOT NULL,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_phone_otp_challenges_pkey PRIMARY KEY (challenge_id),
  CONSTRAINT xedruo_phone_otp_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.xedruo_auth_throttle (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  key text NOT NULL,
  at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xedruo_auth_throttle_pkey PRIMARY KEY (id)
);