'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

export default function SettingsPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [avatar, setAvatar] = useState('');
  const [theme, setTheme] = useState('dark');
  const [form, setForm] = useState({
    privacy_profile: 'public', privacy_friends: 'friends', privacy_posts: 'friends',
    privacy_echoes: 'friends', email_visibility: 'private',
  });

  useEffect(() => {
    const saved = localStorage.getItem('echo-theme') || 'dark';
    setTheme(saved);
    document.documentElement.classList.toggle('light', saved === 'light');
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setId(data.user.id);
      const { data: row } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (row) {
        setAvatar(row.avatar_url || '');
        setForm({
          privacy_profile: row.privacy_profile || 'public',
          privacy_friends: row.privacy_friends || 'friends',
          privacy_posts: row.privacy_posts || 'friends',
          privacy_echoes: row.privacy_echoes || 'friends',
          email_visibility: row.email_visibility || 'private',
        });
      }
    });
  }, [router]);

  const changeTheme = (value: string) => {
    setTheme(value);
    localStorage.setItem('echo-theme', value);
    document.documentElement.classList.toggle('light', value === 'light');
  };

  const save = async () => {
    const { error } = await supabase.from('profiles').update(form).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Saved');
  };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Settings & privacy</h1>
        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Theme</h2>
          <select value={theme} onChange={e => changeTheme(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c]">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </section>
        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Privacy</h2>
          <select value={form.privacy_profile} onChange={e => setForm({ ...form, privacy_profile: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c]">
            <option value="public">Profile: public</option>
            <option value="friends">Profile: friends</option>
            <option value="private">Profile: only me</option>
          </select>
          <select value={form.email_visibility} onChange={e => setForm({ ...form, email_visibility: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c]">
            <option value="private">Email: only me</option>
            <option value="friends">Email: friends</option>
            <option value="public">Email: public</option>
          </select>
          <button onClick={save} className="w-full py-3 rounded-xl bg-[#0866ff] font-semibold">Save</button>
        </section>
        <Link href="/profile" className="block">Edit profile</Link>
      </div>
    </AppChrome>
  );
}
