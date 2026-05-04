const TOKEN_KEY = 'wirt_token';

export const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => sessionStorage.removeItem(TOKEN_KEY);

const authHeaders = (): HeadersInit => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error ?? `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}

export const api = {
  auth: {
    login: (password: string) =>
      request<{ success: boolean; token: string; message?: string }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    verify: () =>
      request<{ valid: boolean }>('/api/auth/verify'),
    changePassword: (oldPassword: string, newPassword: string) =>
      request<{ success: boolean }>('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      }),
  },

  produkte: {
    list: () => request<import('../types').Produkt[]>('/api/produkte'),
    create: (data: { name: string; meldebestand_kaesten: number }) =>
      request<{ success: boolean; id: number }>('/api/produkte', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/produkte/${id}`, { method: 'DELETE' }),
    updateMeldebestand: (id: number, meldebestand_kaesten: number) =>
      request<{ success: boolean }>(`/api/produkte/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ meldebestand_kaesten }),
      }),
  },

  chargen: {
    list: () => request<import('../types').Charge[]>('/api/chargen'),
    create: (data: { produkt_id: number; kaesten_anzahl: number; mhd_monat: number; mhd_jahr: number }) =>
      request<{ success: boolean; id: number }>('/api/chargen', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  inventur: {
    post: (data: { produkt_id: number; charge_id: number; differenz: number; grund: string; benutzerrolle: string }) =>
      request<{ success: boolean }>('/api/inventur', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  logbuch: {
    list: () => request<import('../types').LogbuchEintrag[]>('/api/logbuch'),
  },

  nachschub: {
    list: () => request<import('../types').NachschubAnfrage[]>('/api/nachschub'),
    create: (produktId: number) =>
      request<{ success: boolean }>('/api/nachschub', {
        method: 'POST',
        body: JSON.stringify({ produkt_id: produktId }),
      }),
  },
};
