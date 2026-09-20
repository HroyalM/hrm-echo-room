'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Group = { id: string; name: string };

export default function GroupsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);

  const load = async () => {
    const { data } = await supabase.from('groups').select('id, name').order('created_at', { ascending: false });
    setGroups(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else setUserId(data.user.id);
    });
    load();
  }, [router]);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('groups').insert({ name, created_by: userId }).select('id').single();
    if (error) toast.error(error.message);
    else {
      if (memberEmail && data) {
        await supabase.from('group_members').insert({ group_id: data.id, user_email: memberEmail });
      }
      setName('');
      setMemberEmail('');
      toast.success('Group created');
      load();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold">Groups</h1>
        <form onSubmit={createGroup} className="mt-6 space-y-3">
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Group name"
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="Add a member email"
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button className="w-full py-3 rounded-2xl bg-sky-500 font-semibold">Create group</button>
        </form>
        <div className="mt-8 space-y-3">
          {groups.map(g => (
            <div key={g.id} className="rounded-2xl bg-white/5 p-4">{g.name}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
