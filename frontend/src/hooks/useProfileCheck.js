import { useEffect, useState } from 'react';
import { apiRequest } from '@/api';
import useAppStore from '@/store';

export const useProfileCheck = () => {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest('GET', 'profile/check');
        if (response.data.success) {
          setNeedsSetup(!response.data.isProfileComplete);
        }
      } catch (error) {
        console.error('Profile check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user]);

  return { needsSetup, loading };
};
