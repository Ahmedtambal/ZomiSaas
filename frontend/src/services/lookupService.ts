// Lookup service for reference data
import api from './apiClient';

export interface LookupStatus {
  exists: boolean;
  count: number;
  status: string;
  error?: string;
}

/**
 * Fetch all available nationalities
 */
export const getNationalities = async (): Promise<string[]> => {
  try {
    const response = await api.get<string[]>('/api/lookups/nationalities');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch nationalities:', error);
    // Return fallback list on error
    return ['British', 'Irish', 'American', 'Canadian', 'Australian', 'Other'];
  }
};

/**
 * Check status of nationalities lookup table
 */
export const checkNationalitiesTable = async (): Promise<LookupStatus> => {
  try {
    const response = await api.get<LookupStatus>('/api/lookups/nationalities/check');
    return response.data;
  } catch (error) {
    console.error('Failed to check nationalities table:', error);
    return {
      exists: false,
      count: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
