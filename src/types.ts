export interface BulkTier {
  minQty: number;
  maxQty?: number;
  unitPrice: number; // In Indian Rupees (₹)
  label?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface ProductSpecItem {
  label: string;
  value: string;
}

export interface ProductSpecCard {
  id: string;
  title: string;
  items?: ProductSpecItem[];
  description?: string;
}

export interface CompanyFooterInfo {
  brandTitle: string;
  brandSubtitle: string;
  aboutText: string;
  b2bPhone: string;
  supportEmail: string;
  supportHours: string;
  gstin: string;
  hsnCode: string;
  wholesaleHubs: string[];
  buyerFacilities: string[];
  bottomCopyrightText: string;
  bottomNetworkText: string;
}

export interface HeroSlide {
  id: string;
  tag?: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  imageUrl: string;
  linkedProductId?: string; // Links to pre-added catalog product
  buttonText?: string;      // e.g. "Browse Wholesale Lot" / "View Lot"
  sequence?: number;
}

export interface Product {
  id: string;
  shortCode?: string; // Short 6-character unique ID for easy sharing (e.g. "K7X9PQ")
  name: string;
  category: string;
  subCategory?: string;
  sku: string;
  basePrice: number; // Base Wholesale Price in INR (₹)
  moq: number; // Minimum Order Quantity in pcs (e.g. 10 pcs, 25 pcs)
  stock: number;
  isOutOfStock?: boolean; // When true, dims in catalog and disables ordering
  codAvailable?: boolean; // Cash on delivery availability (default: true)
  description: string;
  material: string; // e.g. "100% Combed Heavy Cotton (240 GSM)"
  colors: string[];
  sizes: string[];
  images: string[]; // Direct links
  isNew?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  displayPlacement?: 'both' | 'horizontal' | 'vertical'; // Horizontal, Vertical, or Both (legacy compatibility)
  showInHorizontal?: boolean; // If true, explicitly included in horizontal scroller
  horizontalSequence?: number; // Ordering sequence in horizontal scroller
  showInVertical?: boolean; // If true, explicitly included in vertical catalog
  verticalSequence?: number; // Ordering sequence in vertical catalog
  sequence?: number; // General ordering sequence fallback (1, 2, 3...)
  bulkTiers: BulkTier[];
  specCards?: ProductSpecCard[]; // Multiple custom cards for specs, fabric, manufacturing, wash care, etc.
  createdAt?: number;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  appliedUnitPrice: number; // In INR (₹)
}

export interface PaymentSettings {
  upiId: string;
  upiName: string;
  qrCodeUrl: string;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number; // e.g. 20000
  flatDeliveryCharge: number; // e.g. 450
  isCodEnabled: boolean;
  codExtraCharge: number; // e.g. 250
  codAdvanceAmount: number; // e.g. 500
}

export interface DeliveryAttempt {
  attemptNumber: number;
  date: number;
  reason: string;
  note?: string;
}

export interface WholesaleOrder {
  id: string;
  orderNumber: string;
  trackingTicketId?: string; // e.g. TRK-2026-84920
  createdAt: number;
  userId?: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string; // Indian +91 format
  city: string;
  state: string;
  pincode: string;
  shippingAddress: string;
  gstin?: string;
  transportPreference?: string;
  items: {
    productId: string;
    productName: string;
    image: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalQuantity: number;
  subtotal: number;
  estimatedShipping: number;
  codCharge?: number;
  totalAmount: number;

  // Payment Details
  paymentMethod: 'Prepaid UPI' | 'Cash on Delivery';
  paymentStatus: 'Pending Payment' | 'Payment Verification' | 'Paid' | 'Payment Failed' | 'UTR Resubmit Requested';
  paymentUtr?: string;
  paidAmount?: number;
  codAdvanceAmount?: number;
  codRemainingAmount?: number;
  paymentErrorNote?: string;
  utrResubmitAllowed?: boolean;

  // Consignment & Dispatch Tracking
  status: 'Pending Review' | 'Payment Verification' | 'Confirmed' | 'Dispatched' | 'Out for Delivery' | 'Delivered' | 'Rejected' | 'Delivery Attempted';
  trackingStep?: number; // 0: Rejected, 1: Payment Verification, 2: Confirmed & Packing, 3: In Transit, 4: Out for Delivery, 5: Delivered, 6: Delivery Attempted
  trackingBiltiNumber?: string;
  trackingCarrier?: string;
  deliveryAttempts?: DeliveryAttempt[];
  trackingTimeline?: { status: string; title: string; note?: string; timestamp: number }[];
  notes?: string;
  statusNote?: string; // Custom message note if rejected, delivery attempted, or transit update
  updatedAt?: number;
}

export interface WholesaleUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  companyName?: string;
  city?: string;
  state?: string;
  gstin?: string;
}
