import { describe, it, expect, beforeEach, vi } from 'vitest';
import axiosClient from '../axiosClient';

describe('axiosClient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has correct base URL', () => {
    const baseURL = axiosClient.defaults.baseURL;
    expect(baseURL).toBeTruthy();
    expect(typeof baseURL).toBe('string');
  });

  it('sets default headers', () => {
    expect(axiosClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('adds token to request when available', () => {
    localStorage.setItem('access_token', 'test-token');
    
    // Mock interceptor
    const requestInterceptor = axiosClient.interceptors.request.handlers[0];
    const config = { headers: {} };
    const result = requestInterceptor.fulfilled(config);
    
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('does not add token when not available', () => {
    localStorage.removeItem('access_token');
    
    const requestInterceptor = axiosClient.interceptors.request.handlers[0];
    const config = { headers: {} };
    const result = requestInterceptor.fulfilled(config);
    
    expect(result.headers.Authorization).toBeUndefined();
  });
});

