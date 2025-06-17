import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import api from '../api/axios.config';

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
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
       const response = await api.get('/api/patient/appointments');
       setAppointments(response.data);
    } catch (err) {
       setError('Failed to fetch appointments');
    } finally {
       setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAppointments();
  }, [user?.id]);

  return { appointments, isLoading, error, refresh: fetchAppointments };
}; 