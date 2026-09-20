'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Friend = { email: string; name: string; bio: string; avatar: string };

export default function UserPage() {
  const router = useRouter();
  const [me, setMe] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [active, setActive] = useState<Friend | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      const myEmail = data.user.email || '';
      setMe(myEmail);

      const { data: rows } = await supabase
        .from('friendships')
        .select('requester_id, addressee_email, status')
        .eq('status', 'accepted');

      const list: Friend[] = [];
      for (const row of rows || []) {
        let email = row.addressee_email;
        if (email.toLowerCase() === myEmail.toLowerCase()) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, display_name, bio, avatar_url')
            .eq('id', row.requester_id)
            .maybeSingle();
          if (profile?.email) {
            list.push({
              email: profile.email,
              name: profile.display_name || profile.email,
              bio: profile.bio || 'No bio yet',
              avatar: profile.avatar_url || '',
            });
          }
        } else if (true) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, display_name, bio, avatar_url')
            .eq('email', email)
            .maybeSingle();
          list.push({
            email,
            name: profile?.display_name || email,
            bio: profile?.bio || 'No bio yet',
            avatar: profile?.avatar_url || '',
          });
        }
      }
      setFriends(list);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Home</Link>
        <h1 className="mt-4 text-3xl font-bold">{active ? 'Friend profile' : 'Friends'}</h1>

        {!active && (
          <div className="mt-6 space-y-3">
            {friends.map(friend => (
              <button key={friend.email} onClick={() => setActive(friend)} className="w-full text-left rounded-2xl bg-white/10 p-4">
                <p className="font-semibold">{friend.name}</p>
                <p className="text-sm text-slate-400">{friend.email}</p>
              </button>
            ))}
          </div>
        )}

        {active && (
          <div className="mt-6 rounded-3xl bg-white/10 p-6">
            <button onClick={() => setActive(null)} className="text-sky-400 text-sm">← Back</button>
            <div className="mt-4 w-24 h-24 rounded-full bg-white/10 overflow-hidden">
              {active.avatar ? <img src={active.avatar} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <h2 className="mt-4 text-2xl font-bold">{active.name}</h2>
            <p className="text-slate-400">{active.email}</p>
            <p className="mt-4">{active.bio}</p>
            <Link href="/chat" className="mt-6 inline-block px-4 py-2 rounded-full bg-sky-500">
              Message
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
