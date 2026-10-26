import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  MapPin 
} from 'lucide-react';
import { CartItem, WholesaleOrder, WholesaleUser } from '../types.ts';
import { createWholesaleOrder } from '../services/dataService.ts';
import { formatPrice } from '../utils/format.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  currentUser: WholesaleUser | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<WholesaleOrder | null>(null);

  // Form fields for Indian B2B buyers
  const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 ');
  const [city, setCity] = useState(currentUser?.city || '');
  const [stateName, setStateName] = useState(currentUser?.state || 'Maharashtra');
  const [pincode, setPincode] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [gstin, setGstin] = useState(currentUser?.gstin || '');
  const [transportPreference, setTransportPreference] = useState('VRL Logistics / TCI Express');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.appliedUnitPrice * item.quantity, 0);
  const regularTotal = items.reduce((acc, item) => acc + item.product.basePrice * item.quantity, 0);
  const bulkSavings = regularTotal - subtotal;
  const estimatedShipping = subtotal > 20000 ? 0 : 450; // Free transport cargo above ₹20,000
  const finalTotal = subtotal + estimatedShipping;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    const orderNumber = `STD-IN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: WholesaleOrder = {
      id: `order-${Date.now()}`,
      orderNumber,
      createdAt: Date.now(),
      userId: currentUser?.uid || (phone ? `usr_${phone.replace(/\D/g, '')}` : `guest_${Date.now()}`),
      trackingStep: 1,
      trackingBiltiNumber: `VRL-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: customerName || 'Retail Partner',
      companyName: companyName || 'B2B Retail Store',
      email: email || 'buyer@business.in',
      phone: phone || '+91 98000 00000',
      city: city || 'Mumbai',
      state: stateName || 'Maharashtra',
      pincode: pincode || '400001',
      shippingAddress: shippingAddress || 'Direct Transport Godown Delivery',
      gstin: gstin || undefined,
      transportPreference,
      notes: notes || undefined,
      statusNote: 'Consignment order received. Pending dispatch desk review.',
      items: items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        image: item.product.images[0],
        size: item.selectedSize,
        color: item.selectedColor,
        quantity: item.quantity,
        unitPrice: item.appliedUnitPrice,
        total: item.appliedUnitPrice * item.quantity
      })),
      totalQuantity,
      subtotal,
      estimatedShipping,
      totalAmount: finalTotal,
      status: 'Pending Review'
    };

    try {
      await createWholesaleOrder(newOrder);
      setPlacedOrder(newOrder);
      onClearCart();
    } catch (err) {
      console.error('Order creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/65 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      
      {/* Drawer Panel */}
      <div 
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between relative transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-[#fbfbfa]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black font-heading text-neutral-900">
              {placedOrder ? 'Wholesale Order Booked' : isCheckingOut ? 'B2B GST Transport Order' : 'Wholesale Bag (₹ INR)'}
            </h2>
            {!placedOrder && !isCheckingOut && (
              <span className="text-xs font-mono bg-neutral-900 text-yellow-300 px-2 py-0.5 rounded-full font-bold">
                {totalQuantity} pcs
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
          
          {/* State 1: Order Confirmed Screen */}
          {placedOrder ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black font-heading text-neutral-900">
                Order Dispatched to Dispatch Queue!
              </h3>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                Saved in Firebase realtime database. Our Tirupur/Surat warehouse team will generate your GST e-way bill.
              </p>

              <div className="bg-[#fcfcfa] border border-neutral-200 rounded-2xl p-4 text-left text-xs space-y-2 mt-4">
                <div className="flex justify-between font-mono">
                  <span className="text-neutral-500">Order Booking No:</span>
                  <span className="font-bold text-red-600">{placedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Company / Shop:</span>
                  <span className="font-semibold text-neutral-900">{placedOrder.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Delivery City & State:</span>
                  <span className="font-semibold text-neutral-900">{placedOrder.city}, {placedOrder.state} ({placedOrder.pincode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Lot Items:</span>
                  <span className="font-semibold text-neutral-900">{placedOrder.totalQuantity} pcs</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-2 border-t border-neutral-200">
                  <span>Invoice Total (₹ INR):</span>
                  <span className="text-red-600">₹{formatPrice(placedOrder?.totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setPlacedOrder(null);
                  setIsCheckingOut(false);
                  onClose();
                }}
                className="w-full mt-6 py-3.5 bg-neutral-900 text-white rounded-full font-bold text-sm hover:bg-neutral-800 transition-all"
              >
                Continue Sourcing Wholesale
              </button>
            </div>
          ) : isCheckingOut ? (
            
            /* State 2: Checkout Form with Indian details */
            <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-amber-900">
                <Building2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Fill business billing details for GST invoice and transport bilti / consignment note.</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Firm / Shop / Company Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Royal Fashion Studio & Retailers"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Contact Person *</label>
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Mobile Number (+91) *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Business Email *</label>
                <input
                  required
                  type="email"
                  placeholder="billing@yourstore.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">City *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Indore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">State *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. MP / Gujarat"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Pincode *</label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="452001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Delivery Address / Transport Godown *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Shop number, Market complex, Road, Landmark"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none uppercase font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Transport Cargo Preference</label>
                  <select
                    value={transportPreference}
                    onChange={(e) => setTransportPreference(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none bg-white"
                  >
                    <option value="VRL Logistics / TCI Express">VRL / TCI Cargo</option>
                    <option value="Delhivery Surface Freight">Delhivery Freight</option>
                    <option value="Safechem Road Cargo">Safechem Cargo</option>
                    <option value="Local Transport (Self Booking)">Local Transport</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Special Packing Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Master carton packaging, custom tag inserts"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* Order summary mini block */}
              <div className="bg-[#fcfcfa] p-3 rounded-xl border border-neutral-200 space-y-1.5 pt-3">
                <div className="flex justify-between text-neutral-600">
                  <span>Total Wholesale Units:</span>
                  <span className="font-bold text-neutral-900">{totalQuantity} pcs</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Road Freight Cargo:</span>
                  <span className="font-bold text-emerald-700">
                    {estimatedShipping === 0 ? 'FREE Cargo Transport (Order > ₹20k)' : `₹${estimatedShipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-900 font-black text-sm pt-1 border-t border-neutral-200">
                  <span>Payable Amount (₹ INR):</span>
                  <span className="text-red-600">₹{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="px-4 py-3 rounded-full border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-black transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Booking Order...' : `Book Lot (₹${formatPrice(finalTotal)})`}
                </button>
              </div>
            </form>

          ) : (

            /* State 3: Bag Item List in ₹ INR */
            <div>
              {items.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-800">Your Bulk Bag is Empty</h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Browse our wholesale catalog and select sizes and bulk lots in Indian Rupees (₹) to begin.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {items.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between gap-3">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-14 h-16 object-cover rounded-xl bg-neutral-100 flex-shrink-0 border border-neutral-200"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {item.product.name}
                          </h4>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-neutral-800">{item.selectedSize}</span>
                            <span>•</span>
                            <span className="truncate">{item.selectedColor}</span>
                          </div>
                          <div className="text-xs font-black text-red-600 font-heading mt-1">
                            ₹{formatPrice(item?.appliedUnitPrice)}
                            <span className="text-[10px] font-normal text-neutral-400 ml-1">/pc</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center border border-neutral-200 rounded-full bg-[#f8f8f6] px-1.5 py-0.5">
                          <button
                            onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 5))}
                            className="w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black text-neutral-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity + 5)}
                            className="w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Checkout Bar with Bold Colors */}
        {!placedOrder && !isCheckingOut && items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-[#fbfbfa] space-y-3">
            
            {/* Wholesale discount indicator */}
            {bulkSavings > 0 && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-emerald-800">
                <span className="font-bold">Total Bulk Discount Profit:</span>
                <span className="font-black text-emerald-700">-₹{formatPrice(bulkSavings)}</span>
              </div>
            )}

            {/* Subtotal Row */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-bold">Total (₹ INR)</span>
                <div className="text-2xl font-black text-neutral-900 font-heading">
                  ₹{formatPrice(subtotal)}
                </div>
              </div>

              {/* Checkout Pill Button in Bold Crimson Red */}
              <button
                onClick={() => setIsCheckingOut(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-black text-sm px-8 py-3 rounded-full transition-all active:scale-95 shadow-lg flex items-center gap-2"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-500 font-mono pt-1">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-red-600" /> All-India Cargo Transport
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> GST Invoice
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
