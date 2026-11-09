-- Existing phone numbers are collected for Xedruo identity only.
-- SMS/OTP verification is intentionally not required at this stage.
CREATE OR REPLACE FUNCTION private.complete_xedruo_identity_onboarding(
    p_country_code text,
    p_phone_e164 text,
    p_legal_name text,
    p_company_slug text
)
RETURNS TABLE(
    xedruo_id text,
    country_code text,
    legal_name text,
    phone_e164 text,
    company_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'extensions', 'pg_temp'
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_country char(2);
    v_phone text := trim(coalesce(p_phone_e164, ''));
    v_name text := regexp_replace(trim(coalesce(p_legal_name, '')), '[[:space:]]+', ' ', 'g');
    v_slug text := lower(trim(coalesce(p_company_slug, '')));
    v_calling_code text;
    v_identity public.xedruo_identity%rowtype;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING errcode = '28000';
    END IF;
    IF p_country_code IS NULL OR upper(trim(p_country_code)) !~ '^[A-Z]{2}$' THEN
        RAISE EXCEPTION 'Select a valid issuing country' USING errcode = '22023';
    END IF;
    v_country := upper(trim(p_country_code))::char(2);
    IF length(v_name) < 3 OR length(v_name) > 160 OR v_name !~ '^[[:alpha:]][[:alpha:] .''-]+$' THEN
        RAISE EXCEPTION 'Enter your full legal name (3 to 160 characters)' USING errcode = '22023';
    END IF;
    IF v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$' THEN
        RAISE EXCEPTION 'Invalid company application' USING errcode = '22023';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.xedruo_company_app_registry r
        WHERE r.company_slug = v_slug AND r.enabled = true
    ) THEN
        RAISE EXCEPTION 'This Xedruo company application is not enabled' USING errcode = '22023';
    END IF;
    IF v_phone !~ '^\+[1-9][0-9]{7,14}$' THEN
        RAISE EXCEPTION 'Enter a valid international phone number' USING errcode = '22023';
    END IF;
    SELECT cc.calling_code INTO v_calling_code
    FROM public.xedruo_country_calling_codes cc
    WHERE cc.country_code = v_country;
    IF v_calling_code IS NULL OR left(v_phone, length(v_calling_code)) <> v_calling_code THEN
        RAISE EXCEPTION 'Phone calling code must match the selected country' USING errcode = '22023';
    END IF;
    PERFORM * FROM private.ensure_xedruo_identity(v_country);
    SELECT * INTO v_identity
    FROM public.xedruo_identity i
    WHERE i.user_id = v_user_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unable to allocate your Xedruo ID';
    END IF;
    IF v_identity.country_code <> v_country THEN
        RAISE EXCEPTION 'Your original Xedruo ID issuing country cannot be changed' USING errcode = '22023';
    END IF;
    IF v_identity.status = 'suspended' THEN
        RAISE EXCEPTION 'This Xedruo identity is suspended' USING errcode = '42501';
    END IF;
    UPDATE public.xedruo_identity i
    SET legal_name = v_name, phone_e164 = v_phone, phone_verified_at = NULL, updated_at = now()
    WHERE i.user_id = v_user_id
    RETURNING i.* INTO v_identity;
    BEGIN
        UPDATE public.xedruo_accounts a
        SET phone_number = v_phone, country_code = v_country,
            xedruo_identity = v_identity.xedruo_id, updated_at = now()
        WHERE a.id = v_user_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Xedruo account record was not found';
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'This phone number or Xedruo ID is already assigned to another account'
            USING errcode = '23505';
    END;
    UPDATE public.xedruo_profiles p
    SET full_name = v_name, phone_number = v_phone, country = v_country, updated_at = now()
    WHERE p.id = v_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Xedruo profile record was not found';
    END IF;
    PERFORM private.ensure_xedruo_company_profile(v_slug, v_name);
    RETURN QUERY SELECT v_identity.xedruo_id, v_identity.country_code::text,
        v_identity.legal_name, v_identity.phone_e164, v_slug;
END;
$function$;
