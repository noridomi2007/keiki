import type {
  DocumentKind,
  JobRecord,
  ReportResponse,
  SettingsStatus,
  Transaction,
} from '../types/contract';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  if (!res.ok) {
    let msg = `Lỗi kết nối (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) {
        msg = errBody.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(msg);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export interface HouseholdLoginPayload {
  owner?: string;
  name?: string;
  phone: string;
  password?: string;
  tax_code?: string;
  address?: string;
  email?: string;
  picture?: string;
  auth_method: 'google' | 'phone' | 'preset';
}

export interface HouseholdRegisterPayload {
  phone: string;
  password: string;
  owner: string;
  name: string;
  tax_code?: string;
  address?: string;
}

export const api = {
  getSettingsStatus: () => requestJson<SettingsStatus>('/api/settings/status'),

  registerHousehold: (payload: HouseholdRegisterPayload) =>
    requestJson<{ status: string; household: SettingsStatus['household']; message: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),

  loginHousehold: (payload: HouseholdLoginPayload) =>
    requestJson<{ status: string; household: SettingsStatus['household']; message: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),

  logout: () =>
    requestJson<{ status: string; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  loginWithGoogle: (payload: {
    access_token?: string;
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    shop_name?: string;
    tax_code?: string;
    address?: string;
  }) =>
    requestJson<{ status: string; household: SettingsStatus['household']; message: string }>(
      '/api/auth/google',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),

  updateGoogleClientId: (google_client_id: string) =>
    requestJson<{ status: string; google_client_id: string; message: string }>(
      '/api/settings/google-client-id',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_client_id }),
      }
    ),

  updateApiKey: (gemini_api_key: string, gemini_model = 'gemini-2.5-flash') =>
    requestJson<{ status: string; gemini_configured: boolean; message: string }>(
      '/api/settings/apikey',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key, gemini_model }),
      }
    ),

  uploadDocument: (file: File | Blob, kind: DocumentKind, filename?: string) => {
    const form = new FormData();
    form.append('file', file, filename || (file instanceof File ? file.name : `upload_${Date.now()}`));
    form.append('kind', kind);
    return requestJson<{ document_id: string; job_id: string }>('/api/documents', {
      method: 'POST',
      body: form,
    });
  },

  triggerPreset: (presetName: string, transcript?: string) => {
    const q = transcript ? `?transcript=${encodeURIComponent(transcript)}` : '';
    return requestJson<{ document_id: string; job_id: string }>(
      `/api/documents/preset/${presetName}${q}`,
      { method: 'POST' }
    );
  },

  getJob: (jobId: string) => requestJson<JobRecord>(`/api/jobs/${jobId}`),

  listTransactions: (params?: { status?: string; type?: string; from?: string; to?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.type) search.set('type', params.type);
    if (params?.from) search.set('from', params.from);
    if (params?.to) search.set('to', params.to);
    const qs = search.toString();
    return requestJson<{ items: Transaction[]; total: number }>(
      `/api/transactions${qs ? `?${qs}` : ''}`
    );
  },

  createManualTransaction: (payload: {
    date: string;
    type: 'revenue' | 'expense';
    category?: string;
    payment_method?: 'cash' | 'transfer';
    amount_vnd: number;
    counterparty?: string;
  }) =>
    requestJson<Transaction>('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  patchTransaction: (txId: string, payload: Partial<Transaction>) =>
    requestJson<Transaction>(`/api/transactions/${txId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  confirmTransaction: (txId: string, mergeIntoDuplicate = false) =>
    requestJson<Transaction>(`/api/transactions/${txId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merge_into_duplicate: mergeIntoDuplicate }),
    }),

  rejectTransaction: (txId: string, reason?: string) =>
    requestJson<Transaction>(`/api/transactions/${txId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  deleteTransaction: (txId: string) =>
    requestJson<void>(`/api/transactions/${txId}`, {
      method: 'DELETE',
    }),

  getReport: (month = '2026-11') =>
    requestJson<ReportResponse>(`/api/report?period=month&anchor=${month}-12`),

  resetDemo: () =>
    requestJson<{ status: string; message: string }>('/api/demo/reset', {
      method: 'POST',
    }),
};
