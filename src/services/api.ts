const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('tg_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('tg_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('tg_token');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch (e) {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any; agency: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  demoLogin: (role: string, agency_slug?: string) =>
    request<{ token: string; user: any; agency: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, agency_slug })
    }),

  register: (data: any) =>
    request<{ token: string; user: any; agency: any; lead?: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => request<{ user: any; agency: any }>('/auth/me'),

  switchAgency: (agency_id: string) =>
    request<{ token: string; user: any; agency: any }>('/auth/switch-agency', {
      method: 'POST',
      body: JSON.stringify({ agency_id })
    }),

  getAgencies: () => request<any[]>('/agencies'),

  // Public
  getPublicAgency: (slug?: string) =>
    request<{ agency: any; settings: any }>(`/public/agency${slug ? `?slug=${slug}` : ''}`),

  getBanners: (agency_id?: string) =>
    request<any[]>(`/public/banners${agency_id ? `?agency_id=${agency_id}` : ''}`),

  getDestinations: (params?: { region?: string; featured?: boolean; agency_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.region) q.append('region', params.region);
    if (params?.featured) q.append('featured', 'true');
    if (params?.agency_id) q.append('agency_id', params.agency_id);
    return request<any[]>(`/public/destinations?${q.toString()}`);
  },

  getDestinationBySlug: (slug: string) =>
    request<{ destination: any; packages: any[] }>(`/public/destinations/${slug}`),

  getPackages: (params?: any) => {
    const q = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      }
    }
    return request<any[]>(`/public/packages?${q.toString()}`);
  },

  getPackageBySlug: (slug: string) =>
    request<{ package: any; destination: any; itineraries: any[] }>(`/public/packages/${slug}`),

  getGroupTours: () => request<any[]>('/public/group-tours'),
  getServices: () => request<any[]>('/public/services'),
  getTestimonials: () => request<any[]>('/public/testimonials'),

  submitEnquiry: (data: any) =>
    request<{ success: boolean; message: string; lead_id: string }>('/public/enquiry', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  submitContact: (data: any) =>
    request<{ success: boolean; message: string }>('/public/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Customer
  getCustomerDashboard: () => request<any>('/customer/dashboard'),
  getCustomerEnquiries: () => request<any[]>('/customer/enquiries'),
  getCustomerBookings: () => request<any[]>('/customer/bookings'),
  getCustomerPayments: () => request<any>('/customer/payments'),
  getCustomerProfile: () => request<any>('/customer/profile'),
  updateCustomerProfile: (data: any) =>
    request<any>('/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Admin
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getAdminLeads: (params?: any) => {
    const q = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      }
    }
    return request<any>(`/admin/leads?${q.toString()}`);
  },
  createAdminLead: (data: any) =>
    request<any>('/admin/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getAdminLeadDetails: (id: string) => request<any>(`/admin/leads/${id}`),
  updateAdminLead: (id: string, data: any) =>
    request<any>(`/admin/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  assignLeads: (data: { lead_ids: string[]; staff_id: string; notes?: string }) =>
    request<any>('/admin/leads/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteAdminLead: (id: string) =>
    request<any>(`/admin/leads/${id}`, { method: 'DELETE' }),

  getAdminStaff: () => request<any[]>('/admin/staff'),
  createAdminStaff: (data: any) =>
    request<any>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAdminStaff: (id: string, data: any) =>
    request<any>(`/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdminAgents: () => request<any[]>('/admin/agents'),
  createAdminAgent: (data: any) =>
    request<any>('/admin/agents', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAdminAgent: (id: string, data: any) =>
    request<any>(`/admin/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdminCustomers: () => request<any[]>('/admin/customers'),

  getAdminPackages: () => request<any[]>('/admin/packages'),
  createAdminPackage: (data: any) =>
    request<any>('/admin/packages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAdminPackage: (id: string, data: any) =>
    request<any>(`/admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAdminPackage: (id: string) =>
    request<any>(`/admin/packages/${id}`, { method: 'DELETE' }),

  getAdminDestinations: () => request<any[]>('/admin/destinations'),
  createAdminDestination: (data: any) =>
    request<any>('/admin/destinations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAdminDestination: (id: string, data: any) =>
    request<any>(`/admin/destinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAdminDestination: (id: string) =>
    request<any>(`/admin/destinations/${id}`, { method: 'DELETE' }),

  getAdminBanners: () => request<any[]>('/admin/banners'),
  createAdminBanner: (data: any) =>
    request<any>('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAdminBanner: (id: string, data: any) =>
    request<any>(`/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAdminBanner: (id: string) =>
    request<any>(`/admin/banners/${id}`, { method: 'DELETE' }),

  getAdminBookings: () => request<any[]>('/admin/bookings'),
  updateAdminBooking: (id: string, data: any) =>
    request<any>(`/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdminPayments: () => request<any[]>('/admin/payments'),
  createAdminPayment: (data: any) =>
    request<any>('/admin/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getAdminReports: (params?: any) => request<any>('/admin/reports'),
  getAdminSettings: () => request<any>('/admin/settings'),
  updateAdminSettings: (data: any) =>
    request<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Staff
  getStaffDashboard: () => request<any>('/staff/dashboard'),
  getStaffLeads: (params?: any) => {
    const q = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      }
    }
    return request<any[]>(`/staff/leads?${q.toString()}`);
  },
  getStaffLeadDetails: (id: string) => request<any>(`/staff/leads/${id}`),
  updateStaffLeadStatus: (id: string, data: any) =>
    request<any>(`/staff/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  createQuotation: (data: any) =>
    request<any>('/staff/quotations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  convertLeadToBooking: (id: string, data: any) =>
    request<any>(`/staff/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getStaffFollowUps: () => request<any[]>('/staff/follow-ups'),

  // Agent
  getAgentDashboard: () => request<any>('/agent/dashboard'),
  getAgentMarketplace: () => request<any[]>('/agent/marketplace'),
  purchasePackageAsAgent: (data: any) =>
    request<any>('/agent/purchase', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getAgentPurchases: () => request<any[]>('/agent/purchases'),
  getAgentTransactions: () => request<any[]>('/agent/transactions'),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<any>('/notifications/read-all', { method: 'PUT' }),

  // File Upload
  uploadFile: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed.');
    }
    return response.json();
  }
};
