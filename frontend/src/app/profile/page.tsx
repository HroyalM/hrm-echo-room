'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [echoes, setEchoes] = useState<{ id: string; content: string; scheduled_at: string; status: string }[]>([]);
  const [form, setForm] = useState({
    username: '', full_name: '', display_name: '', bio: '', avatar_url: '', cover_url: '',
    date_of_birth: '', hometown: '', current_city: '', workplace: '', school: '',
    gender: '', relationship_status: '',
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
        date_of_birth: row.date_of_birth || '', hometown: row.hometown || '', current_city: row.current_city || '',
        workplace: row.workplace || '', school: row.school || '', gender: row.gender || '',
        relationship_status: row.relationship_status || '',
      });
      const { data: echoData } = await supabase.from('echoes').select('id, content, scheduled_at, status').eq('sender_id', data.user.id).order('created_at', { ascending: false });
      setEchoes(echoData || []);
    });
  }, [router]);

  const save = async () => {
    const { error } = await supabase.from('profiles').update({
      ...form,
      display_name: form.display_name || form.full_name || form.username,
    }).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Saved'); setEditing(false); }
  };

  const name = form.display_name || form.full_name || form.username || email;

  return (
    <AppChrome avatar={form.avatar_url}>
      <div className="max-w-xl mx-auto pb-8">
        <div className="h-40 bg-gradient-to-r from-blue-700 to-indigo-700">
          {form.cover_url && <img src={form.cover_url} className="w-full h-full object-cover" alt="" />}
        </div>
        <div className="px-4 -mt-12">
          <div className="w-24 h-24 rounded-full border-4 border-[#18191a] overflow-hidden bg-[#3a3b3c]">
            {form.avatar_url && <img src={form.avatar_url} className="w-full h-full object-cover" alt="" />}
          </div>
          <h1 className="mt-3 text-3xl font-bold">{name}</h1>
          {form.username && <p className="text-slate-400">@{form.username}</p>}
          <p className="text-sm text-slate-400">{email}</p>
          {form.bio && <p className="mt-3">{form.bio}</p>}
          <div className="mt-3 text-sm text-slate-300 space-y-1">
            {form.current_city && <p>Lives in {form.current_city}</p>}
            {form.hometown && <p>From {form.hometown}</p>}
            {form.workplace && <p>Works at {form.workplace}</p>}
            {form.school && <p>Studied at {form.school}</p>}
            {form.gender && <p>{form.gender}</p>}
            {form.relationship_status && <p>{form.relationship_status}</p>}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setEditing(!editing)} className="px-4 py-2 rounded-lg bg-white/10">{editing ? 'Close' : 'Edit profile'}</button>
            <Link href="/settings" className="px-4 py-2 rounded-lg bg-white/10">Settings</Link>
          </div>
        </div>

        {editing && (
          <div className="px-4 mt-4 space-y-2">
            <input value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="Display name" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.username} onChange={e => setField('username', e.target.value)} placeholder="Username" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <textarea value={form.bio} onChange={e => setField('bio', e.target.value)} placeholder="Bio" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.current_city} onChange={e => setField('current_city', e.target.value)} placeholder="Current city" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.hometown} onChange={e => setField('hometown', e.target.value)} placeholder="Hometown" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.workplace} onChange={e => setField('workplace', e.target.value)} placeholder="Workplace" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <input value={form.school} onChange={e => setField('school', e.target.value)} placeholder="School" className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none" />
            <button onClick={save} className="w-full py-3 rounded-xl bg-[#0866ff] font-semibold">Save</button>
          </div>
        )}

        <div className="px-4 mt-8">
          <h2 className="font-bold">Your Echoes</h2>
          <div className="mt-3 space-y-3">
            {echoes.map(echo => (
              <div key={echo.id} className="rounded-xl bg-[#242526] p-4">
                <p className="text-xs text-slate-400">{echo.status}</p>
                <p className="mt-1">{echo.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
