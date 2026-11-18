const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

export const API_URL: string = (env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
