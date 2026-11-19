import { fallbackData } from '../data/fallbackData';

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

  getBanners: async (agency_id?: string) => {
    try {
      const data = await request<any[]>(`/public/banners${agency_id ? `?agency_id=${agency_id}` : ''}`);
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.hero_banners;
    } catch {
      return fallbackData.hero_banners;
    }
  },

  getDestinations: async (params?: { region?: string; featured?: boolean; agency_id?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.region) q.append('region', params.region);
      if (params?.featured) q.append('featured', 'true');
      if (params?.agency_id) q.append('agency_id', params.agency_id);
      const data = await request<any[]>(`/public/destinations?${q.toString()}`);
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.destinations;
    } catch {
      let list = fallbackData.destinations;
      if (params?.region) list = list.filter(d => d.region.toLowerCase() === params.region?.toLowerCase());
      if (params?.featured) list = list.filter(d => d.is_featured);
      return list;
    }
  },

  getDestinationBySlug: async (slug: string) => {
    try {
      return await request<{ destination: any; packages: any[] }>(`/public/destinations/${slug}`);
    } catch {
      const dest = fallbackData.destinations.find(d => d.slug === slug) || fallbackData.destinations[0];
      const pkgs = fallbackData.packages.filter(p => p.destination_id === dest.id);
      return { destination: dest, packages: pkgs };
    }
  },

  getPackages: async (params?: any) => {
    try {
      const q = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
        }
      }
      const data = await request<any[]>(`/public/packages?${q.toString()}`);
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.packages;
    } catch {
      let list = fallbackData.packages;
      if (params?.category && params.category !== 'all' && params.category !== 'All Packages') {
        list = list.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter(p => (p.title + ' ' + p.destination).toLowerCase().includes(s));
      }
      if (params?.destination_id) list = list.filter(p => p.destination_id === params.destination_id);
      if (params?.limit) list = list.slice(0, Number(params.limit));
      return list;
    }
  },

  getPackageBySlug: async (slug: string) => {
    try {
      return await request<{ package: any; destination: any; itineraries: any[] }>(`/public/packages/${slug}`);
    } catch {
      const pkg = fallbackData.packages.find(p => p.slug === slug) || fallbackData.packages[0];
      const dest = fallbackData.destinations.find(d => d.id === pkg.destination_id) || fallbackData.destinations[0];
      const itineraries = fallbackData.package_itineraries.filter(i => i.package_id === pkg.id);
      return { package: pkg, destination: dest, itineraries };
    }
  },

  getGroupTours: async () => {
    try {
      const data = await request<any[]>('/public/group-tours');
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.packages.filter(p => p.category === 'Group Tours');
    } catch {
      return fallbackData.packages.filter(p => p.category === 'Group Tours');
    }
  },

  getServices: async () => {
    try {
      const data = await request<any[]>('/public/services');
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.travel_services;
    } catch {
      return fallbackData.travel_services;
    }
  },

  getTestimonials: async () => {
    try {
      const data = await request<any[]>('/public/testimonials');
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.testimonials;
    } catch {
      return fallbackData.testimonials;
    }
  },

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
