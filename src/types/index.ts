/**
 * Domain Models & Type Definitions
 * Shopping by Jitesh
 */

export type UserRole = 'customer' | 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku: string;
  priceModifier: number;
  attributes: Record<string, string>; // e.g. { Color: 'Space Grey', Storage: '256GB' }
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  basePrice: number;
  salePrice?: number | null;
  sku: string;
  brand: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  variants?: ProductVariant[];
  inStock?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  product: Product;
  selectedVariant?: ProductVariant | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  userId?: string | null;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  estimatedTax: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_rejected'
  | 'returned';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  productTitle: string;
  variantTitle?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  productImage?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddressId?: string;
  shippingAddress?: Address;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentMethod: string;
  transactionReference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  proofUrl?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PaymentSettings {
  id: string;
  upiId: string;
  qrCodeUrl?: string;
  paymentDisplayName: string;
  paymentInstructions?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount?: number;
  validUntil: string;
  isActive: boolean;
}

export interface ProductFilterState {
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  brand?: string[];
  inStockOnly?: boolean;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
  searchQuery?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchSuggestionProduct {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  brand?: string;
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
}

export interface SearchSuggestionCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
}

export interface SearchSuggestionsResult {
  products: SearchSuggestionProduct[];
  categories: SearchSuggestionCategory[];
  querySuggestions: string[];
  correctedQuery?: string;
}

