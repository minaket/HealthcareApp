import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getApi } from '../api/axios.config';

export interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  consultationType: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export const useAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
       setIsLoading(true);
       setError(null);
       const apiInstance = await getApi();
       if (!apiInstance) {
         throw new Error('Failed to initialize API client');
       }
       const response = await apiInstance.get('/api/patient/appointments');
       setAppointments(response.data.appointments || response.data);
    } catch (err) {
       setError('Failed to fetch appointments');
    } finally {
       setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAppointments();
  }, [user?.id]);

  return { appointments, isLoading, error, refetch: fetchAppointments };
}; 