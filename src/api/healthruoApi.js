import { supabase } from './xedruoClient';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Please sign in to use your private Healthruo workspace.');
  return data.user;
};

export const healthruoApi = {
  async facilities({ countryCode, search } = {}) {
    let q = supabase.from('healthruo_facilities').select('*').eq('verification_status', 'verified').order('name');
    if (countryCode && countryCode !== 'WORLD') q = q.eq('country_code', countryCode);
    if (search?.trim()) q = q.or(`name.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%,facility_type.ilike.%${search.trim()}%`);
    const { data, error } = await q.limit(100);
    if (error) throw error;
    return data || [];
  },
  async professionals({ countryCode, search } = {}) {
    let q = supabase.from('healthruo_professionals').select('*,healthruo_facilities(name,city,country_code)').eq('verification_status', 'verified').order('full_name');
    if (countryCode && countryCode !== 'WORLD') q = q.eq('country_code', countryCode);
    if (search?.trim()) q = q.or(`full_name.ilike.%${search.trim()}%,profession.ilike.%${search.trim()}%`);
    const { data, error } = await q.limit(100);
    if (error) throw error;
    return data || [];
  },
  async appointments() {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_appointments').select('*,healthruo_facilities(name,city),healthruo_professionals(full_name,profession)').eq('patient_user_id', user.id).order('starts_at', { ascending: true }).limit(100);
    if (error) throw error;
    return data || [];
  },
  async requestAppointment({ professionalId, facilityId, appointmentType, startsAt, reason, notes }) {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_appointments').insert({ patient_user_id: user.id, professional_id: professionalId || null, facility_id: facilityId || null, appointment_type: appointmentType, starts_at: startsAt, reason: reason || null, notes: notes || null }).select().single();
    if (error) throw error;
    return data;
  },
  async tracking(type) {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_tracking_entries').select('*').eq('user_id', user.id).eq('tracker_type', type).order('entry_date', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  },
  async addTracking({ type, date, values, notes }) {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_tracking_entries').insert({ user_id: user.id, tracker_type: type, entry_date: date || undefined, values: values || {}, notes: notes || null }).select().single();
    if (error) throw error;
    return data;
  },
  async medications() {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_medications').select('*').eq('user_id', user.id).order('active', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async addMedication(payload) {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_medications').insert({ ...payload, user_id: user.id }).select().single();
    if (error) throw error;
    return data;
  },
  async records() {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_records').select('*,healthruo_facilities(name,city)').eq('patient_user_id', user.id).order('recorded_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  },
  async pregnancies() {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_pregnancies').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async addPregnancy(payload) {
    const user = await requireUser();
    const { data, error } = await supabase.from('healthruo_pregnancies').insert({ ...payload, user_id: user.id }).select().single();
    if (error) throw error;
    return data;
  },
};
