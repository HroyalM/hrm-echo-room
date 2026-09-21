'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Echo = { id: string; content: string; status: string; privacy?: string };

async function compress(file: File) {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  await new Promise(r => { img.onload = r; });
  const canvas = document.createElement('canvas');
  const size = 900;
  const scale = Math.min(size / img.width, size / img.height, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.7));
}

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [viewer, setViewer] = useState('');
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [form, setForm] = useState({
    username: '', full_name: '', display_name: '', bio: '', avatar_url: '', cover_url: '',
    hometown: '', current_city: '', workplace: '', school: '',
  });
  const setField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      setEmail(data.user.email || '');
      const { data: row } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (row) setForm({
        username: row.username || '', full_name: row.full_name || '', display_name: row.display_name || '',
        bio: row.bio || '', avatar_url: row.avatar_url || '', cover_url: row.cover_url || '',
        hometown: row.hometown || '', current_city: row.current_city || '',
        workplace: row.workplace || '', school: row.school || '',
      });
      const { data: echoData } = await supabase.from('echoes').select('id, content, status, privacy').eq('sender_id', data.user.id).order('created_at', { ascending: false });
      setEchoes((echoData || []) as Echo[]);
    });
  }, [router]);

  const upload = async (file: File, field: 'avatar_url' | 'cover_url') => {
    const blob = await compress(file);
    const path = `${userId}/${field}-${Date.now()}.jpg`;
    const bucket = field === 'avatar_url' ? 'avatars' : 'covers';
    const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setField(field, data.publicUrl);
    await supabase.from('profiles').update({ [field]: data.publicUrl }).eq('id', userId);
    toast.success('Photo saved');
  };

  const clearPhoto = async (field: 'avatar_url' | 'cover_url') => {
    setField(field, '');
    await supabase.from('profiles').update({ [field]: null }).eq('id', userId);
  };

  const save = async () => {
    const { error } = await supabase.from('profiles').update({
      ...form, display_name: form.display_name || form.full_name || form.username,
    }).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Saved'); setEditing(false); }
  };

  const removeEcho = async (id: string) => {
    if (!confirm('Delete this Echo?')) return;
    const { error } = await supabase.from('echoes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else setEchoes(p => p.filter(e => e.id !== id));
  };

  const name = form.display_name || form.full_name || form.username || email;

  return (
    <AppChrome avatar={form.avatar_url}>
      <div className="max-w-xl mx-auto pb-8">
        <div className="relative h-40 bg-gradient-to-r from-blue-700 to-indigo-700">
          {form.cover_url && (
            <img src={form.cover_url} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => setViewer(form.cover_url)} />
          )}
          <label className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center cursor-pointer">📷
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && upload(e.target.files[0], 'cover_url')} />
          </label>
          {form.cover_url && <button onClick={() => clearPhoto('cover_url')} className="absolute right-14 bottom-3 text-xs bg-black/60 rounded-full px-2 py-2">Delete cover</button>}
        </div>

        <div className="px-4 -mt-12">
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 rounded-full border-4 border-[#18191a] overflow-hidden bg-[#3a3b3c] cursor-pointer" onClick={() => form.avatar_url && setViewer(form.avatar_url)}>
              {form.avatar_url && <img src={form.avatar_url} className="w-full h-full object-cover" alt="" />}
            </div>
            <label className="absolute right-0 bottom-0 w-8 h-8 rounded-full bg-[#0866ff] flex items-center justify-center cursor-pointer text-sm">📷
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && upload(e.target.files[0], 'avatar_url')} />
            </label>
          </div>
          {form.avatar_url && <button onClick={() => clearPhoto('avatar_url')} className="mt-2 text-xs text-red-400">Delete photo</button>}

          <h1 className="mt-3 text-3xl font-bold">{name}</h1>
          {form.username && <p className="text-slate-400">@{form.username}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setEditing(!editing)} className="px-4 py-2 rounded-lg bg-white/10">{editing ? 'Close' : 'Edit profile'}</button>
            <Link href="/settings" className="px-4 py-2 rounded-lg bg-white/10">Settings</Link>
          </div>
        </div>

        {editing && (
          <div className="px-4 mt-4 space-y-2">
            <input value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="Name people see" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <textarea value={form.bio} onChange={e => setField('bio', e.target.value)} placeholder="Bio" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.current_city} onChange={e => setField('current_city', e.target.value)} placeholder="City" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <button onClick={save} className="w-full py-3 rounded-xl bg-[#0866ff] font-semibold">Save</button>
          </div>
        )}

        <div className="px-4 mt-8">
          <h2 className="font-bold">Your Echoes</h2>
          <div className="mt-3 space-y-3">
            {echoes.map(echo => (
              <div key={echo.id} className="rounded-xl bg-[#242526] p-4">
                <p className="text-xs text-slate-400">{echo.status} · {echo.privacy || 'public'}</p>
                <p className="mt-1">{echo.content}</p>
                <button onClick={() => removeEcho(echo.id)} className="mt-2 text-sm text-red-400">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewer('')}>
          <img src={viewer} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </AppChrome>
  );
}
