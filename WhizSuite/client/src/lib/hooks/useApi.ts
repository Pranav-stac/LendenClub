import { useState, useCallback } from 'react';
import { api } from '../api/client';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    body?: any
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api[method]<T>(url, body);
      setData(response.data ?? null);
      options.onSuccess?.(response.data);
      return response.data;
    } catch (err: any) {
      const error = new Error(err.message || 'An error occurred');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const get = useCallback((url: string) => execute('get', url), [execute]);
  const post = useCallback((url: string, body?: any) => execute('post', url, body), [execute]);
  const put = useCallback((url: string, body?: any) => execute('put', url, body), [execute]);
  const patch = useCallback((url: string, body?: any) => execute('patch', url, body), [execute]);
  const del = useCallback((url: string) => execute('delete', url), [execute]);

  return { data, error, isLoading, get, post, put, patch, delete: del };
}

export function usePosts() {
  const api = useApi();
  return {
    ...api,
    getPosts: (params?: Record<string, any>) => api.get(`/posts?${new URLSearchParams(params).toString()}`),
    getPost: (id: string) => api.get(`/posts/${id}`),
    createPost: (data: any) => api.post('/posts', data),
    updatePost: (id: string, data: any) => api.patch(`/posts/${id}`, data),
    deletePost: (id: string) => api.delete(`/posts/${id}`),
    schedulePost: (id: string, scheduledAt: Date) => api.post(`/posts/${id}/schedule`, { scheduledAt }),
    publishPost: (id: string) => api.post(`/posts/${id}/publish`),
  };
}

export function useClients() {
  const api = useApi();
  return {
    ...api,
    getClients: () => api.get('/clients'),
    getClient: (id: string) => api.get(`/clients/${id}`),
    createClient: (data: any) => api.post('/clients', data),
    updateClient: (id: string, data: any) => api.patch(`/clients/${id}`, data),
    deleteClient: (id: string) => api.delete(`/clients/${id}`),
  };
}

export function useBrands() {
  const api = useApi();
  return {
    ...api,
    getBrands: (clientId?: string) => api.get(`/brands${clientId ? `?clientId=${clientId}` : ''}`),
    getBrand: (id: string) => api.get(`/brands/${id}`),
    createBrand: (data: any) => api.post('/brands', data),
    updateBrand: (id: string, data: any) => api.patch(`/brands/${id}`, data),
    deleteBrand: (id: string) => api.delete(`/brands/${id}`),
  };
}

export function useCalendar() {
  const api = useApi();
  return {
    ...api,
    getEvents: (start: Date, end: Date) => api.get(`/calendar?start=${start.toISOString()}&end=${end.toISOString()}`),
    createEvent: (data: any) => api.post('/calendar', data),
    updateEvent: (id: string, data: any) => api.patch(`/calendar/${id}`, data),
    deleteEvent: (id: string) => api.delete(`/calendar/${id}`),
  };
}

export function useReviews() {
  const api = useApi();
  return {
    ...api,
    getReviews: () => api.get('/reviews'),
    getReview: (id: string) => api.get(`/reviews/${id}`),
    createReview: (data: any) => api.post('/reviews', data),
    submitFeedback: (id: string, postId: string, feedback: any) => api.post(`/reviews/${id}/feedback`, { postId, ...feedback }),
  };
}

