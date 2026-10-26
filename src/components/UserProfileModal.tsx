import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  LogOut, 
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Lock,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { WholesaleUser, WholesaleOrder } from '../types.ts';
import { subscribeToOrders } from '../services/dataService.ts';
import { formatPrice } from '../utils/format.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: WholesaleUser;
  onSignOut: () => void;
  onOpenAdmin?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  onOpenAdmin
}) => {
  const [userOrders, setUserOrders] = useState<WholesaleOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToOrders((allOrders) => {
        // Filter orders for this specific logged-in user
        const filtered = allOrders.filter(ord => 
          (ord.email && ord.email.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (ord.phone && ord.phone.replace(/\s+/g, '') === currentUser.phone?.replace(/\s+/g, '')) ||
          (ord.userId && ord.userId === currentUser.uid)
        );
        setUserOrders(filtered);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fafaf9] flex flex-col animate-in fade-in duration-200">
      
      {/* Top Header Bar for Full-Page Account View */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 hover:text-red-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-red-50 text-neutral-800 group-hover:text-red-800 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>Back to Store</span>
          </button>

          <span className="h-5 w-px bg-neutral-300 hidden sm:block"></span>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-heading font-black text-sm text-neutral-900">
              B2B TRADE ACCOUNT
            </span>
            <span className="text-[10px] font-mono bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded-full font-bold">
              {currentUser.role === 'admin' ? 'ADMIN ACCESS' : 'VERIFIED TRADER'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Panel Button shown in profile when role === 'admin' */}
          {currentUser.role === 'admin' && onOpenAdmin && (
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="px-3.5 py-1.5 rounded-full bg-red-800 hover:bg-red-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}

          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Profile Hero Header Banner */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white px-4 sm:px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 text-white flex items-center justify-center font-black text-2xl border border-white/20 shadow-inner">
              {(currentUser.name || currentUser.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-heading tracking-wide">
                  {currentUser.name || 'Trader Partner'}
                </h2>
                {currentUser.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-md bg-white text-red-900 text-[10px] font-black uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-red-100 flex flex-wrap items-center gap-2 mt-1">
                <span className="font-semibold">{currentUser.companyName || 'Verified B2B Buyer'}</span>
                <span>•</span>
                <span className="font-mono">{currentUser.phone}</span>
                <span>•</span>
                <span>{currentUser.email}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats or Admin Action */}
          <div className="flex items-center gap-3">
            {currentUser.role === 'admin' && onOpenAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-4 py-2 bg-white text-red-900 hover:bg-red-50 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-red-800" />
                <span>Open Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Full-Page Tabs Container */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-2xl border border-neutral-200 flex items-center gap-2 mb-6 shadow-xs max-w-md">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Tracking ({userOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Firm Profile & Billing</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1">
          
          {activeTab === 'orders' ? (
            
            /* Order Tracking View */
            <div className="space-y-4">
              {userOrders.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-red-50 text-red-800 flex items-center justify-center mx-auto">
                    <Package className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">No Orders Placed Yet</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    When you order bulk lots, your order tracking, transport bilti number, and dispatch status will be visible here in real-time.
                  </p>
                </div>
              ) : (
                userOrders.map((ord) => {
                  const currentStep = ord.trackingStep || (ord.status === 'Delivered' ? 4 : ord.status === 'Dispatched' ? 3 : ord.status === 'Confirmed' ? 2 : 1);
                  
                  return (
                    <div 
                      key={ord.id}
                      className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 hover:border-red-800/40 transition-colors"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-neutral-900 text-sm">{ord.orderNumber}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              ord.status === 'Rejected'
                                ? 'bg-red-50 text-red-900 border-red-300'
                                : ord.status === 'Delivery Attempted'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : ord.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : ord.status === 'Dispatched'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : ord.status === 'Confirmed'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            Booked on {(() => {
                              try {
                                return new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              } catch {
                                return 'Recent';
                              }
                            })()} • {ord.totalQuantity ?? 0} Pieces
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-red-800 font-heading">
                            ₹{formatPrice(ord?.totalAmount)}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">Invoice Value (₹ INR)</span>
                        </div>
                      </div>

                      {/* Rejected Consignment Card */}
                      {ord.status === 'Rejected' && (
                        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 sm:p-5 space-y-2">
                          <div className="flex items-center gap-2 text-red-900 font-black text-sm">
                            <AlertTriangle className="w-5 h-5 text-red-800 flex-shrink-0" />
                            <span>Consignment Rejected / Cancelled</span>
                          </div>
                          <p className="text-xs text-red-800 leading-relaxed font-medium">
                            {ord.statusNote || 'Your order was reviewed and rejected by the dispatch desk. Please contact support or place a revised order.'}
                          </p>
                          {ord.trackingBiltiNumber && (
                            <div className="text-[11px] font-mono text-red-700 pt-1">
                              Reference Tracing ID: <strong>{ord.trackingBiltiNumber}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delivery Attempted Card */}
                      {ord.status === 'Delivery Attempted' && (
                        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 space-y-2">
                          <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                            <Clock className="w-5 h-5 text-amber-700 flex-shrink-0" />
                            <span>Delivery Attempted at Destination Godown</span>
                          </div>
                          <p className="text-xs text-amber-900 leading-relaxed font-medium">
                            {ord.statusNote || 'Transporter attempted delivery at your godown address. Re-attempt will be scheduled.'}
                          </p>
                          {ord.trackingBiltiNumber && (
                            <div className="text-[11px] font-mono text-amber-800 pt-1">
                              Tracing / Bilti LR No: <strong>{ord.trackingBiltiNumber}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom Note for active orders */}
                      {ord.statusNote && ord.status !== 'Rejected' && ord.status !== 'Delivery Attempted' && (
                        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-800 flex items-start gap-2">
                          <FileText className="w-4 h-4 text-red-800 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-neutral-900">Dispatch Desk Note:</span>
                            <span>{ord.statusNote}</span>
                          </div>
                        </div>
                      )}

                      {/* 4-Step Visual Order Tracking Bar (for non-rejected orders) */}
                      {ord.status !== 'Rejected' && (
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                          <div className="text-xs font-bold text-neutral-800 mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-red-800">
                              <Truck className="w-4 h-4" />
                              Live All-India Dispatch Tracking
                            </span>
                            {ord.trackingBiltiNumber && (
                              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-neutral-300 font-semibold text-neutral-800">
                                Bilti / LR No: {ord.trackingBiltiNumber}
                              </span>
                            )}
                          </div>

                          {/* Progress Stepper */}
                          <div className="grid grid-cols-4 gap-2 text-center relative">
                            
                            {/* Step 1 */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                                currentStep >= 1 ? 'bg-red-800 text-white' : 'bg-neutral-200 text-neutral-500'
                              }`}>
                                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                              </div>
                              <span className={`text-[10px] font-bold leading-tight ${currentStep >= 1 ? 'text-red-800' : 'text-neutral-400'}`}>
                                Order Confirmed
                              </span>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                                currentStep >= 2 ? 'bg-red-800 text-white' : 'bg-neutral-200 text-neutral-500'
                              }`}>
                                {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                              </div>
                              <span className={`text-[10px] font-bold leading-tight ${currentStep >= 2 ? 'text-red-800' : 'text-neutral-400'}`}>
                                Packed & Bilti Done
                              </span>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                                currentStep >= 3 ? 'bg-red-800 text-white' : 'bg-neutral-200 text-neutral-500'
                              }`}>
                                {currentStep > 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                              </div>
                              <span className={`text-[10px] font-bold leading-tight ${currentStep >= 3 ? 'text-red-800' : 'text-neutral-400'}`}>
                                Road Cargo In Transit
                              </span>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                                currentStep >= 4 ? 'bg-emerald-700 text-white' : 'bg-neutral-200 text-neutral-500'
                              }`}>
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <span className={`text-[10px] font-bold leading-tight ${currentStep >= 4 ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                Delivered to Godown
                              </span>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* Transport details */}
                      <div className="text-xs text-neutral-600 bg-white p-3 rounded-xl border border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-neutral-800">Carrier: </span>
                          <span>{ord.transportPreference || 'VRL Logistics / TCI Cargo'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-800">Destination: </span>
                          <span>{ord.city}, {ord.state} ({ord.pincode})</span>
                        </div>
                      </div>

                      {/* Ordered Lot Items */}
                      <div className="divide-y divide-neutral-100 text-xs">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={it.image} alt="" className="w-8 h-10 object-cover rounded bg-neutral-100" />
                              <div>
                                <span className="font-bold text-neutral-800">{it.productName}</span>
                                <div className="text-[10px] text-neutral-500">Size: {it.size} • Color: {it.color}</div>
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-neutral-600">{it.quantity} pcs @ ₹{it.unitPrice} = </span>
                              <strong className="text-neutral-900 font-bold">₹{formatPrice(it?.total)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          ) : (

            /* Business Profile View */
            <div className="space-y-4 max-w-lg mx-auto text-xs">
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="text-neutral-500">Buyer Full Name:</span>
                  <span className="font-bold text-neutral-900">{currentUser.name || 'Trader Partner'}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="text-neutral-500">Mobile Number:</span>
                  <span className="font-bold text-neutral-900 font-mono">{currentUser.phone}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="text-neutral-500">Business Email:</span>
                  <span className="font-bold text-neutral-900">{currentUser.email}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="text-neutral-500">Company / Shop:</span>
                  <span className="font-bold text-neutral-900">{currentUser.companyName || 'Retail Boutique'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">B2B Trade Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Verified Buyer
                  </span>
                </div>
              </div>
            </div>

          )}

        </div>

      </div>
    </div>
  );
};
