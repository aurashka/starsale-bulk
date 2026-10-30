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
  MapPin,
  QrCode,
  Banknote,
  Info
} from 'lucide-react';
import { CartItem, WholesaleOrder, WholesaleUser, PaymentSettings } from '../types.ts';
import { createWholesaleOrder, getOrCreateDeviceUser, autoRegisterOrLoginCheckoutUser, getLocalPaymentSettings, isUserAdmin } from '../services/dataService.ts';
import { formatPrice } from '../utils/format.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  currentUser: WholesaleUser | null;
  paymentSettings?: PaymentSettings;
  onUserAutoLogin?: (user: WholesaleUser) => void;
  onOpenPaymentGateway?: (order: WholesaleOrder) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  paymentSettings: propPaymentSettings,
  onUserAutoLogin,
  onOpenPaymentGateway
}) => {
  const paymentSettings = propPaymentSettings || getLocalPaymentSettings();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<WholesaleOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Prepaid UPI' | 'Cash on Delivery'>('Prepaid UPI');
  const [moqNotice, setMoqNotice] = useState<string | null>(null);

  // Form fields for Indian B2B buyers (Only Name & Phone are mandatory)
  const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 ');
  const [city, setCity] = useState(currentUser?.city || '');
  const [stateName, setStateName] = useState(currentUser?.state || 'Direct Transport');
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

  // Dynamic delivery freight charges configured by Admin
  const estimatedShipping = paymentSettings.isFreeDelivery
    ? 0
    : (paymentSettings.freeDeliveryThreshold > 0 && subtotal >= paymentSettings.freeDeliveryThreshold)
    ? 0
    : (paymentSettings.flatDeliveryCharge ?? 450);

  // Cash on Delivery extra charge & advance token
  const isCod = paymentMethod === 'Cash on Delivery' && paymentSettings.isCodEnabled;
  const codExtraCharge = isCod ? (paymentSettings.codExtraCharge || 0) : 0;
  const finalTotal = subtotal + estimatedShipping + codExtraCharge;
  const payableNow = isCod 
    ? Math.min(finalTotal, (paymentSettings.codAdvanceAmount || codExtraCharge || 500)) 
    : finalTotal;
  const codRemaining = isCod ? Math.max(0, finalTotal - payableNow) : 0;

  const handleProceedToCheckout = () => {
    // Check if any product quantity is lower than its MOQ
    const invalidMoqItem = items.find(item => item.quantity < (item.product.moq || 1));
    if (invalidMoqItem) {
      const minRequired = invalidMoqItem.product.moq || 1;
      setMoqNotice(`Cannot proceed! "${invalidMoqItem.product.name}" requires a minimum order quantity (MOQ) of ${minRequired} pcs (Current in cart: ${invalidMoqItem.quantity} pcs). Please increase quantity.`);
      setTimeout(() => setMoqNotice(null), 6000);
      return;
    }
    setMoqNotice(null);
    setIsCheckingOut(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Strict MOQ verification on submit
    const invalidMoqItem = items.find(item => item.quantity < (item.product.moq || 1));
    if (invalidMoqItem) {
      const minRequired = invalidMoqItem.product.moq || 1;
      setMoqNotice(`Cannot place order! "${invalidMoqItem.product.name}" requires minimum order quantity of ${minRequired} pcs. Current: ${invalidMoqItem.quantity} pcs.`);
      setIsCheckingOut(false);
      return;
    }

    const trimmedName = customerName.trim();
    const rawDigits = phone.replace(/\D/g, '');
    if (!trimmedName) {
      alert('Please enter your Name or Contact Person name.');
      return;
    }
    if (rawDigits.length < 10) {
      alert('Please enter a valid 10-digit Mobile / WhatsApp Number.');
      return;
    }

    setIsSubmitting(true);

    // 1. AUTO-LOGIN / REGISTER: If not logged in, automatically create user account & log in!
    let activeUser: WholesaleUser;
    if (currentUser && currentUser.uid && !currentUser.uid.startsWith('dev_')) {
      // Existing logged-in user (including Admin) - Preserve their session and role!
      activeUser = {
        ...currentUser,
        role: isUserAdmin(currentUser) ? 'admin' : (currentUser.role || 'user')
      };
    } else {
      activeUser = await autoRegisterOrLoginCheckoutUser({
        name: trimmedName,
        phone,
        email,
        companyName,
        city,
        state: stateName,
        gstin
      });
      if (onUserAutoLogin) {
        onUserAutoLogin(activeUser);
      }
    }

    const orderNumber = `STD-IN-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticketId = `TRK-${orderNumber.replace(/[^0-9]/g, '')}`;

    const newOrder: WholesaleOrder = {
      id: `order-${Date.now()}`,
      orderNumber,
      trackingTicketId: ticketId,
      createdAt: Date.now(),
      userId: activeUser.uid,
      trackingStep: 1,
      trackingBiltiNumber: `VRL-${Math.floor(100000 + Math.random() * 900000)}`,
      trackingCarrier: transportPreference || 'VRL Logistics India',
      customerName: trimmedName,
      companyName: companyName.trim() || 'B2B Retail Store',
      email: activeUser.email,
      phone: activeUser.phone,
      city: city.trim() || 'Direct Godown',
      state: stateName.trim() || 'Direct Road Cargo',
      pincode: pincode.trim() || '400001',
      shippingAddress: shippingAddress.trim() || 'Direct Transport Godown Delivery',
      gstin: gstin.trim() || undefined,
      transportPreference,
      notes: notes.trim() || undefined,
      statusNote: isCod 
        ? `COD Consignment booked. Pay advance ₹${payableNow} via UPI QR to dispatch. Remaining ₹${codRemaining} on delivery.`
        : 'Prepaid consignment order booked. Scan UPI QR and submit UTR to verify.',
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
      codCharge: isCod ? codExtraCharge : undefined,
      codAdvanceAmount: isCod ? payableNow : undefined,
      codRemainingAmount: isCod ? codRemaining : undefined,
      totalAmount: finalTotal,
      paymentMethod,
      paymentStatus: 'Pending Payment',
      status: 'Pending Review'
    };

    try {
      await createWholesaleOrder(newOrder);
      setPlacedOrder(newOrder);
      onClearCart();
      onClose(); // Close CartDrawer so PaymentGatewayModal is clean and unobstructed
      if (onOpenPaymentGateway) {
        onOpenPaymentGateway(newOrder);
      }
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

        {/* MOQ Notice Banner */}
        {moqNotice && (
          <div className="bg-red-800 text-white text-xs px-4 py-2.5 flex items-start justify-between gap-2 shadow-sm font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0 text-amber-300" />
              <span>{moqNotice}</span>
            </div>
            <button onClick={() => setMoqNotice(null)} className="text-white hover:text-neutral-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Quick Booking (No Login Required)</span>
                  <span className="text-[11px] text-emerald-800">
                    Sirf apna Naam aur Mobile Number daalein. Order aapke isi phone/browser me auto-save rahega restart hone par bhi!
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-900 flex items-center justify-between">
                    <span>Contact Name *</span>
                    <span className="text-[10px] text-red-600 font-bold">Required</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-900 flex items-center justify-between">
                    <span>Mobile / WhatsApp *</span>
                    <span className="text-[10px] text-red-600 font-bold">Required</span>
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none font-mono font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Firm / Shop / Company Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Fashion Studio & Retailers"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Email ID (Optional)</label>
                <input
                  type="email"
                  placeholder="billing@yourstore.in (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">City (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Indore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">State (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MP / Gujarat"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Pincode (Optional)</label>
                  <input
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
                <label className="font-bold text-neutral-800">Delivery Address / Transport Godown (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Shop number, Road, Godown / Transport office address"
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

              {/* Itemized Consignment Lot Summary */}
              <div className="bg-[#fcfcfa] p-3.5 rounded-2xl border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider block">
                  Items in Consignment ({items.length} lots • {totalQuantity} pcs):
                </span>
                <div className="divide-y divide-neutral-100 max-h-36 overflow-y-auto no-scrollbar pr-1">
                  {items.map((it, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {it.product.images[0] && (
                          <img 
                            src={it.product.images[0]} 
                            alt={it.product.name} 
                            className="w-7 h-8 object-cover rounded bg-neutral-100 flex-shrink-0 border border-neutral-200"
                          />
                        )}
                        <span className="truncate font-medium text-neutral-800">
                          {it.product.name} ({it.selectedSize}/{it.selectedColor})
                        </span>
                      </div>
                      <span className="font-mono text-neutral-600 flex-shrink-0">
                        {it.quantity} pcs @ ₹{it.appliedUnitPrice} = <strong>₹{formatPrice(it.appliedUnitPrice * it.quantity)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selection (Prepaid UPI vs Cash on Delivery) */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-neutral-900 block text-xs">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Prepaid UPI QR */}
                  <div 
                    onClick={() => setPaymentMethod('Prepaid UPI')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'Prepaid UPI'
                        ? 'border-red-800 bg-red-50/50 ring-2 ring-red-100 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-red-800" />
                        <span className="font-black text-xs text-neutral-900">Prepaid UPI QR</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Fastest Dispatch
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-tight">
                      Scan UPI QR & submit UTR. 100% online verification with full invoice credit.
                    </p>
                  </div>

                  {/* Option 2: Cash on Delivery (Advance Required) */}
                  {paymentSettings.isCodEnabled !== false && (
                    <div 
                      onClick={() => setPaymentMethod('Cash on Delivery')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'Cash on Delivery'
                          ? 'border-amber-700 bg-amber-50/50 ring-2 ring-amber-100 shadow-xs'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-amber-700" />
                          <span className="font-black text-xs text-neutral-900">Cash on Delivery</span>
                        </div>
                        {codExtraCharge > 0 && (
                          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                            +₹{codExtraCharge} COD fee
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-tight">
                        Pay ₹{formatPrice(payableNow)} Advance Token via QR now. Rest ₹{formatPrice(codRemaining)} on delivery.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Financial Summary */}
              <div className="bg-[#fcfcfa] p-3.5 rounded-2xl border border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Goods Subtotal:</span>
                  <span className="font-bold text-neutral-900">₹{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Road Freight Cargo:</span>
                  <span className="font-bold text-emerald-700">
                    {estimatedShipping === 0 
                      ? 'FREE Transport Cargo' 
                      : `₹${formatPrice(estimatedShipping)}`}
                  </span>
                </div>

                {isCod && codExtraCharge > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>COD Handling Fee:</span>
                    <span className="font-bold text-amber-900">+₹{formatPrice(codExtraCharge)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-900 font-bold pt-1 border-t border-neutral-200">
                  <span>Total Consignment Value:</span>
                  <span>₹{formatPrice(finalTotal)}</span>
                </div>

                {/* Payable Now Highlight */}
                <div className="flex justify-between text-neutral-900 font-black text-sm pt-1.5 border-t border-neutral-300">
                  <span className="flex items-center gap-1">
                    <span>Payable Now via UPI QR:</span>
                    {isCod && <span className="text-[10px] font-bold text-amber-700 font-normal">(Advance Token)</span>}
                  </span>
                  <span className="text-red-700 text-base">₹{formatPrice(payableNow)}</span>
                </div>

                {isCod && codRemaining > 0 && (
                  <div className="flex justify-between text-amber-900 font-bold text-[11px] pt-1">
                    <span>Remaining Balance on Delivery:</span>
                    <span className="font-mono">₹{formatPrice(codRemaining)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="px-4 py-3 rounded-xl border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-100 text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {isSubmitting 
                      ? 'Generating UPI Gateway...' 
                      : isCod 
                      ? `Confirm COD & Pay ₹${formatPrice(payableNow)} Advance` 
                      : `Pay ₹${formatPrice(payableNow)} via UPI QR`}
                  </span>
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
                          <div className="text-[11px] text-neutral-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-neutral-800">{item.selectedSize}</span>
                            <span>•</span>
                            <span className="truncate">{item.selectedColor}</span>
                            <span>•</span>
                            <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-mono">
                              MOQ: {item.product.moq || 1} pcs
                            </span>
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
                            onClick={() => {
                              const minMoq = item.product.moq || 1;
                              if (item.quantity <= minMoq) {
                                setMoqNotice(`"${item.product.name}" requires at least ${minMoq} pcs (MOQ). You cannot order less than this. Remove with trash if not needed.`);
                                setTimeout(() => setMoqNotice(null), 4000);
                                return;
                              }
                              const step = (item.quantity - minMoq >= 5) ? 5 : 1;
                              onUpdateQuantity(idx, Math.max(minMoq, item.quantity - step));
                            }}
                            disabled={item.quantity <= (item.product.moq || 1)}
                            className="w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={item.quantity <= (item.product.moq || 1) ? `Minimum order is ${item.product.moq || 1} pcs` : 'Decrease'}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black text-neutral-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity + 5)}
                            className="w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700"
                            title="Increase"
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
                onClick={handleProceedToCheckout}
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
