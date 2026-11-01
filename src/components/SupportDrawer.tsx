import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft, 
  Send, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Headphones,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { SupportTicket, TicketMessage, WholesaleUser, WholesaleOrder } from '../types.ts';
import { 
  subscribeToUserTickets, 
  createSupportTicket, 
  addTicketMessage, 
  markTicketRead,
  submitTicketFeedback 
} from '../services/dataService.ts';
import { formatDate } from '../utils/format.ts';

interface SupportFaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const WHOLESALE_FAQS: SupportFaqItem[] = [
  {
    id: 'faq-moq',
    category: 'Ordering & MOQ',
    question: 'What is MOQ (Minimum Order Quantity) and can I order fewer pieces?',
    answer: 'Each product has an individual Minimum Order Quantity (e.g. 10 pcs, 25 pcs, 50 pcs) set directly by our Tirupur/Surat manufacturing mills. Orders below the set MOQ cannot be placed to preserve wholesale tiered pricing.'
  },
  {
    id: 'faq-payment',
    category: 'Payments & UTR',
    question: 'How does UPI QR payment and UTR Reference verification work?',
    answer: 'Scan our official B2B UPI QR code or copy the UPI VPA and transfer the exact consignment amount from Google Pay, PhonePe, Paytm, or NetBanking. Enter your 12-digit UTR/Reference number in the payment modal. Our accounts desk verifies payment within 10-30 minutes.'
  },
  {
    id: 'faq-transport',
    category: 'Transport & Bilti',
    question: 'How is road cargo transport and Bilti (LR) dispatched?',
    answer: 'Once payment is verified, your wholesale lot is packed into transport-grade bales or cartons and booked via national cargo carriers (VRL Logistics, TCI Express, SafeXpress, or your local godown transport). Your Bilti (LR number) and transport receipt will appear directly in your profile dashboard.'
  },
  {
    id: 'faq-gst',
    category: 'GST & Invoicing',
    question: 'Do I get a 100% Tax Compliant B2B GST Invoice and E-Way Bill?',
    answer: 'Yes, every wholesale shipment includes a valid Tax Invoice and E-Way Bill matching your trade GSTIN. Your Input Tax Credit (ITC) will automatically reflect in your GSTR-2B filing at month-end.'
  },
  {
    id: 'faq-cod',
    category: 'Cash on Delivery',
    question: 'How does Cash on Delivery (COD) work for wholesale consignments?',
    answer: 'To protect factory operations from unaccepted dispatches, COD requires a nominal advance freight token paid via UPI QR. The remaining lot balance is payable upon delivery at your destination transport godown.'
  },
  {
    id: 'faq-defects',
    category: 'Quality & Claims',
    question: 'What happens if a lot arrives damaged or defective from transport?',
    answer: 'All lots pass strict mill-grade quality inspection. In case of transit damage, create a Support Ticket within 48 hours of godown delivery with parcel photos. Our accounts & dispatch desk will issue an immediate replacement lot or credit note.'
  }
];

interface SupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: WholesaleUser | null;
  userOrders?: WholesaleOrder[];
  onOpenAuth?: () => void;
}

