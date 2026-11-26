export type LeadEnquiryType = 'international' | 'domestic' | 'travels';

export const SALES_DEPARTMENT_OPTIONS = [
  'Holidays & International',
  'Domestic & Group Tours',
  'Honeymoon Specialists',
  'Corporate & MICE'
];

export const OPERATIONS_DEPARTMENT_OPTIONS = [
  'Ticketing & Visa Desk',
  'Travel & Transportation Operations'
];

export const DEPARTMENT_OPTIONS = [
  ...SALES_DEPARTMENT_OPTIONS,
  ...OPERATIONS_DEPARTMENT_OPTIONS
];

export const DESIGNATION_OPTIONS = [
  'Sales',
  'Operations'
];

const INTERNATIONAL_DESTINATIONS = [
  'bali', 'dubai', 'maldives', 'singapore', 'thailand', 'vietnam', 'malaysia', 'paris',
  'switzerland', 'europe', 'london', 'uk', 'united kingdom', 'alaska', 'america', 'usa',
  'canada', 'japan', 'australia', 'new zealand', 'fiji', 'mauritius', 'seychelles',
  'turkey', 'greece', 'italy', 'germany', 'france', 'austria', 'netherlands', 'spain',
  'egypt', 'morocco', 'south africa', 'kenya', 'zimbabwe', 'tanzania', 'qatar', 'uae',
  'oman', 'jordan', 'uzbekistan', 'kazakhstan', 'cambodia', 'philippines', 'indonesia',
  'hong kong', 'china', 'russia', 'south korea', 'sri lanka', 'madagascar'
];

export function getLeadEnquiryType(lead: any): LeadEnquiryType {
  if (!lead) return 'domestic';
  const dest = (lead.interested_destination || lead.destination || '').toLowerCase();
  const cat = (lead.category || '').toLowerCase();
  const src = (lead.lead_source || lead.source || '').toLowerCase();
  const pref = (lead.travel_preference || '').toLowerCase();

  // 1. Travels / Logistics enquiry (cabs, taxi, car rental, tempo, bus, flight, visa, transfer, web check-in, insurance)
  const isTravels =
    lead.service_type ||
    ['flight', 'bus', 'car', 'cab', 'transfer', 'insurance', 'visa', 'webcheckin', 'hotel'].includes(pref) ||
    dest.startsWith('flight:') ||
    dest.startsWith('bus:') ||
    dest.startsWith('car rental:') ||
    dest.startsWith('airport transfer:') ||
    dest.startsWith('visa consultation:') ||
    dest.startsWith('travel insurance:') ||
    dest.startsWith('web check-in:') ||
    dest.startsWith('service:') ||
    dest.includes('cab') ||
    dest.includes('tempo') ||
    dest.includes('taxi') ||
    dest.includes('car rental') ||
    src.includes('service enquiry') ||
    src.includes('travels') ||
    src.includes('cab') ||
    cat.includes('travels') ||
    cat.includes('cab') ||
    cat.includes('vehicle');

  if (isTravels) return 'travels';

  // 2. International enquiry
  const isInternational =
    cat.includes('international') ||
    src.includes('international') ||
    dest.includes('international') ||
    INTERNATIONAL_DESTINATIONS.some((token) => dest.includes(token));

  if (isInternational) return 'international';

  return 'domestic';
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  badgeLabel: string;
}

export function checkStaffLeadEligibility(staff: any, lead: any): EligibilityResult {
  const leadType = getLeadEnquiryType(lead);
  const profile = staff?.profile || {};
  const role = staff?.role || profile.role_type || 'staff';
  const roleType = profile.role_type || (role === 'operations' ? 'operations' : 'sales');

  const departments: string[] = Array.isArray(profile.departments) && profile.departments.length > 0
    ? profile.departments
    : (profile.department ? profile.department.split(',').map((s: string) => s.trim()) : []);

  const designations: string[] = Array.isArray(profile.designations) && profile.designations.length > 0
    ? profile.designations
    : (profile.designation ? profile.designation.split(',').map((s: string) => s.trim()) : []);

  const hasInternational =
    departments.some((d) => d.toLowerCase().includes('international')) ||
    designations.some((d) => d.toLowerCase().includes('international'));

  const isOperationsStaff =
    role === 'operations' ||
    roleType === 'operations' ||
    designations.some((d) => d.toLowerCase().includes('operation')) ||
    (profile.designation && profile.designation.toLowerCase().includes('operation'));

  // Rule 1: Operations staff can ONLY be assigned to travels enquiry
  if (isOperationsStaff) {
    if (leadType !== 'travels') {
      return {
        eligible: false,
        reason: 'Operation staff can only be assigned to travels & logistics enquiries (cabs, tempo, flights, etc.).',
        badgeLabel: 'Operations Staff (Travels Only)'
      };
    }
    return {
      eligible: true,
      badgeLabel: 'Operations Staff'
    };
  }

  // Rule 2: Cannot assign international package enquiry to domestic-only tour management staff
  if (leadType === 'international') {
    if (!hasInternational) {
      return {
        eligible: false,
        reason: 'Cannot assign International package enquiry to domestic tour management staff. Requires "Holidays & International" department.',
        badgeLabel: 'Domestic Staff (No Int’l)'
      };
    }
    return {
      eligible: true,
      badgeLabel: 'International Specialist'
    };
  }

  // Domestic package enquiry or travels enquiry
  return {
    eligible: true,
    badgeLabel: 'Eligible Consultant'
  };
}

export function checkStaffBatchEligibility(staff: any, leads: any[]): EligibilityResult {
  if (!leads || leads.length === 0) {
    return { eligible: true, badgeLabel: 'Eligible' };
  }

  for (const lead of leads) {
    const res = checkStaffLeadEligibility(staff, lead);
    if (!res.eligible) {
      return res;
    }
  }

  return { eligible: true, badgeLabel: 'Eligible for all selected' };
}

export function generateNextEmployeeId(designation: 'Sales' | 'Operations', existingStaff: any[]): string {
  const prefix = designation === 'Operations' ? 'TBG_OPE_' : 'TBG_SAL_';
  const nums: number[] = [];

  if (Array.isArray(existingStaff)) {
    existingStaff.forEach((s) => {
      const empId = s.profile?.employee_id || s.display_id || '';
      if (empId.startsWith(prefix)) {
        const n = parseInt(empId.replace(prefix, ''), 10);
        if (!isNaN(n)) nums.push(n);
      }
    });
  }

  const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TBG#${Math.floor(1000 + Math.random() * 9000)}!${randomPart}`;
}
