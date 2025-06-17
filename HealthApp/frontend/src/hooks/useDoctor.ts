import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getApi } from '../api/axios.config';
import { Doctor } from '../types/doctor';

interface UseDoctorReturn {
  doctor: Doctor | null;
  loading: boolean;
  error: string | null;
  fetchDoctorProfile: () => Promise<void>;
  updateDoctorProfile: (data: Partial<Doctor>) => Promise<void>;
  updateAvailability: (availability: Doctor['availability']) => Promise<void>;
}

export const useDoctor = (): UseDoctorReturn => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctorProfile = useCallback(async () => {
    if (!user || user.role !== 'doctor') {
      setError('User is not a doctor');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiInstance = await getApi();
      const response = await apiInstance.get(`/api/doctors/${user.id}`);
      setDoctor(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctor profile');
      console.error('Error fetching doctor profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateDoctorProfile = useCallback(async (data: Partial<Doctor>) => {
    if (!user || user.role !== 'doctor') {
      setError('User is not a doctor');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiInstance = await getApi();
      const response = await apiInstance.patch(`/api/doctors/${user.id}`, data);
      setDoctor(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update doctor profile');
      console.error('Error updating doctor profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateAvailability = useCallback(async (availability: Doctor['availability']) => {
    if (!user || user.role !== 'doctor') {
      setError('User is not a doctor');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const apiInstance = await getApi();
      const response = await apiInstance.patch(`/api/doctors/${user.id}/availability`, { availability });
      setDoctor(prev => prev ? { ...prev, availability } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability');
      console.error('Error updating availability:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    doctor,
    loading,
    error,
    fetchDoctorProfile,
    updateDoctorProfile,
    updateAvailability,
  };
}; 