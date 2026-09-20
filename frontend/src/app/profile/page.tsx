'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [echoes, setEchoes] = useState<{ id: string; content: string; scheduled_at: string; status: string }[]>([]);
  const [form, setForm] = useState({
    username: '', full_name: '', display_name: '', bio: '', avatar_url: '', cover_url: '',
    date_of_birth: '', hometown: '', current_city: '', workplace: '', school: '',
    gender: '', relationship_status: '', website: '', email_visibility: 'private',
  });
  const setField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push('/auth/login'); return; }
      setEmail(userData.user.email || '');
      setUserId(userData.user.id);
      const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      if (data) setForm({
        username: data.username || '', full_name: data.full_name || '', display_name: data.display_name || '',
        bio: data.bio || '', avatar_url: data.avatar_url || '', cover_url: data.cover_url || '',
        date_of_birth: data.date_of_birth || '', hometown: data.hometown || '', current_city: data.current_city || '',
        workplace: data.workplace || '', school: data.school || '', gender: data.gender || '',
        relationship_status: data.relationship_status || '', website: data.website || '',
        email_visibility: data.email_visibility || 'private',
      });
      const { data: echoData } = await supabase.from('echoes').select('id, content, scheduled_at, status').eq('sender_id', userData.user.id).order('created_at', { ascending: false });
      setEchoes(echoData || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const upload = async (file: File, bucket: 'avatars' | 'covers', field: 'avatar_url' | 'cover_url') => {
    setField(field, URL.createObjectURL(file));
    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setField(field, data.publicUrl);
    await supabase.from('profiles').update({ [field]: data.publicUrl }).eq('id', userId);
  };

  const save = async () => {
    const { error } = await supabase.from('profiles').update({
      username: form.username, full_name: form.full_name,
      display_name: form.display_name || form.full_name || form.username,
      bio: form.bio, avatar_url: form.avatar_url, cover_url: form.cover_url,
      date_of_birth: form.date_of_birth || null, hometown: form.hometown, current_city: form.current_city,
      workplace: form.workplace, school: form.school, gender: form.gender,
      relationship_status: form.relationship_status, website: form.website, email_visibility: form.email_visibility,
    }).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Saved'); setEditing(false); }
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/'); };
  if (loading) return <p className="min-h-screen bg-[#18191a] text-white p-6">Loading…</p>;
  const name = form.display_name || form.full_name || form.username || 'Add your name';

  return (
    <AppChrome avatar={form.avatar_url}>
      <div className="max-w-xl mx-auto bg-[#242526] min-h-screen pb-8">
        <div className="relative">
          <div className="h-44 bg-gradient-to-r from-blue-700 to-indigo-700">
            {form.cover_url && <img src={form.cover_url} className="w-full h-full object-cover" alt="" />}
          </div>
          <label className="absolute right-3 top-3 bg-black/60 rounded-full px-3 py-2 text-sm">
            Add cover
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && upload(e.target.files[0], 'covers', 'cover_url')} />
          </label>
          <div className="absolute left-4 -bottom-12">
            <div className="relative w-28 h-28 rounded-full border-4 border-[#242526] bg-slate-700 overflow-hidden">
              {form.avatar_url ? <img src={form.avatar_url} className="w-full h-full object-cover" alt="" /> : null}
              <label className="absolute right-0 bottom-0 bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                +
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && upload(e.target.files[0], 'avatars', 'avatar_url')} />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-16 px-4">
          <h1 className="text-3xl font-bold">{name}</h1>
          {form.username && <p className="text-slate-400">@{form.username}</p>}
          {form.bio && <p className="mt-2">{form.bio}</p>}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link href="/echoes/create" className="text-center py-2 rounded-lg bg-blue-600 font-semibold">Create</Link>
            <button onClick={() => setEditing(!editing)} className="py-2 rounded-lg bg-white/10 font-semibold">{editing ? 'Close' : 'Edit'}</button>
            <Link href="/settings" className="text-center py-2 rounded-lg bg-white/10 font-semibold">Settings</Link>
          </div>
        </div>

        <div className="mt-6 mx-4 rounded-xl bg-[#3a3b3c] p-4">
          <h2 className="font-bold">About</h2>
          {form.current_city && <p className="mt-2 text-sm">Lives in {form.current_city}</p>}
          {form.hometown && <p className="mt-1 text-sm">From {form.hometown}</p>}
          {form.workplace && <p className="mt-1 text-sm">Works at {form.workplace}</p>}
          {form.school && <p className="mt-1 text-sm">Studied at {form.school}</p>}
        </div>

        {editing && (
          <div className="mt-4 mx-4 space-y-3">
            <input value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="Display name" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.username} onChange={e => setField('username', e.target.value)} placeholder="Username" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <textarea value={form.bio} onChange={e => setField('bio', e.target.value)} placeholder="Bio" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <label className="block text-sm text-slate-400">Date of birth</label>
            <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.hometown} onChange={e => setField('hometown', e.target.value)} placeholder="Hometown" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.current_city} onChange={e => setField('current_city', e.target.value)} placeholder="Current city" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <button onClick={save} className="w-full py-3 rounded-xl bg-blue-600 font-semibold">Save</button>
            <button onClick={logout} className="w-full py-3 rounded-xl text-red-400">Log out</button>
          </div>
        )}

        <div className="mt-6 px-4">
          <h2 className="font-bold text-lg">Posts</h2>
          <div className="mt-3 space-y-3">
            {echoes.map(echo => (
              <div key={echo.id} className="rounded-xl bg-[#3a3b3c] p-4">
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-slate-400">{echo.status} · {new Date(echo.scheduled_at).toLocaleString()}</p>
                <p className="mt-2">{echo.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
