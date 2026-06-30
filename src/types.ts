export type UserRole = 'customer' | 'bakery' | 'ngo' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  customerProfile?: CustomerProfile;
  bakeryProfile?: BakeryProfile;
  ngoProfile?: NGOProfile;
}

export interface CustomerProfile {
  loyaltyPoints: number;
  greenBadges: string[];
  savedKg: number;
  savedCo2: number;
  savedMeals: number;
  coupons: Coupon[];
}

export interface Coupon {
  code: string;
  discountAmount: number;
  description: string;
  expiryDate: string;
}

export interface BakeryProfile {
  id: string;
  name: string;
  logo: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  operatingHours: string;
  contact: string;
  safetyCertificate: string;
  gstNumber?: string;
  sustainabilityScore: number;
  rating: number;
  reviewsCount: number;
  savedKg: number;
  savedCo2: number;
  mealsRescued: number;
  revenueRecovered: number;
}

export interface NGOProfile {
  id: string;
  name: string;
  description: string;
  address: string;
  contact: string;
  registrationNumber: string;
  mealsDistributed: number;
}

export type ListingStatus = 'available' | 'reserved' | 'sold_out' | 'donated' | 'expired';

export interface ProductListing {
  id: string;
  bakeryId: string;
  bakeryName: string;
  name: string;
  category: 'pastry' | 'bread' | 'cookies' | 'cakes' | 'dessert' | 'savory' | 'other';
  description: string;
  originalPrice: number;
  rescuePrice: number;
  quantity: number;
  expiryTime: string; // ISO string
  pickupStart: string; // Time (HH:MM)
  pickupEnd: string; // Time (HH:MM)
  image: string;
  allergens: string[];
  ingredients: string;
  label: 'vegetarian' | 'eggless' | 'vegan' | 'none';
  status: ListingStatus;
  isRescueBox: boolean;
  estimatedValue?: number; // Only for rescue boxes
}

export type OrderStatus = 'reserved' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  listingId: string;
  listingName: string;
  listingImage: string;
  bakeryId: string;
  bakeryName: string;
  customerId: string;
  customerName: string;
  quantity: number;
  totalAmount: number;
  pickupSlot: string; // e.g. "18:00 - 19:00"
  status: OrderStatus;
  qrCode: string; // token used to verify pickup
  timestamp: string; // ISO string
  hasReview?: boolean;
}

export type DonationStatus = 'available' | 'accepted' | 'completed';

export interface Donation {
  id: string;
  bakeryId: string;
  bakeryName: string;
  ngoId?: string;
  ngoName?: string;
  title: string;
  description: string;
  quantity: number; // e.g. in kg or boxes
  status: DonationStatus;
  timestamp: string;
  scheduledPickup?: string; // ISO string or text
}

export interface Review {
  id: string;
  bakeryId: string;
  customerId: string;
  customerName: string;
  rating: number;
  foodQuality: number;
  freshness: number;
  pickupExperience: number;
  valueForMoney: number;
  comment: string;
  image?: string;
  timestamp: string;
}

export interface WasteAnalytics {
  foodSavedKg: number;
  co2SavedKg: number;
  mealsRescued: number;
  revenueRecovered: number;
}
