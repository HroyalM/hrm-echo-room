'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [echoes, setEchoes] = useState<{ id: string; content: string; scheduled_at: string; status: string }[]>([]);
  const [form, setForm] = useState({
    username: '', full_name: '', display_name: '', bio: '', avatar_url: '', cover_url: '',
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
          username: data.username || '', full_name: data.full_name || '', display_name: data.display_name || '',
          bio: data.bio || '', avatar_url: data.avatar_url || '', cover_url: data.cover_url || '',
          date_of_birth: data.date_of_birth || '', hometown: data.hometown || '', current_city: data.current_city || '',
          workplace: data.workplace || '', school: data.school || '', gender: data.gender || '',
          relationship_status: data.relationship_status || '', website: data.website || '',
        });
      }

      const { data: echoData } = await supabase
        .from('echoes')
        .select('id, content, scheduled_at, status')
        .eq('sender_id', userData.user.id)
        .order('created_at', { ascending: false });
      setEchoes(echoData || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const uploadPhoto = async (file: File) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const path = `${userData.user.id}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setField('avatar_url', data.publicUrl);
    toast.success('Photo uploaded');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from('profiles').update({
      username: form.username, full_name: form.full_name,
      display_name: form.display_name || form.full_name || form.username,
      bio: form.bio, avatar_url: form.avatar_url, date_of_birth: form.date_of_birth || null,
      hometown: form.hometown, current_city: form.current_city, workplace: form.workplace,
      school: form.school, gender: form.gender, relationship_status: form.relationship_status, website: form.website,
    }).eq('id', userData.user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile saved');
  };

  if (loading) return <p className="min-h-screen bg-slate-950 text-white p-6">Loading…</p>;
  const shownName = form.display_name || form.full_name || form.username || email;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Home</Link>

        <div className="mt-6 rounded-3xl bg-white/5 overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-sky-600 to-violet-600">
            {form.cover_url && <img src={form.cover_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="px-6 pb-6 -mt-12">
            <div className="w-24 h-24 rounded-full border-4 border-slate-950 bg-white/10 overflow-hidden">
              {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{shownName}</h1>
            {form.username && <p className="text-slate-400">@{form.username}</p>}
            <p className="text-sm text-slate-500">{email}</p>
            <p className="mt-3 text-slate-300">{form.bio}</p>
            <p className="mt-2 text-sm text-slate-400">
              {[form.current_city, form.hometown, form.workplace, form.school].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <h2 className="mt-8 text-xl font-bold">Your Echoes</h2>
        <div className="mt-3 space-y-3">
          {echoes.length === 0 && <p className="text-slate-400">No Echoes on your profile yet.</p>}
          {echoes.map(echo => (
            <div key={echo.id} className="rounded-2xl bg-white/5 p-4">
              <p className="whitespace-pre-wrap">{echo.content}</p>
              <p className="mt-2 text-sm text-slate-400">{echo.status} · {new Date(echo.scheduled_at).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-xl font-bold">Edit profile</h2>
        <form onSubmit={save} className="mt-3 space-y-3">
          <input type="file" accept="image/*" onChange={e => e.target.files && uploadPhoto(e.target.files[0])} />
          <input value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="Display name" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.username} onChange={e => setField('username', e.target.value)} placeholder="Username" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <textarea value={form.bio} onChange={e => setField('bio', e.target.value)} placeholder="Bio" rows={3} className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.hometown} onChange={e => setField('hometown', e.target.value)} placeholder="Hometown" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.current_city} onChange={e => setField('current_city', e.target.value)} placeholder="Current city" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.workplace} onChange={e => setField('workplace', e.target.value)} placeholder="Workplace" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.school} onChange={e => setField('school', e.target.value)} placeholder="School" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.gender} onChange={e => setField('gender', e.target.value)} placeholder="Gender" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.relationship_status} onChange={e => setField('relationship_status', e.target.value)} placeholder="Relationship status" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input value={form.website} onChange={e => setField('website', e.target.value)} placeholder="Website" className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button className="w-full py-3 rounded-2xl bg-sky-500 font-semibold">Save profile</button>
        </form>
      </div>
    </div>
  );
}
