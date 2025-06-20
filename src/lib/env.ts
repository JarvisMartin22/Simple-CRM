/**
 * Environment variable utilities
 * Provides safe access to environment variables with proper validation
 */

export class EnvironmentError extends Error {
  constructor(variableName: string) {
    super(`Environment variable ${variableName} is not defined. Please check your environment configuration.`);
    this.name = 'EnvironmentError';
  }
}

/**
 * Safely get an environment variable, throwing an error if it's undefined
 */
export function getRequiredEnv(variableName: string): string {
  const value = import.meta.env[variableName];
  
  if (!value || value === 'undefined') {
    throw new EnvironmentError(variableName);
  }
  
  return value;
}

/**
 * Safely get Supabase Functions URL
 */
export function getSupabaseFunctionsUrl(): string {
  return getRequiredEnv('VITE_SUPABASE_FUNCTIONS_URL');
}

/**
 * Safely get Supabase URL
 */
export function getSupabaseUrl(): string {
  return getRequiredEnv('VITE_SUPABASE_URL');
}

/**
 * Safely get Supabase Anon Key
 */
export function getSupabaseAnonKey(): string {
  return getRequiredEnv('VITE_SUPABASE_ANON_KEY');
}

/**
 * Get an environment variable with a fallback value
 */
export function getEnvWithFallback(variableName: string, fallback: string): string {
  const value = import.meta.env[variableName];
  
  if (!value || value === 'undefined') {
    return fallback;
  }
  
  return value;
}