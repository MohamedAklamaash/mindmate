import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../store/userStore';

export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.push('/');
  }, [hydrated, isAuthenticated, router]);

  return { ready: hydrated && isAuthenticated };
}
