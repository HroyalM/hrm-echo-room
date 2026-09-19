'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('id', userData.user.id)
        .single();

      setDisplayName(data?.display_name || '');
      setBio(data?.bio || '');
      setLoading(false);
    };
    load();
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, bio })
      .eq('id', userData.user.id);

    if (error) toast.error(error.message);
    else toast.success('Profile saved');
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold">Profile</h1>
        <form onSubmit={save} className="mt-6 space-y-4">
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full px-4 py-3 rounded-xl border"
          />
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Bio"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border"
          />
          <button className="w-full py-3 rounded-xl bg-sky-500 text-white font-semibold">
            Save
          </button>
        </form>
        <Link href="/home" className="block mt-4 text-center text-sky-600">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
