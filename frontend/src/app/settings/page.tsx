'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [form, setForm] = useState({
    privacy_profile: 'public',
    privacy_friends: 'friends',
    privacy_posts: 'friends',
    privacy_echoes: 'friends',
    email_visibility: 'private',
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setId(data.user.id);
      const { data: row } = await supabase.from('profiles').select('privacy_profile, privacy_friends, privacy_posts, privacy_echoes, email_visibility').eq('id', data.user.id).single();
      if (row) setForm({
        privacy_profile: row.privacy_profile || 'public',
        privacy_friends: row.privacy_friends || 'friends',
        privacy_posts: row.privacy_posts || 'friends',
        privacy_echoes: row.privacy_echoes || 'friends',
        email_visibility: row.email_visibility || 'private',
      });
    });
  }, [router]);

  const save = async () => {
    const { error } = await supabase.from('profiles').update(form).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Privacy saved');
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/'); };

  const Select = ({ label, keyName }: { label: string; keyName: keyof typeof form }) => (
    <div>
      <label className="block mb-1 text-sm text-slate-400">{label}</label>
      <select value={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#3a3b3c] outline-none">
        <option value="public">Public</option>
        <option value="friends">Friends</option>
        <option value="private">Only me</option>
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#18191a] text-white p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <Link href="/profile" className="text-sky-400 text-sm">← Profile</Link>
        <h1 className="text-3xl font-bold">Settings & privacy</h1>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <h2 className="font-bold">Who can see what</h2>
          <Select label="Your profile" keyName="privacy_profile" />
          <Select label="Your friends list" keyName="privacy_friends" />
          <Select label="Your posts" keyName="privacy_posts" />
          <Select label="Your Echoes" keyName="privacy_echoes" />
          <Select label="Your email" keyName="email_visibility" />
          <button onClick={save} className="w-full py-3 rounded-xl bg-blue-600 font-semibold">Save</button>
        </section>

        <section className="rounded-2xl bg-[#242526] p-4 space-y-3">
          <Link href="/profile" className="block">Edit profile</Link>
          <Link href="/auth/reset" className="block">Change password</Link>
          <Link href="/notifications" className="block">Notifications</Link>
          <Link href="/friends" className="block">Friends</Link>
          <button onClick={logout} className="text-red-400">Log out</button>
        </section>
      </div>
    </div>
  );
}
