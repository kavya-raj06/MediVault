import Constants from 'expo-constants';

import { Platform } from 'react-native';

// Dynamically discover the local machine's IP address when running under Expo local dev server,
// allowing physical test devices and emulators to communicate with our Express backend on port 5001.
const getBaseUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5001`;
  }
  // Fallback: 10.0.2.2 is the host machine for Android emulators. For iOS/Web, use localhost.
  return Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
};

const BASE_URL = getBaseUrl();
console.log(`[MediVault API] Initialized with Base URL: ${BASE_URL}`);

// Generic helper to parse JSON and handle errors cleanly
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (error: any) {
    console.error(`[MediVault API Error] ${options.method || 'GET'} ${path}:`, error.message);
    throw error;
  }
};

export const api = {
  // Authentication
  registerUser: async (email: string, password: string) => {
    return request<{ message: string; userId: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  loginUser: async (email: string, password: string) => {
    return request<{ authenticated: boolean; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // User Profile
  getProfile: async () => {
    return request<any>('/api/profile');
  },

  updateProfile: async (updates: any) => {
    return request<any>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Medical Records
  listRecords: async () => {
    return request<any[]>('/api/records');
  },

  getRecordDetails: async (id: string) => {
    return request<any>(`/api/records/${id}`);
  },

  createRecord: async (recordData: {
    reportName: string;
    reportType?: string;
    reportDate?: string;
    bodyPart?: string;
    detectedCondition?: string;
    labHospital?: string;
    referringDoctor?: string;
    patientName?: string;
    tags?: string[];
    doctorNotes?: string;
    templateId?: string;
    reportText?: string;
    imageBase64?: string;
    customFileUri?: string;
    files?: { base64: string; mimeType: string; }[];
  }) => {
    return request<any>('/api/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  },

  updateRecord: async (id: string, updates: { reportName?: string; doctorNotes?: string }) => {
    return request<any>(`/api/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteRecord: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/records/${id}`, {
      method: 'DELETE',
    });
  },

  confirmRecord: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/records/${id}/confirm`, {
      method: 'POST',
    });
  },

  // Timeline
  getTimeline: async (groupByCluster: boolean = false) => {
    const query = groupByCluster ? '?groupByCluster=true' : '';
    return request<any[]>(`/api/timeline${query}`);
  },

  // Vitals
  logVital: async (vitalData: {
    type: 'Glucose' | 'BloodPressure';
    glucoseValue?: number;
    glucoseContext?: string;
    bpSystolic?: number;
    bpDiastolic?: number;
    bpPulse?: number;
    dateTime?: string;
    notes?: string;
  }) => {
    return request<any>('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(vitalData),
    });
  },

  getVitalTrends: async (type: 'Glucose' | 'BloodPressure', window: '7d' | '30d' | '90d') => {
    return request<any[]>(`/api/vitals/trends?type=${type}&window=${window}`);
  },

  // Emergency & Audit Logs
  getEmergencyProfile: async () => {
    return request<any>('/api/emergency/profile');
  },

  logEmergencyAccess: async (accessData: { who: string; whatReport: string; how: 'QR' | 'Link' }) => {
    return request<{ message: string }>('/api/emergency/access', {
      method: 'POST',
      body: JSON.stringify(accessData),
    });
  },

  getEmergencyLogs: async () => {
    return request<any[]>('/api/emergency/logs');
  },
};
