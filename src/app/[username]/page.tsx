import UserProfileClient from './UserProfileClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  return <UserProfileClient username={username} />;
} 