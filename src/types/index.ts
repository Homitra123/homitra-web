export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  image: string;
  pricingTiers: PricingTier[];
}

export interface IncludedGroup {
  heading: string;
  items: string[];
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  duration: string;
  description?: string;
  features: string[];
  included?: string[];
  includedGroups?: IncludedGroup[];
  notIncluded?: string[];
}

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  tier: string;
  date: string;
  timeSlot: string;
  location: string;
  address: string;
  price: number;
  status: 'pending' | 'confirmed' | 'partner_assigned' | 'in_progress' | 'completed' | 'cancelled';
  partnerName?: string;
  createdAt: string;
}

export interface BookingFormData {
  date: string;
  timeSlot: string;
  location: string;
  address: string;
  tierId: string;
}

export const BANGALORE_LOCATIONS = [
  'Doddabanahalli',
  'Ardendale',
  'Bevina Mara Colony, Kannamangala',
  'Kannamangala',
  'Others'
] as const;

export const HOUSEKEEP_DURATIONS = [
  { hours: 2, label: '2 Hours', price: 249 },
  { hours: 3, label: '3 Hours', price: 299 },
  { hours: 4, label: '4 Hours', price: 399 },
  { hours: 5, label: '5 Hours', price: 499 },
] as const;

export const DURATIONS = [
  { minutes: 60, label: '60 Mins', price: 199, originalPrice: 299, discount: 33 },
  { minutes: 90, label: '90 Mins', price: 249, originalPrice: 374, discount: 33 },
  { minutes: 120, label: '2 Hours', price: 299, originalPrice: 449, discount: 33 },
  { minutes: 150, label: '2.5 Hours', price: 349, originalPrice: 524, discount: 33 },
  { minutes: 240, label: '4 Hours', price: 499, originalPrice: 749, discount: 33 },
  { minutes: 360, label: '6 Hours', price: 699, originalPrice: 1049, discount: 33 },
  { minutes: 480, label: '8 Hours', price: 799, originalPrice: 1199, discount: 33 },
] as const;

export const TIME_PERIODS = ['Morning', 'Afternoon', 'Evening'] as const;

export const TIME_SLOTS = {
  Morning: ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
  Afternoon: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
  Evening: ['06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'],
} as const;
