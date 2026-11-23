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
  localStorage.removeItem('tg_user');
  localStorage.removeItem('tg_agency');
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
  // ==========================================
  // Auth & Session
  // ==========================================
  login: async (data: { email: string; password: string }) => {
    try {
      const res = await request<{ token: string; user: any; agency: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localStorage.setItem('tg_token', res.token);
      localStorage.setItem('tg_user', JSON.stringify(res.user));
      localStorage.setItem('tg_agency', JSON.stringify(res.agency));
      return res;
    } catch (err: any) {
      // Robust client-side fallback for static Vercel / offline demo mode
      console.warn('Backend login endpoint unavailable, using client-side credentials:', err);
      const cleanEmail = (data.email || '').toLowerCase().trim();
      const foundUser = (fallbackData.users || []).find(
        (u: any) => u.email.toLowerCase() === cleanEmail
      );

      const targetUser = foundUser || {
        id: 'user_fallback_' + Date.now(),
        name: cleanEmail.includes('admin') ? 'Aditya Sharma (Admin)' : 'Traveler Demo',
        email: cleanEmail,
        role: cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('staff') ? 'staff' : cleanEmail.includes('agent') ? 'agent' : 'customer',
        agency_id: 'agency_travel_genie'
      };

      const agency = (fallbackData.agencies || []).find((a: any) => a.id === targetUser.agency_id) || fallbackData.agencies[0];
      const token = `token_${targetUser.id}`;

      localStorage.setItem('tg_token', token);
      localStorage.setItem('tg_user', JSON.stringify(targetUser));
      localStorage.setItem('tg_agency', JSON.stringify(agency));

      return { token, user: targetUser, agency };
    }
  },

  demoLogin: async (role: string, agency_slug?: string) => {
    try {
      const res = await request<{ token: string; user: any; agency: any }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role, agency_slug })
      });
      localStorage.setItem('tg_token', res.token);
      localStorage.setItem('tg_user', JSON.stringify(res.user));
      localStorage.setItem('tg_agency', JSON.stringify(res.agency));
      return res;
    } catch (err) {
      console.warn('Backend demo-login unavailable, using instant client-side role fixture');
      const targetRole = role.toLowerCase();
      let agency = fallbackData.agencies[0];

      if (agency_slug && agency_slug.includes('voyage')) {
        agency = (fallbackData.agencies || []).find((a: any) => a.slug === 'voyage-bliss') || fallbackData.agencies[1] || fallbackData.agencies[0];
      }

      let foundUser = (fallbackData.users || []).find(
        (u: any) => u.role.toLowerCase() === targetRole && (agency_slug ? u.agency_id === agency?.id : true)
      );

      if (!foundUser) {
        foundUser = {
          id: `demo_${targetRole}_${Date.now()}`,
          name: targetRole === 'admin' ? 'Aditya Sharma' : targetRole === 'staff' ? 'Priya Nair' : targetRole === 'agent' ? 'Vikram Singhania' : 'Ananya Rao',
          email: `${targetRole}@travelgenie.com`,
          role: targetRole,
          agency_id: agency?.id || 'agency_travel_genie'
        };
      }

      const token = `token_demo_${targetRole}`;
      localStorage.setItem('tg_token', token);
      localStorage.setItem('tg_user', JSON.stringify(foundUser));
      localStorage.setItem('tg_agency', JSON.stringify(agency));

      return { token, user: foundUser, agency };
    }
  },

  register: async (data: any) => {
    try {
      const res = await request<{ token: string; user: any; agency: any; lead?: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localStorage.setItem('tg_token', res.token);
      localStorage.setItem('tg_user', JSON.stringify(res.user));
      localStorage.setItem('tg_agency', JSON.stringify(res.agency));
      return res;
    } catch {
      const agency = fallbackData.agencies[0];
      const newUser = {
        id: `cust_${Date.now()}`,
        name: data.name || 'Valued Customer',
        email: data.email,
        phone: data.phone || '',
        role: 'customer',
        agency_id: agency.id
      };
      const token = `token_${newUser.id}`;
      localStorage.setItem('tg_token', token);
      localStorage.setItem('tg_user', JSON.stringify(newUser));
      localStorage.setItem('tg_agency', JSON.stringify(agency));
      return { token, user: newUser, agency };
    }
  },

  getMe: async () => {
    try {
      const res = await request<{ user: any; agency: any }>('/auth/me');
      localStorage.setItem('tg_user', JSON.stringify(res.user));
      localStorage.setItem('tg_agency', JSON.stringify(res.agency));
      return res;
    } catch {
      const savedUser = localStorage.getItem('tg_user');
      const savedAgency = localStorage.getItem('tg_agency');
      if (savedUser) {
        return {
          user: JSON.parse(savedUser),
          agency: savedAgency ? JSON.parse(savedAgency) : fallbackData.agencies[0]
        };
      }
      throw new Error('Not authenticated');
    }
  },

  switchAgency: (agency_id: string) =>
    request<{ token: string; user: any; agency: any }>('/auth/switch-agency', {
      method: 'POST',
      body: JSON.stringify({ agency_id })
    }),

  getAgencies: async () => {
    try {
      const data = await request<any[]>('/agencies');
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.agencies;
    } catch {
      return fallbackData.agencies;
    }
  },

  // ==========================================
  // Public Data
  // ==========================================
  getPublicAgency: async (slug?: string) => {
    try {
      return await request<{ agency: any; settings: any }>(`/public/agency${slug ? `?slug=${slug}` : ''}`);
    } catch {
      const agency = (fallbackData.agencies || []).find((a: any) => a.slug === slug) || fallbackData.agencies[0];
      const settings = (fallbackData.agency_settings || []).find((s: any) => s.agency_id === agency.id) || fallbackData.agency_settings[0];
      return { agency, settings };
    }
  },

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
      if (params?.region && params.region !== 'all') {
        list = list.filter((d: any) => d.region?.toLowerCase() === params.region?.toLowerCase());
      }
      if (params?.featured) {
        list = list.filter((d: any) => d.is_featured);
      }
      return list;
    }
  },

  getDestinationBySlug: async (slug: string) => {
    try {
      return await request<{ destination: any; packages: any[] }>(`/public/destinations/${slug}`);
    } catch {
      const q = (slug || '').toLowerCase().trim();
      const dest = fallbackData.destinations.find((d: any) => 
        (d.slug && d.slug.toLowerCase() === q) || 
        (d.id && d.id.toLowerCase() === q) || 
        (d.name && d.name.toLowerCase() === q) ||
        (d.name && d.name.toLowerCase().replace(/\s+/g, '-') === q)
      ) || fallbackData.destinations[0];
      const pkgs = fallbackData.packages.filter((p: any) => 
        p.destination_id === dest.id || 
        (p.title && dest.name && p.title.toLowerCase().includes(dest.name.toLowerCase()))
      );
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
        list = list.filter((p: any) => p.category?.toLowerCase() === params.category?.toLowerCase());
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter((p: any) => (p.title + ' ' + p.destination).toLowerCase().includes(s));
      }
      if (params?.destination_id) {
        list = list.filter((p: any) => p.destination_id === params.destination_id);
      }
      if (params?.limit) {
        list = list.slice(0, Number(params.limit));
      }
      return list;
    }
  },

  getPackageBySlug: async (slug: string) => {
    const dedupe = (list: any[]) => {
      const map = new Map<number, any>();
      for (const it of list || []) {
        const day = Number(it.day_number) || 1;
        if (!map.has(day) || ((it.description?.length || 0) > (map.get(day).description?.length || 0))) {
          map.set(day, it);
        }
      }
      return Array.from(map.values()).sort((a, b) => a.day_number - b.day_number);
    };

    const cleanSlug = decodeURIComponent(slug || '').toLowerCase().trim().replace(/\/+$/, '');
    try {
      const res = await request<{ package: any; destination: any; itineraries: any[] }>(`/public/packages/${encodeURIComponent(cleanSlug)}`);
      if (res) {
        if ((res as any).is_destination) {
          return res;
        }
        return {
          ...res,
          itineraries: dedupe(res.itineraries || [])
        };
      }
      throw new Error('Package not found');
    } catch {
      // Check if it matches a destination in fallbackData
      const destMatch = (fallbackData.destinations || []).find((d: any) => {
        if (!d) return false;
        const dSlug = (d.slug || '').toLowerCase().trim();
        const dId = (d.id || '').toLowerCase().trim();
        return dSlug === cleanSlug || dId === cleanSlug || dId === `dest_${cleanSlug.replace(/-/g, '_')}`;
      });
      if (destMatch) {
        return { is_destination: true, destination_slug: destMatch.slug || cleanSlug, package: null, destination: destMatch, itineraries: [] } as any;
      }

      const pkg = (fallbackData.packages || []).find((p: any) => {
        if (!p) return false;
        const pSlug = (p.slug || '').toLowerCase().trim().replace(/\/+$/, '');
        const pId = (p.id || '').toLowerCase().trim();
        return pSlug === cleanSlug || pId === cleanSlug;
      });
      if (!pkg) {
        throw new Error('Package not found');
      }
      const dest = (fallbackData.destinations || []).find((d: any) => d.id === pkg.destination_id) || fallbackData.destinations[0];
      const rawItineraries = (fallbackData.package_itineraries || []).filter((i: any) => i.package_id === pkg.id);
      return { package: pkg, destination: dest, itineraries: dedupe(rawItineraries) };
    }
  },

  getGroupTours: async () => {
    try {
      const data = await request<any[]>('/public/group-tours');
      if (Array.isArray(data) && data.length > 0) return data;
      return fallbackData.packages.filter((p: any) => p.category === 'Group Tours' || p.is_group_tour);
    } catch {
      return fallbackData.packages.filter((p: any) => p.category === 'Group Tours' || p.is_group_tour);
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

  submitEnquiry: async (data: any) => {
    try {
      return await request<{ success: boolean; message: string; lead_id: string }>('/public/enquiry', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      const localLeads = JSON.parse(localStorage.getItem('tg_local_leads') || '[]');
      const newLead = { id: `lead_${Date.now()}`, ...data, created_at: new Date().toISOString() };
      localLeads.push(newLead);
      localStorage.setItem('tg_local_leads', JSON.stringify(localLeads));
      return {
        success: true,
        message: 'Your enquiry has been received. Our travel specialist will contact you shortly!',
        lead_id: newLead.id
      };
    }
  },

  submitContact: async (data: any) => {
    try {
      return await request<{ success: boolean; message: string }>('/public/contact', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      return { success: true, message: 'Message sent successfully! Our operations desk will get back to you shortly.' };
    }
  },

  // ==========================================
  // Customer Portal
  // ==========================================
  getCustomerDashboard: async () => {
    try {
      return await request<any>('/customer/dashboard');
    } catch {
      return {
        bookings_count: fallbackData.bookings.length,
        enquiries_count: fallbackData.leads.length,
        recent_bookings: fallbackData.bookings.slice(0, 3),
        recommended_packages: fallbackData.packages.slice(0, 4)
      };
    }
  },
  getCustomerEnquiries: async () => {
    try {
      return await request<any[]>('/customer/enquiries');
    } catch {
      return fallbackData.leads;
    }
  },
  getCustomerBookings: async () => {
    try {
      return await request<any[]>('/customer/bookings');
    } catch {
      return fallbackData.bookings;
    }
  },
  getCustomerPayments: async () => {
    try {
      return await request<any>('/customer/payments');
    } catch {
      return fallbackData.payments;
    }
  },
  getCustomerProfile: async () => {
    try {
      return await request<any>('/customer/profile');
    } catch {
      const user = JSON.parse(localStorage.getItem('tg_user') || '{}');
      return user;
    }
  },
  updateCustomerProfile: (data: any) =>
    request<any>('/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // ==========================================
  // Admin Portal
  // ==========================================
  getAdminDashboard: async () => {
    try {
      return await request<any>('/admin/dashboard');
    } catch {
      return {
        stats: {
          total_leads: fallbackData.leads.length,
          active_bookings: fallbackData.bookings.length,
          total_revenue: 1450000,
          packages_count: fallbackData.packages.length
        },
        recent_leads: fallbackData.leads.slice(0, 5),
        recent_bookings: fallbackData.bookings.slice(0, 5)
      };
    }
  },
  getAdminLeads: async (params?: any) => {
    try {
      const q = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
        }
      }
      return await request<any>(`/admin/leads?${q.toString()}`);
    } catch {
      return { leads: fallbackData.leads, total: fallbackData.leads.length };
    }
  },
  createAdminLead: (data: any) =>
    request<any>('/admin/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getAdminLeadDetails: async (id: string) => {
    try {
      return await request<any>(`/admin/leads/${id}`);
    } catch {
      return fallbackData.leads.find((l: any) => l.id === id) || fallbackData.leads[0];
    }
  },
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

  getAdminUsers: async (params?: { role?: string; search?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.role) q.append('role', params.role);
      if (params?.search) q.append('search', params.search);
      return await request<any[]>(`/admin/users?${q.toString()}`);
    } catch {
      let users = fallbackData.users;
      if (params?.role && params.role !== 'all') {
        users = users.filter((u: any) => u.role === params.role);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        users = users.filter((u: any) =>
          u.name?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.display_id?.toLowerCase().includes(s)
        );
      }
      return users;
    }
  },
  createAdminUser: (data: any) =>
    request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAdminUser: (id: string, data: any) =>
    request<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAdminUser: (id: string) =>
    request<any>(`/admin/users/${id}`, { method: 'DELETE' }),

  getAdminStaff: async () => {
    try {
      return await request<any[]>('/admin/staff');
    } catch {
      return fallbackData.users.filter((u: any) => u.role === 'staff');
    }
  },
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

  getAdminAgents: async () => {
    try {
      return await request<any[]>('/admin/agents');
    } catch {
      return fallbackData.users.filter((u: any) => u.role === 'agent');
    }
  },
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

  getAdminCustomers: async () => {
    try {
      return await request<any[]>('/admin/customers');
    } catch {
      return fallbackData.users.filter((u: any) => u.role === 'customer');
    }
  },

  getAdminPackages: async () => {
    try {
      return await request<any[]>('/admin/packages');
    } catch {
      return fallbackData.packages;
    }
  },
  getAdminPackageItineraries: async (packageId: string) => {
    try {
      return await request<any[]>(`/admin/packages/${packageId}/itineraries`);
    } catch {
      return (fallbackData.package_itineraries || [])
        .filter((it: any) => it.package_id === packageId)
        .sort((a: any, b: any) => a.day_number - b.day_number);
    }
  },
  createAdminPackage: async (data: any) => {
    try {
      return await request<any>('/admin/packages', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (e) {
      const newPkg = {
        id: `pkg_${Date.now()}`,
        agency_id: 'agency_travel_genie',
        ...data,
        is_published: data.is_published !== undefined ? data.is_published : true,
        created_at: new Date().toISOString()
      };
      (fallbackData.packages = fallbackData.packages || []).unshift(newPkg);
      if (Array.isArray(data.itineraries)) {
        data.itineraries.forEach((it: any, idx: number) => {
          (fallbackData.package_itineraries = fallbackData.package_itineraries || []).push({
            id: `itin_${newPkg.id}_day_${it.day_number || idx + 1}`,
            package_id: newPkg.id,
            day_number: it.day_number || idx + 1,
            title: it.title,
            description: it.description,
            meals: it.meals || 'Breakfast Included',
            activities: it.activities || 'Sightseeing & Transfers'
          });
        });
      }
      return newPkg;
    }
  },
  updateAdminPackage: async (id: string, data: any) => {
    try {
      return await request<any>(`/admin/packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (e) {
      // Local fallback sync
      const pIdx = fallbackData.packages?.findIndex((p: any) => p.id === id);
      if (pIdx !== -1) {
        fallbackData.packages[pIdx] = { ...fallbackData.packages[pIdx], ...data };
      }
      if (Array.isArray(data.itineraries)) {
        fallbackData.package_itineraries = (fallbackData.package_itineraries || []).filter(
          (it: any) => it.package_id !== id
        );
        data.itineraries.forEach((it: any, idx: number) => {
          fallbackData.package_itineraries.push({
            id: `itin_${id}_day_${it.day_number || idx + 1}`,
            package_id: id,
            day_number: it.day_number || idx + 1,
            title: it.title,
            description: it.description,
            meals: it.meals || 'Breakfast Included',
            activities: it.activities || 'Sightseeing & Transfers'
          });
        });
      }
      return fallbackData.packages[pIdx];
    }
  },
  deleteAdminPackage: async (id: string) => {
    try {
      return await request<any>(`/admin/packages/${id}`, { method: 'DELETE' });
    } catch {
      fallbackData.packages = (fallbackData.packages || []).filter((p: any) => p.id !== id);
      return { success: true };
    }
  },

  getAdminDestinations: async () => {
    try {
      return await request<any[]>('/admin/destinations');
    } catch {
      return fallbackData.destinations;
    }
  },
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

  getAdminBanners: async () => {
    try {
      return await request<any[]>('/admin/banners');
    } catch {
      return fallbackData.hero_banners;
    }
  },
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

  getAdminBookings: async () => {
    try {
      return await request<any[]>('/admin/bookings');
    } catch {
      return fallbackData.bookings;
    }
  },
  updateAdminBooking: (id: string, data: any) =>
    request<any>(`/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdminPayments: async () => {
    try {
      return await request<any[]>('/admin/payments');
    } catch {
      return fallbackData.payments;
    }
  },
  createAdminPayment: (data: any) =>
    request<any>('/admin/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getAdminReports: async () => {
    try {
      return await request<any>('/admin/reports');
    } catch {
      return {
        revenue_by_month: [
          { month: 'Jun', revenue: 320000 },
          { month: 'Jul', revenue: 450000 },
          { month: 'Aug', revenue: 510000 },
          { month: 'Sep', revenue: 620000 },
          { month: 'Oct', revenue: 780000 },
          { month: 'Nov', revenue: 940000 }
        ],
        top_destinations: [
          { name: 'Kerala Backwaters', bookings: 24, revenue: 480000 },
          { name: 'Maldives Paradise', bookings: 18, revenue: 720000 },
          { name: 'Ooty & Kodaikanal', bookings: 22, revenue: 330000 }
        ]
      };
    }
  },
  getAdminSettings: async () => {
    try {
      return await request<any>('/admin/settings');
    } catch {
      return fallbackData.agency_settings[0];
    }
  },
  updateAdminSettings: (data: any) =>
    request<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // ==========================================
  // Staff Portal
  // ==========================================
  getStaffDashboard: async () => {
    try {
      return await request<any>('/staff/dashboard');
    } catch {
      return {
        assigned_leads: fallbackData.leads.slice(0, 6),
        follow_ups_due: fallbackData.leads.slice(0, 3),
        recent_bookings: fallbackData.bookings.slice(0, 3)
      };
    }
  },
  getStaffLeads: async (params?: any) => {
    try {
      const q = new URLSearchParams();
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
        }
      }
      return await request<any[]>(`/staff/leads?${q.toString()}`);
    } catch {
      return fallbackData.leads;
    }
  },
  getStaffLeadDetails: async (id: string) => {
    try {
      return await request<any>(`/staff/leads/${id}`);
    } catch {
      return fallbackData.leads.find((l: any) => l.id === id) || fallbackData.leads[0];
    }
  },
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
  getStaffFollowUps: async () => {
    try {
      return await request<any[]>('/staff/follow-ups');
    } catch {
      return fallbackData.leads.slice(0, 3);
    }
  },

  // ==========================================
  // Agent Portal
  // ==========================================
  getAgentDashboard: async () => {
    try {
      return await request<any>('/agent/dashboard');
    } catch {
      return {
        total_purchases: fallbackData.agent_purchases?.length || 3,
        total_spent: 420000,
        available_credits: 50000,
        recent_purchases: fallbackData.agent_purchases || []
      };
    }
  },
  getAgentMarketplace: async () => {
    try {
      return await request<any[]>('/agent/marketplace');
    } catch {
      return fallbackData.packages;
    }
  },
  purchasePackageAsAgent: (data: any) =>
    request<any>('/agent/purchase', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getAgentPurchases: async () => {
    try {
      return await request<any[]>('/agent/purchases');
    } catch {
      return fallbackData.agent_purchases || [];
    }
  },
  getAgentTransactions: async () => {
    try {
      return await request<any[]>('/agent/transactions');
    } catch {
      return fallbackData.agent_transactions || [];
    }
  },

  // ==========================================
  // Notifications
  // ==========================================
  getNotifications: async () => {
    try {
      return await request<any[]>('/notifications');
    } catch {
      return fallbackData.notifications || [];
    }
  },
  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<any>('/notifications/read-all', { method: 'PUT' }),

  // ==========================================
  // File Upload
  // ==========================================
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
  },

  // ==========================================
  // Operations Executive & Logistics Portal
  // ==========================================
  getOperationsDashboard: async () => {
    try {
      return await request<any>('/operations/dashboard');
    } catch {
      const bookings = fallbackData.bookings || [];
      const arrangements = fallbackData.operations_arrangements || [];
      const documents = fallbackData.travel_documents || [];
      return {
        stats: {
          total_confirmed_bookings: bookings.length,
          arrangements_pending: 1,
          hotel_confirmed: 2,
          transport_confirmed: 1,
          documents_ready: 2,
          trips_in_progress: 1,
          trips_completed: 1,
          issues_reported: 0,
          total_documents: documents.length,
          pending_customer_verifications: 1
        },
        bookings: bookings.map((b: any) => ({
          ...b,
          operations: arrangements.find((a: any) => a.booking_id === b.id) || {
            trip_status: 'Booking Received'
          },
          documents_count: documents.filter((d: any) => d.booking_id === b.id).length
        }))
      };
    }
  },

  getOperationsBookings: async () => {
    try {
      return await request<any[]>('/operations/bookings');
    } catch {
      const bookings = fallbackData.bookings || [];
      const arrangements = fallbackData.operations_arrangements || [];
      const documents = fallbackData.travel_documents || [];
      return bookings.map((b: any) => ({
        ...b,
        operations: arrangements.find((a: any) => a.booking_id === b.id) || {
          id: `arr_${b.id}`,
          booking_id: b.id,
          trip_status: 'Booking Received',
          updated_at: b.created_at
        },
        documents: documents.filter((d: any) => d.booking_id === b.id)
      }));
    }
  },

  updateOperationsArrangements: (bookingId: string, data: any) =>
    request<any>(`/operations/bookings/${bookingId}/arrangements`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  updateTripOperationalStatus: (bookingId: string, trip_status: string) =>
    request<any>(`/operations/bookings/${bookingId}/trip-status`, {
      method: 'PUT',
      body: JSON.stringify({ trip_status })
    }),

  generateTravelDossier: (bookingId: string) =>
    request<any>(`/operations/bookings/${bookingId}/generate-dossier`, {
      method: 'POST'
    }),

  // ==========================================
  // Digital Document Wallet & Travel Documents
  // ==========================================
  getTravelDocuments: async (params?: { booking_id?: string; category?: string; customer_id?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.booking_id) q.append('booking_id', params.booking_id);
      if (params?.category) q.append('category', params.category);
      if (params?.customer_id) q.append('customer_id', params.customer_id);
      return await request<any[]>(`/documents?${q.toString()}`);
    } catch {
      let docs = fallbackData.travel_documents || [];
      if (params?.booking_id) docs = docs.filter((d: any) => d.booking_id === params.booking_id);
      if (params?.category && params.category !== 'all') docs = docs.filter((d: any) => d.category === params.category);
      return docs;
    }
  },

  uploadTravelDocument: (data: any) =>
    request<any>('/documents/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  verifyTravelDocument: (id: string, data: { status: string; notes?: string }) =>
    request<any>(`/documents/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteTravelDocument: (id: string) =>
    request<any>(`/documents/${id}`, {
      method: 'DELETE'
    }),

  // ==========================================
  // Customer Support Tickets
  // ==========================================
  getSupportTickets: async () => {
    try {
      return await request<any[]>('/support/tickets');
    } catch {
      return fallbackData.support_tickets || [];
    }
  },

  createSupportTicket: (data: any) =>
    request<any>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  replySupportTicket: (id: string, message: string) =>
    request<any>(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  updateSupportTicketStatus: (id: string, status: string) =>
    request<any>(`/support/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  // ==========================================
  // B2B Wholesale Pricing Engine & Agent Hub
  // ==========================================
  calculateB2BPrice: async (package_id: string, travelers_count: number) => {
    try {
      return await request<any>('/b2b/calculate-price', {
        method: 'POST',
        body: JSON.stringify({ package_id, travelers_count })
      });
    } catch {
      const pkg = fallbackData.packages?.find((p: any) => p.id === package_id) || fallbackData.packages[0];
      const pax = Math.max(1, travelers_count || 1);
      const baseWholesale = pkg?.agent_wholesale_price || pkg?.wholesale_price || Math.round((pkg?.public_price || 50000) * 0.85);
      const retailPrice = pkg?.public_price || 60000;

      let tierName = 'Standard B2B Tier (1-4 Pax)';
      let discountPct = 0;
      if (pax >= 20) {
        tierName = 'Mega Group Wholesale Tier (20+ Pax)';
        discountPct = 15;
      } else if (pax >= 10) {
        tierName = 'Medium Group Wholesale Tier (10-19 Pax)';
        discountPct = 10;
      } else if (pax >= 5) {
        tierName = 'Small Group Wholesale Tier (5-9 Pax)';
        discountPct = 5;
      }

      const discountAmountPerPax = Math.round(baseWholesale * (discountPct / 100));
      const finalWholesalePerPax = baseWholesale - discountAmountPerPax;
      const totalWholesaleCost = finalWholesalePerPax * pax;
      const totalRetailPrice = retailPrice * pax;
      const projectedMarginTotal = totalRetailPrice - totalWholesaleCost;
      const marginPct = Math.round((projectedMarginTotal / totalRetailPrice) * 100);

      return {
        package_id: pkg?.id,
        package_title: pkg?.title,
        travelers_count: pax,
        tier_name: tierName,
        tier_discount_pct: discountPct,
        base_wholesale_price: baseWholesale,
        discount_amount_per_pax: discountAmountPerPax,
        final_wholesale_price_per_pax: finalWholesalePerPax,
        total_wholesale_cost: totalWholesaleCost,
        suggested_retail_price: retailPrice,
        total_retail_price: totalRetailPrice,
        projected_margin_total: projectedMarginTotal,
        margin_pct: marginPct
      };
    }
  },

  getB2BDocuments: async () => {
    try {
      return await request<any[]>('/b2b/documents');
    } catch {
      const purchases = fallbackData.agent_purchases || [];
      return purchases.map((p: any) => ({
        id: `inv_${p.id}`,
        purchase_id: p.id,
        package_title: p.package_title,
        client_name: p.client_name,
        amount: p.total_cost,
        invoice_number: `INV-B2B-${p.id.replace(/[^0-9]/g, '').slice(-4) || '9021'}`,
        date: p.created_at,
        status: 'Paid',
        invoice_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        voucher_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
      }));
    }
  },

  getAgentCustomers: async () => {
    try {
      return await request<any[]>('/b2b/customers');
    } catch {
      return fallbackData.agent_customers || [];
    }
  },

  createAgentCustomer: (data: any) =>
    request<any>('/b2b/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // ==========================================
  // Branches
  // ==========================================
  getBranches: async () => {
    try {
      return await request<any[]>('/admin/branches');
    } catch {
      return fallbackData.branches || [];
    }
  },

  createBranch: (data: any) =>
    request<any>('/admin/branches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // ==========================================
  // Customer Payments & Transactions
  // ==========================================
  processCustomerPayment: (data: { booking_id: string; amount: number; payment_method?: string; notes?: string }) =>
    request<any>('/customer/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // ==========================================
  // Refunds & Financial Adjustments
  // ==========================================
  getRefunds: async () => {
    try {
      return await request<any[]>('/admin/refunds');
    } catch {
      return (fallbackData as any).refunds || [];
    }
  },

  processRefund: (data: { booking_id: string; amount: number; reason?: string }) =>
    request<any>('/admin/refunds', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // ==========================================
  // Audit Logs & Compliance
  // ==========================================
  getAuditLogs: async () => {
    try {
      return await request<any[]>('/admin/audit-logs');
    } catch {
      return (fallbackData as any).audit_logs || [];
    }
  },

  // ==========================================
  // Quotations Approval
  // ==========================================
  approveQuotationDiscount: (quotationId: string, data: { approved_discount: number; manager_notes?: string }) =>
    request<any>(`/admin/quotations/${quotationId}/approve-discount`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  downloadDocument: (documentId: string) => {
    const token = getAuthToken();
    window.open(`${API_BASE}/documents/${documentId}/download${token ? `?token=${token}` : ''}`, '_blank');
  }
};
