'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppChrome from '@/components/AppChrome';

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  account_status: string | null;
  is_admin: boolean | null;
};
type Echo = { id: string; content: string; status: string; sender_id: string };
type Post = { id: string; content: string; author_id: string };

export default function AdminPage() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [active, setActive] = useState<UserRow | null>(null);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      const { data: me } = await supabase.from('profiles').select('is_admin, avatar_url').eq('id', data.user.id).single();
      if (!me?.is_admin) { toast.error('Admin only'); router.push('/home'); return; }
      setAvatar(me.avatar_url || '');
      setOk(true);
      const { data: rows } = await supabase.from('profiles').select('id, email, display_name, username, bio, account_status, is_admin');
      setUsers((rows || []) as UserRow[]);
    });
  }, [router]);

  const open = async (user: UserRow) => {
    setActive(user);
    const [{ data: echoData }, { data: postData }] = await Promise.all([
      supabase.from('echoes').select('id, content, status, sender_id').eq('sender_id', user.id),
      supabase.from('posts').select('id, content, author_id').eq('author_id', user.id),
    ]);
    setEchoes((echoData || []) as Echo[]);
    setPosts((postData || []) as Post[]);
  };

  const setStatus = async (status: string) => {
    if (!active) return;
    const { error } = await supabase.from('profiles').update({ account_status: status }).eq('id', active.id);
    if (error) toast.error(error.message);
    else {
      toast.success(status);
      setActive({ ...active, account_status: status });
      setUsers(p => p.map(u => u.id === active.id ? { ...u, account_status: status } : u));
    }
  };

  const resetMail = async () => {
    if (!active?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(active.email, {
      redirectTo: 'https://echo-room-2026.vercel.app/auth/reset',
    });
    if (error) toast.error(error.message);
    else toast.success('Reset email sent');
  };

  const delEcho = async (id: string) => {
    if (!confirm('Delete this Echo?')) return;
    const { error } = await supabase.from('echoes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else setEchoes(p => p.filter(e => e.id !== id));
  };

  const delPost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) toast.error(error.message);
    else setPosts(p => p.filter(e => e.id !== id));
  };

  const shown = users.filter(u => {
    const s = q.toLowerCase();
    return !s || (u.email || '').toLowerCase().includes(s) || (u.display_name || '').toLowerCase().includes(s) || (u.username || '').toLowerCase().includes(s);
  });

  if (!ok) return null;

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4 pb-8">
        <h1 className="text-2xl font-bold">Admin</h1>
        {!active && (
          <>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search email or name" className="mt-4 w-full px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
            <div className="mt-4 space-y-2">
              {shown.map(u => (
                <button key={u.id} onClick={() => open(u)} className="w-full text-left p-4 rounded-2xl bg-[#242526]">
                  <p className="font-semibold">{u.display_name || u.username || u.email}</p>
                  <p className="text-sm text-slate-400">{u.email} · {u.account_status || 'active'}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {active && (
          <div>
            <button onClick={() => setActive(null)} className="text-[#0866ff] text-sm">← Users</button>
            <h2 className="mt-3 text-2xl font-bold">{active.display_name || active.email}</h2>
            <p className="text-slate-400">{active.email}</p>
            <p className="mt-2 text-sm">Status: {active.account_status || 'active'}</p>
            {active.bio && <p className="mt-2">{active.bio}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setStatus('suspended')} className="py-3 rounded-xl bg-white/10">Suspend</button>
              <button onClick={() => setStatus('active')} className="py-3 rounded-xl bg-white/10">Restore</button>
              <button onClick={() => setStatus('disabled')} className="py-3 rounded-xl bg-red-500/20">Disable</button>
              <button onClick={resetMail} className="py-3 rounded-xl bg-white/10">Send reset email</button>
            </div>
            <h3 className="mt-8 font-bold">Echoes</h3>
            <div className="mt-2 space-y-2">
              {echoes.map(e => (
                <div key={e.id} className="rounded-xl bg-[#242526] p-3">
                  <p>{e.content}</p>
                  <button onClick={() => delEcho(e.id)} className="mt-2 text-sm text-red-400">Delete</button>
                </div>
              ))}
            </div>
            <h3 className="mt-8 font-bold">Posts</h3>
            <div className="mt-2 space-y-2">
              {posts.map(p => (
                <div key={p.id} className="rounded-xl bg-[#242526] p-3">
                  <p>{p.content}</p>
                  <button onClick={() => delPost(p.id)} className="mt-2 text-sm text-red-400">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppChrome>
  );
}
