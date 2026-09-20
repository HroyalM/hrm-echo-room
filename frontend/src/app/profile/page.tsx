'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

const PLACES = [
  'United States', 'United Kingdom', 'United Arab Emirates', 'Nigeria', 'Port Harcourt, Nigeria',
  'Lagos, Nigeria', 'Abuja, Nigeria', 'London, United Kingdom', 'Manchester, United Kingdom',
  'New York, United States', 'Los Angeles, United States', 'Houston, United States',
  'Accra, Ghana', 'Nairobi, Kenya', 'Johannesburg, South Africa', 'Toronto, Canada',
  'Paris, France', 'Berlin, Germany', 'Dubai, United Arab Emirates', 'Mumbai, India',
];
const SCHOOLS = ['University of Port Harcourt', 'University of Lagos', 'University of Ibadan', 'UNN', 'UNIPORT', 'Harvard University', 'Oxford University', 'MIT'];
const WORKPLACES = ['Google', 'Microsoft', 'Meta', 'Amazon', 'Self-employed', 'Student', 'Freelancer'];
const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const RELATIONSHIPS = ['Single', 'In a relationship', 'Engaged', 'Married', 'It\'s complicated', 'Prefer not to say'];

function SuggestBox({
  label, value, onChange, options, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, 6);
    return options.filter(o => o.toLowerCase().includes(q)).slice(0, 8);
  }, [value, options]);

  return (
    <div className="relative">
      <label className="block mb-1 text-sm text-slate-400">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-2xl bg-slate-900 border border-white/10 max-h-48 overflow-auto">
          {matches.map(item => (
            <button type="button" key={item} onMouseDown={() => onChange(item)}
              className="block w-full text-left px-4 py-2 hover:bg-white/10">
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    username: '', full_name: '', display_name: '', bio: '', avatar_url: '',
    date_of_birth: '', hometown: '', current_city: '', workplace: '', school: '',
    gender: '', relationship_status: '', website: '',
  });

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push('/auth/login'); return; }
      setEmail(userData.user.email || '');
      const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      if (data) {
        setForm({
          username: data.username || '',
          full_name: data.full_name || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          date_of_birth: data.date_of_birth || '',
          hometown: data.hometown || '',
          current_city: data.current_city || '',
          workplace: data.workplace || '',
          school: data.school || '',
          gender: data.gender || '',
          relationship_status: data.relationship_status || '',
          website: data.website || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const uploadPhoto = async (file: File) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userData.user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setField('avatar_url', data.publicUrl);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userData.user.id);
    toast.success('Photo uploaded');
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from('profiles').update({
      username: form.username,
      full_name: form.full_name,
      display_name: form.display_name || form.full_name || form.username,
      bio: form.bio,
      avatar_url: form.avatar_url,
      date_of_birth: form.date_of_birth || null,
      hometown: form.hometown,
      current_city: form.current_city,
      workplace: form.workplace,
      school: form.school,
      gender: form.gender,
      relationship_status: form.relationship_status,
      website: form.website,
    }).eq('id', userData.user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile saved');
  };

  if (loading) return <p className="min-h-screen bg-slate-950 text-white p-6">Loading…</p>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Home</Link>
        <div className="mt-6 rounded-3xl bg-white/5 overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-sky-600 to-violet-600" />
          <div className="px-6 pb-6 -mt-12">
            <div className="w-24 h-24 rounded-full border-4 border-slate-950 bg-white/10 overflow-hidden">
              {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{form.display_name || form.full_name || email}</h1>
            <p className="text-sm text-slate-500">{email}</p>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-3">
          <label className="block text-sm text-slate-400">Profile photo</label>
          <input type="file" accept="image/*" onChange={e => e.target.files && uploadPhoto(e.target.files[0])} />
          {uploading && <p className="text-sm text-sky-400">Uploading…</p>}

          <input value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Full name"
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="Display name"
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <textarea value={form.bio} onChange={e => setField('bio', e.target.value)} placeholder="Bio" rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />

          <div>
            <label className="block mb-1 text-sm text-slate-400">Date of birth</label>
            <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          </div>

          <SuggestBox label="Hometown" value={form.hometown} onChange={v => setField('hometown', v)} options={PLACES} placeholder="Start typing a city or country" />
          <SuggestBox label="Current city" value={form.current_city} onChange={v => setField('current_city', v)} options={PLACES} placeholder="Start typing a city or country" />
          <SuggestBox label="Workplace" value={form.workplace} onChange={v => setField('workplace', v)} options={WORKPLACES} placeholder="Company or job" />
          <SuggestBox label="School" value={form.school} onChange={v => setField('school', v)} options={SCHOOLS} placeholder="School or university" />

          <div>
            <label className="block mb-1 text-sm text-slate-400">Gender</label>
            <select value={form.gender} onChange={e => setField('gender', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 outline-none">
              <option value="">Select gender</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm text-slate-400">Relationship status</label>
            <select value={form.relationship_status} onChange={e => setField('relationship_status', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 outline-none">
              <option value="">Select status</option>
              {RELATIONSHIPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <input value={form.website} onChange={e => setField('website', e.target.value)} placeholder="Website"
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button className="w-full py-3 rounded-2xl bg-sky-500 font-semibold">Save profile</button>
        </form>
      </div>
    </div>
  );
}
