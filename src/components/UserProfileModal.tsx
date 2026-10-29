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
  AlertTriangle,
  QrCode,
  RefreshCw,
  Send,
  Banknote,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Printer,
  Eye,
  Tag,
  AlertCircle
} from 'lucide-react';
import { WholesaleUser, WholesaleOrder } from '../types.ts';
import { subscribeToOrders, submitOrderPaymentUtr, isUserAdmin } from '../services/dataService.ts';
import { formatPrice } from '../utils/format.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: WholesaleUser;
  onSignOut: () => void;
  onOpenAdmin?: () => void;
  onOpenPaymentGateway?: (order: WholesaleOrder) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  onOpenAdmin,
  onOpenPaymentGateway
}) => {
  const [userOrders, setUserOrders] = useState<WholesaleOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<WholesaleOrder | null>(null);

  const [resubmitUtrInput, setResubmitUtrInput] = useState<Record<string, string>>({});
  const [isResubmittingUtr, setIsResubmittingUtr] = useState<string | null>(null);
  const [resubmitSuccessMsg, setResubmitSuccessMsg] = useState<Record<string, string>>({});
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Subscribe to real-time orders from Firebase & LocalStorage
  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToOrders((allOrders) => {
        // Filter orders for this specific logged-in user or matching mobile
        const userPhone10 = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
        const filtered = allOrders.filter(ord => {
          if (!ord) return false;
          if (ord.userId && ord.userId === currentUser.uid) return true;
          if (userPhone10 && ord.phone) {
            const ordPhone10 = ord.phone.replace(/\D/g, '').slice(-10);
            if (ordPhone10 && ordPhone10 === userPhone10) return true;
          }
          return false;
        }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Latest orders on top
        setUserOrders(filtered);

        // Keep selectedTicketOrder in sync if open without re-triggering dependency loops
        setSelectedTicketOrder(prev => {
          if (!prev) return null;
          const fresh = filtered.find(o => o.id === prev.id);
          if (!fresh) return prev;
          if (
            fresh.status !== prev.status ||
            fresh.updatedAt !== prev.updatedAt ||
            fresh.statusNote !== prev.statusNote ||
            fresh.paymentStatus !== prev.paymentStatus ||
            fresh.paymentUtr !== prev.paymentUtr
          ) {
            return fresh;
          }
          return prev;
        });
      });
      return () => unsub();
    }
  }, [isOpen, currentUser.uid, currentUser.phone]);

  if (!isOpen) return null;

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedTicketId(ticketId);
    setTimeout(() => setCopiedTicketId(null), 2500);
  };

  const handleResubmitUtr = async (order: WholesaleOrder) => {
    const utr = (resubmitUtrInput[order.id] || '').trim();
    if (!utr) return;

    setIsResubmittingUtr(order.id);
    try {
      await submitOrderPaymentUtr(
        order.id, 
        utr, 
        order.paidAmount || (order.paymentMethod === 'Cash on Delivery' ? (order.codAdvanceAmount || 500) : order.totalAmount),
        order.userId
      );
      setResubmitSuccessMsg(prev => ({
        ...prev,
        [order.id]: 'New UTR reference submitted! Accounts desk is verifying.'
      }));
      setResubmitUtrInput(prev => ({ ...prev, [order.id]: '' }));
      setTimeout(() => {
        setResubmitSuccessMsg(prev => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
      }, 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResubmittingUtr(null);
    }
  };

  const getStatusBadge = (status: WholesaleOrder['status']) => {
    switch (status) {
      case 'Delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Delivered to Godown'
        };
      case 'Out for Delivery':
        return {
          bg: 'bg-sky-50 text-sky-900 border-sky-300',
          icon: <Truck className="w-3.5 h-3.5 text-sky-600" />,
          label: 'Out for Delivery'
        };
      case 'Dispatched':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: <Truck className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Road Cargo In Transit'
        };
      case 'Confirmed':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <Package className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Confirmed & Packing'
        };
      case 'Payment Verification':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Payment Verification'
        };
      case 'Delivery Attempted':
        return {
          bg: 'bg-amber-100 text-amber-950 border-amber-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />,
          label: 'Delivery Attempted'
        };
      case 'Rejected':
        return {
          bg: 'bg-red-50 text-red-900 border-red-300',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-700" />,
          label: 'Consignment Rejected'
        };
      default:
        return {
          bg: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          icon: <Clock className="w-3.5 h-3.5 text-neutral-500" />,
          label: status || 'Pending Review'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-neutral-50 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black font-heading tracking-tight text-neutral-900">
                Buyer Dashboard & Consignments
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">
                Real-time transport tracking tickets, bilti receipts, and verified trade orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUserAdmin(currentUser) && onOpenAdmin && (
              <button 
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-3.5 py-1.5 bg-red-800 text-white rounded-full text-xs font-bold hover:bg-red-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Open Admin Desk"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Desk</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* User Card */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center font-bold text-lg border border-white/20">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'B'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black font-heading tracking-wide">
                    {currentUser.name || 'Registered Trade Partner'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-white text-red-900 text-[10px] font-black uppercase flex items-center gap-1 shadow-xs">
                    {isUserAdmin(currentUser) ? '👑 Master Admin' : 'B2B Trade Buyer'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/30 text-white font-mono text-[10px] font-bold border border-white/20">
                    ID: {currentUser.uid}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-red-100 mt-0.5">
                  <span className="font-mono">{currentUser.phone}</span>
                  {currentUser.companyName && (
                    <span>• {currentUser.companyName}</span>
                  )}
                  {currentUser.city && (
                    <span>• {currentUser.city}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={onSignOut}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch / Sign Out</span>
              </button>
            </div>
          </div>

          {/* Admin Fast Launcher Banner if user is Admin */}
          {isUserAdmin(currentUser) && (
            <div className="mt-4 p-3 bg-black/40 border border-white/20 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-bold text-white">Administrator Access Verified</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAdmin) onOpenAdmin();
                }}
                className="px-3 py-1 bg-white hover:bg-red-50 text-red-900 text-xs font-black rounded-lg transition-all shadow-sm flex items-center gap-1.5 active:scale-95 flex-shrink-0"
              >
                <Lock className="w-3 h-3 text-red-900" />
                <span>Launch Admin Suite</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Tracking Tickets ({userOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Business Account</span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-500 hidden sm:block">
            {userOrders.length > 0 ? 'Click "Expand" or "Full Ticket" to inspect consignment' : ''}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'orders' ? (
            /* Orders & Tracking Ticket List */
            <div className="space-y-3">
              {userOrders.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-3 my-6">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Package className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">No Orders or Tracking Tickets Yet</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Jab aap bulk lot checkout karenge, tab aapka unique tracking ticket, bilti LR number, aur live godown dispatch status yahan auto-generate ho kar display hoga.
                  </p>
                </div>
              ) : (
                userOrders.map((ord, oIdx) => {
                  const ticketId = ord.trackingTicketId || `TRK-${(ord.orderNumber || '').replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
                  const isExpanded = expandedOrderIds.includes(ord.id);
                  const statusInfo = getStatusBadge(ord.status);
                  const currentStep = ord.trackingStep || (ord.status === 'Delivered' ? 5 : ord.status === 'Out for Delivery' ? 4 : ord.status === 'Dispatched' ? 3 : ord.status === 'Confirmed' ? 2 : 1);

                  return (
                    <div 
                      key={ord.id || `user-ord-${oIdx}`}
                      className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3 hover:border-neutral-300 transition-all"
                    >
                      {/* MINIMAL TOP ROW: Ticket ID + Order Number + Status Badge + Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Prominent Tracking Ticket Badge */}
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg text-xs font-mono font-black">
                            <Tag className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Ticket #{ticketId}</span>
                          </div>

                          <span className="font-mono font-bold text-neutral-600 text-xs bg-neutral-100 px-2 py-0.5 rounded">
                            {ord.orderNumber}
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${statusInfo.bg}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {(() => {
                              try {
                                return new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                });
                              } catch {
                                return 'Recent';
                              }
                            })()}
                          </span>

                          <div className="text-right">
                            <span className="font-black text-sm sm:text-base text-neutral-900 font-heading">
                              ₹{formatPrice(ord.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* MINIMAL MIDDLE ROW: Item Summary + Payment Method + Carrier */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-bold text-[11px]">
                            📦 {ord.totalQuantity ?? 0} Pieces ({ord.items?.length || 0} styles)
                          </span>

                          <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-1">
                            {ord.paymentMethod === 'Cash on Delivery' ? (
                              <>
                                <Banknote className="w-3 h-3 text-amber-700" />
                                <span>COD (₹{formatPrice(ord.codAdvanceAmount || 0)} Advance)</span>
                              </>
                            ) : (
                              <>
                                <QrCode className="w-3 h-3 text-red-800" />
                                <span>Prepaid UPI</span>
                              </>
                            )}
                          </span>

                          {ord.trackingBiltiNumber && (
                            <span className="bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded font-mono font-bold text-[11px] flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>{ord.trackingCarrier || 'VRL'}: {ord.trackingBiltiNumber}</span>
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: Expand Inline + Open Full Tracking Ticket Popup */}
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedTicketOrder(ord)}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                            title="Open Full Consignment Ticket & Tracking Popup"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Full Ticket</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleOrderExpand(ord.id)}
                            className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>Collapse</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                <span>Quick View</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ACTION REQUIRED ALERTS (Shown even in minimal view) */}
                      {(ord.utrResubmitAllowed || ord.paymentStatus === 'UTR Resubmit Requested') && (
                        <div className="bg-purple-50 border border-purple-300 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 text-purple-950 font-bold">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-purple-700 flex-shrink-0 animate-spin duration-1000" />
                            <span>Action Required: Admin requested new UTR number</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isExpanded) toggleOrderExpand(ord.id);
                            }}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[11px] font-bold"
                          >
                            Submit UTR
                          </button>
                        </div>
                      )}

                      {ord.status === 'Delivery Attempted' && (
                        <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-xs text-amber-950 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-medium">
                            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                            <span>
                              <strong>Delivery Attempted:</strong> {ord.statusNote || 'Destination godown was closed. Courier will re-attempt delivery.'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* INLINE EXPANDED CONTENT (When user clicks Quick View / Expand) */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-neutral-100 space-y-4 animate-in fade-in duration-150 text-xs">
                          
                          {/* 5-Step Visual Tracking Stepper */}
                          {ord.status !== 'Rejected' && (
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                              <div className="text-xs font-bold text-neutral-800 mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-red-800">
                                  <Truck className="w-4 h-4" />
                                  Live Consignment Progress Tracker
                                </span>
                                {ord.trackingBiltiNumber && (
                                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-neutral-300 font-semibold text-neutral-800">
                                    Bilti / LR No: {ord.trackingBiltiNumber}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-5 gap-1.5 text-center relative">
                                {/* Step 1: Order Placed */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                                    currentStep >= 1 ? 'bg-red-800 text-white' : 'bg-neutral-200 text-neutral-500'
                                  }`}>
                                    {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                                  </div>
                                  <span className={`text-[10px] font-bold leading-tight ${currentStep >= 1 ? 'text-red-800' : 'text-neutral-400'}`}>
                                    Placed
                                  </span>
                                </div>

                                {/* Step 2: Payment Verified */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                                    currentStep >= 2 ? 'bg-red-800 text-white' : 'bg-neutral-200 text-neutral-500'
                                  }`}>
                                    {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                                  </div>
                                  <span className={`text-[10px] font-bold leading-tight ${currentStep >= 2 ? 'text-red-800' : 'text-neutral-400'}`}>
                                    Verified
                                  </span>
                                </div>

                                {/* Step 3: Packing & Dispatched */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                                    currentStep >= 3 ? 'bg-red-800 text-white' : 'bg-neutral-200 text-neutral-500'
                                  }`}>
                                    {currentStep > 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                                  </div>
                                  <span className={`text-[10px] font-bold leading-tight ${currentStep >= 3 ? 'text-red-800' : 'text-neutral-400'}`}>
                                    Dispatched
                                  </span>
                                </div>

                                {/* Step 4: Out for Delivery */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                                    currentStep >= 4 ? 'bg-red-800 text-white' : 'bg-neutral-200 text-neutral-500'
                                  }`}>
                                    {currentStep > 4 ? <CheckCircle2 className="w-4 h-4" /> : '4'}
                                  </div>
                                  <span className={`text-[10px] font-bold leading-tight ${currentStep >= 4 ? 'text-red-800' : 'text-neutral-400'}`}>
                                    Out for Delivery
                                  </span>
                                </div>

                                {/* Step 5: Delivered */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                                    currentStep >= 5 ? 'bg-emerald-700 text-white' : 'bg-neutral-200 text-neutral-500'
                                  }`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <span className={`text-[10px] font-bold leading-tight ${currentStep >= 5 ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                    Delivered
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Admin Dispatch Desk Note */}
                          {ord.statusNote && (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-700 flex items-start gap-2">
                              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-800" />
                              <div>
                                <span className="font-bold block text-neutral-900">Dispatch Desk Note:</span>
                                <span>{ord.statusNote}</span>
                              </div>
                            </div>
                          )}

                          {/* Delivery Attempts Log if any */}
                          {ord.deliveryAttempts && ord.deliveryAttempts.length > 0 && (
                            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                                Delivery Attempts Log:
                              </span>
                              <div className="space-y-1.5">
                                {ord.deliveryAttempts.map((att, attIdx) => (
                                  <div key={attIdx} className="bg-white p-2 rounded-lg border border-amber-200 text-[11px] text-neutral-800">
                                    <span className="font-bold text-amber-900">Attempt {att.attemptNumber}:</span> {att.reason}
                                    <span className="text-neutral-400 font-mono ml-2">
                                      ({new Date(att.date).toLocaleDateString('en-IN')})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* UTR Resubmit Form if allowed */}
                          {(ord.utrResubmitAllowed || ord.paymentStatus === 'UTR Resubmit Requested') && (
                            <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-4 space-y-3">
                              <span className="font-bold text-purple-950 block">Enter Correct 12-Digit UTR:</span>
                              {resubmitSuccessMsg[ord.id] ? (
                                <div className="bg-emerald-100 text-emerald-900 p-2.5 rounded-xl font-bold flex items-center gap-2">
                                  <Check className="w-4 h-4" />
                                  <span>{resubmitSuccessMsg[ord.id]}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={resubmitUtrInput[ord.id] || ''}
                                    onChange={(e) => setResubmitUtrInput({ ...resubmitUtrInput, [ord.id]: e.target.value })}
                                    placeholder="e.g. 428192849182"
                                    className="flex-1 px-3 py-2 rounded-xl border border-purple-300 font-mono font-bold focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleResubmitUtr(ord)}
                                    disabled={isResubmittingUtr === ord.id}
                                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold"
                                  >
                                    {isResubmittingUtr === ord.id ? 'Submitting...' : 'Submit'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Items list */}
                          <div className="divide-y divide-neutral-100 bg-neutral-50/50 p-2 rounded-xl">
                            {(ord.items || []).map((it, idx) => (
                              <div key={it.productId ? `${it.productId}-${idx}` : `it-${idx}`} className="py-1.5 flex items-center justify-between">
                                <span className="font-medium text-neutral-800 truncate max-w-xs">{it.productName} ({it.size}, {it.color})</span>
                                <span className="font-mono text-neutral-600">{it.quantity} pcs • ₹{formatPrice(it.total)}</span>
                              </div>
                            ))}
                          </div>

                        </div>
                      )}

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
                  <span className="text-neutral-500">Buyer Account ID:</span>
                  <span className="font-bold text-red-900 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-200">{currentUser.uid}</span>
                </div>
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

      {/* ------------------------------------------------------------------- */}
      {/* FULL TRACKING TICKET & BILTI MODAL POPUP */}
      {/* ------------------------------------------------------------------- */}
      {selectedTicketOrder && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setSelectedTicketOrder(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ticket Header with Barcode / Official Look */}
            <div className="border-b-2 border-dashed border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-800 text-white px-2 py-0.5 rounded">
                    Official Consignment Ticket
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    Stardot Wholesale India
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black font-heading text-neutral-900 mt-1 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-red-800" />
                  <span>Ticket #{selectedTicketOrder.trackingTicketId || `TRK-${(selectedTicketOrder.orderNumber || '').replace(/[^0-9]/g, '')}`}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyTicket(selectedTicketOrder.trackingTicketId || selectedTicketOrder.orderNumber)}
                  className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 flex items-center gap-1 transition-colors"
                >
                  {copiedTicketId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Ticket</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicketOrder(null)}
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Consignment Status Banner */}
            {(() => {
              const statusInfo = getStatusBadge(selectedTicketOrder.status);
              return (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${statusInfo.bg}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {statusInfo.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold block uppercase tracking-wider">Current Status</span>
                      <h4 className="text-sm sm:text-base font-black">{statusInfo.label}</h4>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] block font-mono">Total Invoice</span>
                    <strong className="text-base sm:text-lg font-black font-heading">
                      ₹{formatPrice(selectedTicketOrder.totalAmount)}
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Carrier & Bilti Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              <div className="space-y-1">
                <span className="text-neutral-500 font-bold block">Logistics Partner / Carrier:</span>
                <span className="font-bold text-neutral-900 text-sm">
                  {selectedTicketOrder.trackingCarrier || selectedTicketOrder.transportPreference || 'VRL Logistics Road Cargo'}
                </span>
                <div className="text-[11px] text-neutral-500">Dispatch Godown: Surat / Tirupur Mill</div>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-500 font-bold block">Transport Bilti / LR No:</span>
                <span className="font-mono font-black text-sm text-red-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-300 inline-block">
                  {selectedTicketOrder.trackingBiltiNumber || 'Pending Mill Dispatch'}
                </span>
                <div className="text-[11px] text-neutral-500">Use for godown delivery release</div>
              </div>
            </div>

            {/* Destination Address */}
            <div className="p-3.5 bg-white rounded-xl border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-800" />
                Consignment Delivery Destination:
              </span>
              <p className="text-neutral-700 leading-relaxed pl-5">
                {selectedTicketOrder.shippingAddress}, {selectedTicketOrder.city}, {selectedTicketOrder.state} - {selectedTicketOrder.pincode}
              </p>
              <div className="pl-5 text-neutral-500 font-mono text-[11px]">
                Consignee: {selectedTicketOrder.customerName} ({selectedTicketOrder.phone})
              </div>
            </div>

            {/* Admin Message Note */}
            {selectedTicketOrder.statusNote && (
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-800" />
                  Dispatch & Accounts Desk Remarks:
                </span>
                <p className="text-neutral-700 pl-5 leading-relaxed">{selectedTicketOrder.statusNote}</p>
              </div>
            )}

            {/* Delivery Attempts Log if present */}
            {selectedTicketOrder.deliveryAttempts && selectedTicketOrder.deliveryAttempts.length > 0 && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  Courier Delivery Attempts History:
                </span>
                <div className="space-y-2">
                  {selectedTicketOrder.deliveryAttempts.map((att, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-amber-900">Attempt {att.attemptNumber}:</strong> {att.reason}
                        {att.note && <div className="text-[11px] text-neutral-500 mt-0.5">{att.note}</div>}
                      </div>
                      <span className="font-mono text-neutral-500 text-[11px] shrink-0">
                        {new Date(att.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                <span className="font-bold text-neutral-800">Payment Mode:</span>
                <span className="font-black text-neutral-900">{selectedTicketOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Verification Status:</span>
                <span className="font-bold text-neutral-900">{selectedTicketOrder.paymentStatus}</span>
              </div>
              {selectedTicketOrder.paymentUtr && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Submitted UTR No:</span>
                  <span className="font-mono font-bold text-neutral-900">{selectedTicketOrder.paymentUtr}</span>
                </div>
              )}
              {selectedTicketOrder.paymentMethod === 'Cash on Delivery' && (
                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center font-bold text-amber-900">
                  <span>Balance Payable at Delivery:</span>
                  <span className="font-mono text-sm">₹{formatPrice(selectedTicketOrder.codRemainingAmount || 0)}</span>
                </div>
              )}
            </div>

            {/* Itemized Manifest */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-neutral-800 block">Manifest Items ({selectedTicketOrder.totalQuantity} Units):</span>
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                {(selectedTicketOrder.items || []).map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2.5">
                      {it.image && <img src={it.image} alt="" className="w-8 h-10 object-cover rounded bg-neutral-100" />}
                      <div>
                        <div className="font-bold text-neutral-900">{it.productName}</div>
                        <div className="text-[10px] text-neutral-500">Size: {it.size} • Color: {it.color}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span>{it.quantity} pcs × ₹{it.unitPrice} = </span>
                      <strong>₹{formatPrice(it.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Consignment Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicketOrder(null)}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold"
              >
                Close Ticket
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
