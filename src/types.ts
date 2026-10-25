export interface BulkTier {
  minQty: number;
  maxQty?: number;
  unitPrice: number; // In Indian Rupees (₹)
  label?: string;
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
  bulkTiers: BulkTier[];
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
  customerName: string;
  companyName: string;
  email: string;
  phone: string; // Indian +91 format
  city: string;
  state: string;
  pincode: string;
  shippingAddress: string;
  gstin?: string; // Indian GSTIN number
  transportPreference?: string; // VRL, TCI, Delhivery, Safechem, etc.
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
  status: 'Pending Review' | 'Confirmed' | 'Dispatched' | 'Delivered';
  notes?: string;
}

export interface WholesaleUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin'; // Hiddenly saved as 'user' for signups; 'admin' for staff
  companyName?: string;
  city?: string;
  state?: string;
  gstin?: string;
}
