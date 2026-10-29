import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Truck, 
  ArrowRight,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { WholesaleOrder, PaymentSettings } from '../types.ts';
import { submitOrderPaymentUtr } from '../services/dataService.ts';
import { formatPrice } from '../utils/format.ts';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WholesaleOrder | null;
  paymentSettings: PaymentSettings;
  onPaymentSuccess?: (order: WholesaleOrder) => void;
  onOpenProfile?: () => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  order,
  paymentSettings,
  onPaymentSuccess,
  onOpenProfile
}) => {
  // 30-minute countdown timer (1800 seconds)
  const [timeLeft, setTimeLeft] = useState(1800);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerificationSubmitted, setIsVerificationSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate payable amount (Advance if COD, full total if Prepaid)
  const payableAmount = order 
    ? (order.paymentMethod === 'Cash on Delivery' && order.codAdvanceAmount 
        ? order.codAdvanceAmount 
        : order.totalAmount)
    : 0;

  useEffect(() => {
    if (order) {
      setPaidAmountInput(payableAmount);
      setUtrNumber(order.paymentUtr || '');
      setIsVerificationSubmitted(order.paymentStatus === 'Payment Verification' && !!order.paymentUtr);
    }
  }, [order, payableAmount]);

  // Timer interval
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(1800);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCopyUpi = () => {
    if (!paymentSettings.upiId) return;
    navigator.clipboard.writeText(paymentSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Generate dynamic QR code if custom URL is not provided or to ensure exact amount
  const qrDisplayUrl = paymentSettings.qrCodeUrl || 
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.upiName)}&am=${payableAmount}&cu=INR`
    )}`;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setErrorMsg('Please enter your 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }
    if (cleanUtr.length < 6) {
      setErrorMsg('UTR / Transaction reference seems too short. Please verify your receipt.');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);

    // Show 2-second checking popup / animation as requested
    setTimeout(async () => {
      try {
        await submitOrderPaymentUtr(order.id, cleanUtr, Number(paidAmountInput) || payableAmount, order.userId);
        setIsVerifying(false);
        setIsVerificationSubmitted(true);
        if (onPaymentSuccess) {
          onPaymentSuccess({
            ...order,
            paymentUtr: cleanUtr,
            paidAmount: Number(paidAmountInput) || payableAmount,
            paymentStatus: 'Payment Verification',
            status: 'Payment Verification'
          });
        }
      } catch (err) {
        console.error(err);
        setIsVerifying(false);
        setErrorMsg('Failed to sync payment with server. Please retry.');
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden relative flex flex-col my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black font-heading tracking-wide">
                B2B UPI Consignment Gateway
              </h3>
              <p className="text-[11px] text-red-200 font-mono">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 30-min Timer Badge */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border shadow-inner ${
              timeLeft < 300 
                ? 'bg-red-700 text-yellow-300 border-red-500 animate-pulse' 
                : 'bg-black/30 text-white border-white/20'
            }`}>
              <Clock className="w-3.5 h-3.5 text-yellow-300" />
              <span>{formattedTime}</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[82vh]">

          {/* CHECKING POPUP OVERLAY (2-second validation) */}
          {isVerifying && (
            <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-800/30">
                  <Loader2 className="w-8 h-8 text-red-800 animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black font-heading text-neutral-900">
                  Checking Payment Reference...
                </h4>
                <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                  Verifying UTR reference with our accounts desk & banking ledger. Please hold on...
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS / VERIFICATION WAIT STATE (Big Green Tick) */}
          {isVerificationSubmitted ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border-2 border-emerald-400 animate-bounce duration-700">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Status: Payment Verification Wait
                </span>
                <h4 className="text-xl sm:text-2xl font-black font-heading text-neutral-900">
                  Payment Verification in Progress!
                </h4>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                  Aapka UTR <strong className="font-mono text-neutral-900">"{utrNumber || order.paymentUtr}"</strong> submit ho gaya hai. Accounts desk bank credit verify karegi aur order Turant <strong>Confirmed</strong> ho jayega.
                </p>
              </div>

              {/* Order Summary Box */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs text-left space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Tracking Ticket ID:
                  </span>
                  <span className="font-mono font-black text-xs text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                    {order.trackingTicketId || `TRK-${(order.orderNumber || '').replace(/[^0-9]/g, '')}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-neutral-600 bg-white p-2 rounded-xl border border-neutral-200">
                  <span className="font-semibold text-neutral-700">Buyer User ID:</span>
                  <span className="font-mono font-bold text-xs text-red-900 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {order.userId || 'usr_registered'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Order Number:</span>
                  <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Consignment Total:</span>
                  <span className="font-bold text-neutral-900">₹{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-neutral-900">{order.paymentMethod}</span>
                </div>
                {order.paymentMethod === 'Cash on Delivery' && order.codRemainingAmount && (
                  <div className="flex justify-between text-amber-900 font-semibold pt-1 border-t border-neutral-200">
                    <span>Payable on Godown Delivery:</span>
                    <span>₹{formatPrice(order.codRemainingAmount)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="flex-1 py-3 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Track Order in Profile</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (

            /* STANDARD PAYMENT FORM & QR DISPLAY */
            <>
              {/* Payment Mode Notice Banner */}
              {order.paymentMethod === 'Cash on Delivery' ? (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <Truck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>Cash on Delivery (Advance Token Required)</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Consignment booking confirm karne ke liye sirf advance <strong className="font-mono font-bold text-amber-950">₹{formatPrice(payableAmount)}</strong> pay karein. Baki amount <strong className="font-mono font-bold text-neutral-900">₹{formatPrice(order.codRemainingAmount || 0)}</strong> godown delivery par dena hoga.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>100% Secure Prepaid UPI Booking</span>
                  </div>
                  <span className="font-black text-sm text-emerald-800 font-mono">
                    ₹{formatPrice(payableAmount)}
                  </span>
                </div>
              )}

              {/* QR Code Card */}
              <div className="bg-gradient-to-b from-neutral-50 to-white p-5 rounded-3xl border border-neutral-200 text-center shadow-xs space-y-3">
                <div className="inline-block p-3 bg-white rounded-2xl border-2 border-neutral-800/10 shadow-md">
                  <img 
                    src={qrDisplayUrl}
                    alt="UPI Payment QR Code"
                    className="w-52 h-52 sm:w-56 sm:h-56 object-contain mx-auto rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-neutral-500 font-semibold">
                    Scan with any Indian UPI App:
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-neutral-600 flex-wrap">
                    <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">PhonePe</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">Google Pay</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">Paytm</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">BHIM UPI</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">Cred</span>
                  </div>
                </div>

                {/* UPI ID + Copy Button */}
                <div className="bg-white p-2.5 rounded-2xl border border-neutral-200 flex items-center justify-between gap-2 max-w-sm mx-auto shadow-xs">
                  <div className="text-left min-w-0 pl-1">
                    <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">UPI ID / VPA:</span>
                    <span className="font-mono text-xs font-black text-neutral-900 truncate block">
                      {paymentSettings.upiId || 'stardot.b2b@okhdfcbank'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      copiedUpi 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs active:scale-95'
                    }`}
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                  </button>
                </div>

                {paymentSettings.upiName && (
                  <div className="text-[11px] text-neutral-500">
                    Payee Name: <strong className="text-neutral-800">{paymentSettings.upiName}</strong>
                  </div>
                )}
              </div>

              {/* UTR & Paid Amount Submission Form */}
              <form onSubmit={handleSubmitPayment} className="space-y-3.5 text-xs">
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 block text-[11px]">
                      Total Paid Amount (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-neutral-900 bg-neutral-50 focus:bg-white focus:outline-none focus:border-red-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 block text-[11px]">
                      Payment UTR / Transaction ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 439019284102 or Ref No."
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-neutral-900 uppercase focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 leading-tight">
                  💡 QR code scan karke pay karein aur receipt se <strong>12-digit UPI Ref / UTR No.</strong> yahan daalkar submit karein.
                </p>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3.5 bg-red-800 hover:bg-red-900 text-white rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    <span>Submit & Verify Payment (₹{formatPrice(paidAmountInput || payableAmount)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
