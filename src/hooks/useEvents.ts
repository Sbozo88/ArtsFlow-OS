import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { eventService } from '../services/eventService';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const loadData = async () => {
      try {
        const data = await eventService.getEvents(organisationId);
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [organisationId]);

  return { events, loading, error };
};

export const useEvent = (eventId?: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !eventId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const loadData = async () => {
      try {
        const data = await eventService.getEvent(organisationId, eventId);
        if (mounted) {
          setEvent(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [organisationId, eventId]);

  return { event, loading, error };
};
