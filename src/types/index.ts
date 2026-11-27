export type UserRole = 'customer' | 'admin' | 'manager' | 'staff' | 'sales' | 'operations' | 'agent';

export interface Branch {
  id: string;
  agency_id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  manager_name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface TravelDocument {
  id: string;
  agency_id: string;
  booking_id: string;
  customer_id?: string;
  agent_id?: string;
  category:
    | 'Booking Confirmation'
    | 'Flight & Travel Ticket'
    | 'Hotel Voucher'
    | 'Transport Voucher'
    | 'Activity Pass'
    | 'Customer-Provided';
  title: string;
  file_name: string;
  file_url: string;
  file_size?: string;
  file_type?: string;
  status: 'available' | 'pending' | 'processing' | 'verified' | 'rejected';
  uploaded_by_role: 'operations' | 'admin' | 'manager' | 'customer' | 'agent' | 'staff';
  uploaded_by_name: string;
  notes?: string;
  expiry_date?: string;
  created_at: string;
  updated_at?: string;
}

export type TripOperationalStatus =
  | 'Booking Received'
  | 'Arrangements Pending'
  | 'Hotel Confirmed'
  | 'Transport Confirmed'
  | 'Documents Ready'
  | 'Ready to Travel'
  | 'Trip In Progress'
  | 'Trip Completed'
  | 'Issue Reported';

export interface OperationsArrangement {
  id: string;
  agency_id: string;
  booking_id: string;
  trip_status: TripOperationalStatus;
  hotel_name?: string;
  room_category?: string;
  meal_plan?: string;
  hotel_confirmation_number?: string;
  hotel_check_in?: string;
  hotel_check_out?: string;
  vehicle_type?: string;
  driver_name?: string;
  driver_phone?: string;
  pickup_location?: string;
  drop_location?: string;
  guide_name?: string;
  guide_phone?: string;
  special_instructions?: string;
  dossier_generated?: boolean;
  dossier_url?: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  agency_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  booking_id?: string;
  subject: string;
  category:
    | 'General Enquiry'
    | 'Booking Modification'
    | 'Payment & Refund'
    | 'On-Trip Support'
    | 'Document Issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  messages: SupportTicketMessage[];
  created_at: string;
  updated_at?: string;
}

export interface AgentCustomer {
  id: string;
  agency_id: string;
  agent_id: string;
  name: string;
  email: string;
  phone: string;
  passport_number?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  notes?: string;
  created_at: string;
}

export interface B2BPricingTier {
  min_pax: number;
  max_pax: number;
  discount_pct: number;
  tier_name: string;
}

export interface B2BPricingCalculation {
  package_id: string;
  package_title: string;
  base_wholesale_price: number;
  travelers_count: number;
  tier_name: string;
  tier_discount_pct: number;
  discount_amount_per_pax: number;
  final_wholesale_price_per_pax: number;
  total_wholesale_cost: number;
  suggested_retail_price: number;
  total_retail_price: number;
  projected_margin_total: number;
  margin_pct: number;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  currency: string;
  currency_symbol?: string;
  logo: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AgencySettings {
  id: string;
  agency_id: string;
  default_wholesale_discount_pct: number;
  lead_auto_assign: boolean;
  advance_payment_pct: number;
  support_email: string;
  terms_conditions?: string;
}

export interface User {
  id: string;
  display_id?: string;
  agency_id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  avatar?: string;
  created_at: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  agency_id: string;
  employee_id: string;
  department: string;
  designation: string;
  assigned_leads_count: number;
  converted_leads_count: number;
  rating?: number;
}

export interface AgentProfile {
  id: string;
  user_id: string;
  agency_id: string;
  company_name: string;
  agent_id: string;
  wholesale_discount_pct: number;
  credit_limit: number;
  total_purchases: number;
  total_sales: number;
  total_margin: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  agency_id: string;
  passport_number?: string;
  emergency_contact?: string;
  preferred_destinations?: string[];
  total_trips: number;
}

export interface Destination {
  id: string;
  agency_id: string;
  name: string;
  slug: string;
  country: string;
  region: 'India' | 'Asia' | 'Europe' | 'Africa' | 'America' | 'Middle East' | 'Island Destinations' | 'Australia & Pacific';
  description: string;
  image: string;
  package_count: number;
  is_featured: boolean;
  is_published: boolean;
  capital?: string;
  currency?: string;
  climate?: string;
  language?: string;
  season?: string;
  tips?: string[];
  accordions?: { title: string; content: string }[];
}

export interface PackageItinerary {
  id: string;
  package_id: string;
  day_number: number;
  title: string;
  description: string;
  meals?: string;
  activities?: string;
}

export interface Package {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  destination_id: string;
  category: string;
  duration_days: number;
  duration_nights: number;
  public_price: number;
  wholesale_price?: number;
  agent_wholesale_price?: number;
  potential_margin?: number;
  margin_pct?: string;
  cover_image: string;
  gallery: string[];
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  accommodation: string;
  transportation: string;
  is_featured: boolean;
  is_published: boolean;
  is_group_tour: boolean;
  available_seats?: number;
  total_seats?: number;
  upcoming_date?: string;
  starting_location?: string;
  ending_location?: string;
  destinations_covered?: string[];
  original_source_url?: string;
  created_at: string;
}

export type LeadStatus =
  | 'New'
  | 'Unassigned'
  | 'Assigned'
  | 'Contacted'
  | 'Follow-up Required'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Converted'
  | 'Lost'
  | 'Cancelled';

export type LeadSource =
  | 'Website Enquiry'
  | 'Custom Trip Form'
  | 'Package Booking'
  | 'Contact Form'
  | 'Agent Referral'
  | 'Direct Admin Entry';

export interface Lead {
  id: string;
  agency_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  interested_destination: string;
  interested_package_id?: string | null;
  travel_date: string;
  travelers_count: number;
  budget: string;
  lead_source: LeadSource | string;
  status: LeadStatus;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string;
  follow_up_date?: string | null;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: 'status_change' | 'note' | 'assignment' | 'contact' | 'quotation';
  description: string;
  created_at: string;
}

export interface QuotationItem {
  description: string;
  amount: number;
}

export interface Quotation {
  id: string;
  agency_id: string;
  lead_id: string;
  package_id?: string;
  staff_id: string;
  quotation_number: string;
  customer_name: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  valid_until: string;
  items: QuotationItem[];
  notes?: string;
  created_at: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partial' | 'Paid' | 'Refunded';

export interface Booking {
  id: string;
  agency_id: string;
  booking_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string;
  agent_id?: string | null;
  agent_name?: string | null;
  package_id: string;
  package_title: string;
  travel_start_date: string;
  travel_end_date?: string;
  travelers_count: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  special_requests?: string;
  created_at: string;
  sales_executive_id?: string | null;
  sales_executive_name?: string | null;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  assigned_staff_department?: string | null;
  assigned_team?: any[];
}

export interface Payment {
  id: string;
  agency_id: string;
  booking_id: string;
  amount: number;
  payment_type: 'Advance' | 'Balance' | 'Full' | 'Refund';
  payment_method: 'UPI' | 'Credit Card' | 'Bank Transfer' | 'Cash' | 'Cheque';
  transaction_reference: string;
  payment_date: string;
  notes?: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface AgentPurchase {
  id: string;
  agency_id: string;
  agent_id: string;
  package_id: string;
  package_title: string;
  travelers_count: number;
  travel_date: string;
  wholesale_price: number;
  total_cost: number;
  client_name: string;
  client_selling_price: number;
  projected_margin: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface AgentTransaction {
  id: string;
  agency_id: string;
  agent_id: string;
  type: 'Purchase' | 'Payment' | 'Commission' | 'Credit';
  amount: number;
  balance_after: number;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface HeroBanner {
  id: string;
  agency_id: string;
  title: string;
  subtitle: string;
  image_desktop: string;
  image_mobile: string;
  video_url?: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  display_order: number;
  is_active: boolean;
}

export interface Testimonial {
  id: string;
  agency_id: string;
  customer_name: string;
  customer_image?: string;
  destination: string;
  rating: number;
  comment: string;
  review_text?: string;
  is_published: boolean;
  created_at: string;
}

export interface TravelService {
  id: string;
  agency_id?: string;
  title: string;
  icon: string;
  short_desc: string;
  details: string;
}

export interface AppNotification {
  id: string;
  agency_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  is_read: boolean;
  created_at: string;
}
