export async function getUserAddresses(userId: string) {
  if (!userId) return [];

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/address?userId=${userId}`, {
    cache: 'no-store', // Always fetch fresh
  });

  if (!res.ok) {
    console.error('Failed to fetch addresses');
    return [];
  }

  return res.json();
}
