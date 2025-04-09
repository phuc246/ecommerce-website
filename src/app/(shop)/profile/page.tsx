import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import UserProfileTabs from '@/components/user/UserProfileTabs';

export default async function ProfilePage() {
  // Get the session
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session) {
    redirect('/login?callbackUrl=/profile');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Trang cá nhân</h1>
      <UserProfileTabs user={session.user} />
    </div>
  );
} 