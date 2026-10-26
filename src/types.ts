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
  name: string;
  category: string;
  subCategory?: string;
  sku: string;
  basePrice: number; // Base Wholesale Price in INR (₹)
  moq: number; // Minimum Order Quantity in pcs (e.g. 10 pcs, 25 pcs)
  stock: number;
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

export interface WholesaleOrder {
  id: string;
  orderNumber: string;
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
  totalAmount: number;
  status: 'Pending Review' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Rejected' | 'Delivery Attempted';
  trackingStep?: number; // 1: Confirmed, 2: Packed & Bilti, 3: In Transit, 4: Delivered, 5: Delivery Attempted, 0: Rejected
  trackingBiltiNumber?: string;
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