export const SupportDrawer: React.FC<SupportDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  userOrders = [],
  onOpenAuth
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'chat'>('list');
  const [supportSection, setSupportSection] = useState<'tickets' | 'faq'>('tickets');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-moq');

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Order Status');
  const [orderRef, setOrderRef] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [formError, setFormError] = useState('');

  // Active Chat Message Input State
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Closed Ticket Rating & Feedback State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get active buyer identifier (user ID or local guest device ID)
  const buyerId = currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('stardot_device_user_id') || 'guest_buyer' : 'guest_buyer');
  const buyerName = currentUser?.name || currentUser?.companyName || 'Wholesale Buyer';

  // Real-time subscription to user's tickets
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToUserTickets(buyerId, (liveTickets) => {
      setTickets(liveTickets);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [isOpen, buyerId]);

  // Selected Ticket reference
  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Mark ticket as read by user when opened
  useEffect(() => {
    if (selectedTicket && selectedTicket.unreadByUser) {
      markTicketRead(selectedTicket.id, 'user');
    }
    if (selectedTicket) {
      if (selectedTicket.rating) {
        setSelectedRating(selectedTicket.rating);
        setFeedbackSubmitted(true);
      } else {
        setSelectedRating(5);
        setFeedbackSubmitted(false);
      }
      if (selectedTicket.feedback) {
        setFeedbackComment(selectedTicket.feedback);
      } else {
        setFeedbackComment('');
      }
    }
  }, [selectedTicketId, selectedTicket?.unreadByUser]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [viewMode, selectedTicket?.messages?.length]);

  if (!isOpen) return null;

  const handleOpenTicketChat = (ticket: SupportTicket) => {
    setSelectedTicketId(ticket.id);
    setViewMode('chat');
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFormError('Please enter a ticket subject');
      return;
    }
    if (!initialMessage.trim()) {
      setFormError('Please describe your question or issue');
      return;
    }

    setFormError('');
    setIsSubmittingTicket(true);
    try {
      const created = await createSupportTicket({
        userId: buyerId,
        userName: buyerName,
        userEmail: currentUser?.email,
        userPhone: currentUser?.phone,
        subject: subject.trim(),
        category,
        orderId: orderRef.trim() || undefined
      }, initialMessage.trim());

      setSubject('');
      setInitialMessage('');
      setOrderRef('');
      setSelectedTicketId(created.id);
      setViewMode('chat');
    } catch (err) {
      console.error(err);
      setFormError('Failed to create ticket. Please retry.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      await addTicketMessage(selectedTicket.id, 'user', buyerName, textToSend);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsSubmittingFeedback(true);
    try {
      await submitTicketFeedback(selectedTicket.id, selectedRating, feedbackComment);
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const unreadCount = tickets.filter(t => t.unreadByUser).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER BAR */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            {viewMode !== 'list' ? (
              <button
                onClick={() => setViewMode('list')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Back to Tickets"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-red-800 text-white flex items-center justify-center font-bold">
                <Headphones className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="font-heading font-black text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>Factory Support Desk</span>
                {unreadCount > 0 && viewMode === 'list' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-mono font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {viewMode === 'chat' && selectedTicket 
                  ? `Ticket #${selectedTicket.id}`
                  : 'Direct factory support & live ticket resolution'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            title="Close Support"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUB-HEADER TABS: TICKETS VS FAQ */}
        {viewMode === 'list' && (
          <div className="bg-white border-b border-neutral-200 px-4 sm:px-5 py-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSupportSection('tickets')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                supportSection === 'tickets'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Tickets ({tickets.length})</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSupportSection('faq')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                supportSection === 'faq'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Wholesale FAQ</span>
            </button>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-5 flex flex-col">
          
          {/* VIEW 1: MY TICKETS OR FAQ */}
          {viewMode === 'list' && (
            <div className="space-y-4 flex-1 flex flex-col">
              
              {/* SECTION A: TICKETS */}
              {supportSection === 'tickets' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  
                  {/* 1. TOP PROMINENT CREATE TICKET OPTION */}
                  <button
                    onClick={() => setViewMode('create')}
                    className="w-full py-3 px-4 bg-red-800 hover:bg-red-900 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Raise New Support Ticket</span>
                  </button>

                  {/* ACTIVE TICKETS (SABSE UPAR ACTIVE TICKET SHOW KAREN) */}
                  {(() => {
                    const activeTickets = tickets.filter(t => t.status !== 'closed');
                    const closedTickets = tickets.filter(t => t.status === 'closed');

                    if (tickets.length === 0) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-neutral-200">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-sm text-neutral-800">No Support Tickets Yet</h3>
                          <p className="text-xs text-neutral-500 max-w-xs mt-1">
                            Have a question regarding consignment dispatch, bilti tracking, payments, or product specs?
                          </p>
                          <button
                            onClick={() => setViewMode('create')}
                            className="mt-4 px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-colors"
                          >
                            Create First Ticket
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-5">
                        {/* 2. ACTIVE TICKETS GROUP */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-neutral-700 px-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active & In-Progress Tickets ({activeTickets.length})</span>
                            </span>
                            <span className="text-[11px] text-neutral-400 font-normal">Live chat active</span>
                          </div>

                          {activeTickets.length === 0 ? (
                            <div className="p-4 rounded-xl bg-white border border-neutral-200 text-center text-xs text-neutral-500">
                              No active tickets currently. All inquiries have been resolved.
                            </div>
                          ) : (
                            activeTickets.map((t) => {
                              const lastMsg = t.messages?.[t.messages.length - 1];
                              const isNew = t.status === 'new';

                              return (
                                <div
                                  key={t.id}
                                  onClick={() => handleOpenTicketChat(t)}
                                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer bg-white hover:border-red-800/60 hover:shadow-xs relative ${
                                    t.unreadByUser ? 'border-red-400 ring-1 ring-red-400/30' : 'border-neutral-200'
                                  }`}
                                >
                                  {t.unreadByUser && (
                                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                                  )}

                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[11px] font-black text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                                        #{t.id}
                                      </span>
                                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">
                                        {t.category}
                                      </span>
                                    </div>

                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                      isNew 
                                        ? 'text-amber-800 bg-amber-50 border border-amber-200'
                                        : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                                    }`}>
                                      <Clock className="w-3 h-3 text-emerald-600" />
                                      {isNew ? 'New' : 'Active'}
                                    </span>
                                  </div>

                                  <h4 className="font-bold text-sm text-neutral-900 line-clamp-1">
                                    {t.subject}
                                  </h4>

                                  {t.orderId && (
                                    <div className="text-[11px] font-mono text-neutral-500 mt-0.5 flex items-center gap-1">
                                      <ShoppingBag className="w-3 h-3 text-neutral-400" />
                                      <span>Order #{t.orderId}</span>
                                    </div>
                                  )}

                                  {lastMsg && (
                                    <p className="text-xs text-neutral-500 line-clamp-1 mt-1.5 bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                                      <strong className="text-neutral-700">{lastMsg.sender === 'user' ? 'You' : 'Factory Support'}:</strong> {lastMsg.text}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                                    <span>Updated {formatDate(t.updatedAt || t.createdAt)}</span>
                                    <span className="flex items-center gap-1 font-bold text-red-800">
                                      <span>Chat Live</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* 3. CLOSED TICKETS GROUP (NICHE SIDE JITNE CLOSE HOTE RAHE VAH SHOW KAREN) */}
                        <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Closed & Resolved Tickets ({closedTickets.length})</span>
                            </span>
                            <span className="text-[11px] text-neutral-400 font-normal">Past resolved inquiries</span>
                          </div>

                          {closedTickets.length === 0 ? (
                            <div className="p-3 rounded-xl bg-neutral-100/70 border border-neutral-200 text-center text-xs text-neutral-400">
                              No closed tickets yet.
                            </div>
                          ) : (
                            closedTickets.map((t) => {
                              const lastMsg = t.messages?.[t.messages.length - 1];

                              return (
                                <div
                                  key={t.id}
                                  onClick={() => handleOpenTicketChat(t)}
                                  className="p-3.5 rounded-2xl border border-neutral-200 bg-white/80 hover:bg-white hover:border-neutral-300 transition-all cursor-pointer opacity-90 hover:opacity-100"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                                        #{t.id}
                                      </span>
                                      <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                                        {t.category}
                                      </span>
                                    </div>

                                    <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-neutral-500" />
                                      Closed
                                    </span>
                                  </div>

                                  <h4 className="font-bold text-xs sm:text-sm text-neutral-800 line-clamp-1">
                                    {t.subject}
                                  </h4>

                                  {/* Star Rating & Feedback preview if user rated */}
                                  {typeof t.rating === 'number' && (
                                    <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          className={`w-3 h-3 ${s <= (t.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'}`}
                                        />
                                      ))}
                                      <span className="text-[10px] font-bold text-neutral-600 font-mono ml-1">
                                        {t.rating}/5 Rating Submitted
                                      </span>
                                    </div>
                                  )}

                                  {lastMsg && (
                                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-1 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                                      <strong className="text-neutral-700">{lastMsg.sender === 'user' ? 'You' : 'Factory Support'}:</strong> {lastMsg.text}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-[10px] text-neutral-400">
                                    <span>Closed {formatDate(t.closedAt || t.updatedAt || t.createdAt)}</span>
                                    <span className="flex items-center gap-1 font-semibold text-neutral-600">
                                      <span>View History & Rating</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SECTION B: WHOLESALE FAQS */}
              {supportSection === 'faq' && (
                <div className="space-y-3.5 flex-1 flex flex-col">
                  {/* Search FAQ */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search wholesale FAQs (MOQ, Bilti, GST, UPI)..."
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs text-neutral-900"
                    />
                  </div>

                  {/* FAQ Accordion List */}
                  <div className="space-y-2 flex-1">
                    {WHOLESALE_FAQS.filter(f => {
                      if (!faqSearch.trim()) return true;
                      const q = faqSearch.toLowerCase();
                      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
                    }).map((faq) => {
                      const isExpanded = expandedFaqId === faq.id;

                      return (
                        <div
                          key={faq.id}
                          className="bg-white rounded-xl border border-neutral-200 overflow-hidden transition-all shadow-2xs"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                            className="w-full p-3.5 text-left flex items-start justify-between gap-2 hover:bg-neutral-50 transition-colors"
                          >
                            <div>
                              <span className="text-[10px] font-bold text-red-800 uppercase font-mono tracking-tight block">
                                {faq.category}
                              </span>
                              <h4 className="font-bold text-xs sm:text-sm text-neutral-900 mt-0.5">
                                {faq.question}
                              </h4>
                            </div>
                            <div className="p-1 text-neutral-400 flex-shrink-0">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-1 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 bg-[#fafaf9]">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* FAQ Footer CTA */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 mt-auto">
                    <div>
                      <h5 className="font-bold text-xs text-red-950">Still need factory assistance?</h5>
                      <p className="text-[11px] text-red-800">Our accounts and dispatch desk is ready to help.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSupportSection('tickets');
                        setViewMode('create');
                      }}
                      className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex-shrink-0"
                    >
                      + Create Ticket
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW 2: CREATE NEW TICKET FORM */}
          {viewMode === 'create' && (
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex-1 flex flex-col justify-between">
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <h3 className="text-base font-black font-heading text-neutral-900">
                    Raise Support Ticket
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Describe your issue and our wholesale mill desk will respond promptly.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 block">Issue Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none bg-white text-xs font-semibold"
                  >
                    <option value="Order Status">Order Status & Bilti Tracking</option>
                    <option value="Payment Issue">Payment & UTR Verification</option>
                    <option value="Product Inquiry">Product Specs, MOQ & Samples</option>
                    <option value="Delivery & Transport">Cargo Transport & Logistics</option>
                    <option value="Other">Other Wholesale Inquiry</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 block">Subject / Short Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Need bilti tracking update for Surat consignment"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs"
                  />
                </div>

                {/* Optional Order Reference */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-800">Order ID Reference</label>
                    <span className="text-[10px] text-neutral-400 font-medium">Optional</span>
                  </div>
                  {userOrders.length > 0 ? (
                    <select
                      value={orderRef}
                      onChange={(e) => setOrderRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none bg-white text-xs font-mono"
                    >
                      <option value="">-- No specific order linked --</option>
                      {userOrders.map(o => (
                        <option key={o.id} value={o.id}>
                          Order #{o.id} (₹{o.totalAmount} • {o.status})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. ORD-1792839 (leave empty if general)"
                      value={orderRef}
                      onChange={(e) => setOrderRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs font-mono"
                    />
                  )}
                </div>

                {/* Initial Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 block">Detailed Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please explain in detail what you need help with..."
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="flex-1 py-3 px-4 border border-neutral-300 hover:bg-neutral-100 font-bold text-xs rounded-xl text-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="flex-1 py-3 px-4 bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSubmittingTicket ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 3: TICKET CHAT & RATING */}
          {viewMode === 'chat' && selectedTicket && (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Ticket Meta Header Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 mb-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                      #{selectedTicket.id}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500">
                      {selectedTicket.category}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedTicket.status === 'closed'
                      ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                      : selectedTicket.status === 'new'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {selectedTicket.status === 'closed' ? 'Closed' : selectedTicket.status === 'new' ? 'New Ticket' : 'Active Chat'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-neutral-900 mt-1">
                  {selectedTicket.subject}
                </h4>

                {selectedTicket.orderId && (
                  <div className="text-[11px] font-mono text-neutral-600 mt-0.5 flex items-center gap-1.5">
                    <ShoppingBag className="w-3 h-3 text-neutral-400" />
                    <span>Linked Order: <strong>#{selectedTicket.orderId}</strong></span>
                  </div>
                )}
              </div>

              {/* Chat Messages Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 min-h-[220px]">
                {(selectedTicket.messages || []).map((msg, idx) => {
                  const isUser = msg.sender === 'user';

                  return (
                    <div 
                      key={msg.id || idx}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase">
                          {isUser ? 'You' : 'Factory Support'}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {formatDate(msg.timestamp)}
                        </span>
                      </div>

                      <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-2xs ${
                        isUser
                          ? 'bg-neutral-900 text-white rounded-tr-none'
                          : 'bg-white text-neutral-900 border border-neutral-200 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* BOTTOM ACTIONS: ACTIVE CHAT INPUT OR CLOSED TICKET FEEDBACK */}
              {selectedTicket.status !== 'closed' ? (
                <form onSubmit={handleSendReply} className="pt-3 border-t border-neutral-200 flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type your message to support desk..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-red-800 focus:outline-none bg-white text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="px-4 py-2.5 bg-red-800 hover:bg-red-900 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              ) : (
                /* CLOSED TICKET: 1-TIME OPTIONAL RATING & FEEDBACK */
                <div className="pt-3 mt-2 border-t border-neutral-200">
                  <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <div className="flex items-center gap-2 text-neutral-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span className="font-extrabold text-neutral-900">Ticket Closed & Resolved</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {selectedTicket.closedAt ? formatDate(selectedTicket.closedAt) : 'Resolved'}
                      </span>
                    </div>

                    {feedbackSubmitted ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span className="font-bold">Thank you! Your feedback is recorded.</span>
                        </div>
                        {selectedRating && (
                          <div className="flex items-center gap-1 pt-1">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <Star
                                key={starVal}
                                className={`w-4 h-4 ${
                                  starVal <= selectedRating
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-neutral-300'
                                }`}
                              />
                            ))}
                            <span className="text-[11px] font-bold ml-1.5">{selectedRating} / 5 Stars</span>
                          </div>
                        )}
                        {feedbackComment && (
                          <p className="text-[11px] text-neutral-600 italic mt-1 bg-white p-2 rounded-lg border border-emerald-100">
                            "{feedbackComment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitFeedback} className="space-y-3">
                        <div>
                          <label className="font-bold text-neutral-800 block text-xs">
                            How was your support experience? (Optional)
                          </label>
                          <p className="text-[11px] text-neutral-500">
                            Rate factory resolution quality (1 to 5 Stars):
                          </p>
                        </div>

                        {/* Monocolor Star Rating Bar (No Emojis) */}
                        <div className="flex items-center gap-2 py-1">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setSelectedRating(starVal)}
                              className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
                              title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  starVal <= selectedRating
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-neutral-300 hover:text-neutral-400'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold font-mono text-neutral-700 ml-2">
                            {selectedRating} / 5 Stars
                          </span>
                        </div>

                        {/* Optional Feedback Comment */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-700 block">
                            Feedback / Suggestions (Optional):
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Write any thoughts on resolution speed or satisfaction..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:border-red-800 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingFeedback}
                          className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                        >
                          {isSubmittingFeedback ? (
                            <span>Submitting...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Submit Feedback (Optional)</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
