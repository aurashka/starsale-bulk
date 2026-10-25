import React, { useState } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  X, 
  Sparkles,
  Lock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { WholesaleUser } from '../types.ts';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  currentUser: WholesaleUser | null;
  onSignOut: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminPanel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  currentUser,
  onSignOut,
  isAdminLoggedIn,
  onOpenAdminPanel
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  // Hidden admin entrance: clicking the star dot or key combination
  const handleDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = logoClicks + 1;
    if (newCount >= 3) {
      setLogoClicks(0);
      onOpenAdminPanel();
    } else {
      setLogoClicks(newCount);
      setTimeout(() => setLogoClicks(0), 1500);
    }
  };

  // Only show Admin Panel button if role === 'admin' or isAdminLoggedIn
  const showAdminButton = currentUser?.role === 'admin' || isAdminLoggedIn;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#fdfdfc]/95 backdrop-blur-md border-b border-neutral-200 transition-all">
        
        {/* Bold Indian B2B Ticker Bar (Bold Red, Yellow, Green accents) */}
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white text-[11px] font-medium py-1.5 px-4 tracking-wide flex items-center justify-between border-b border-neutral-800">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">All-India Transport</span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-300">Tirupur & Surat Factory Direct Rates (₹ INR)</span>
          </div>

          <div className="mx-auto sm:mx-0 flex items-center gap-2">
            <span className="bg-amber-400 text-neutral-950 px-2 py-0.2 rounded font-black text-[10px] tracking-wider uppercase">
              GST INVOICE
            </span>
            <span className="text-neutral-200 font-semibold">100% Tax Compliant B2B Billing</span>
            <span className="text-rose-400 font-bold hidden md:inline">• Save up to 40% on 100+ pcs lots</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-neutral-300 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Transport Dispatch +91
            </span>

            {/* ONLY visible if role === 'admin' */}
            {showAdminButton && (
              <button 
                onClick={onOpenAdminPanel}
                className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-all animate-pulse"
              >
                <Lock className="w-2.5 h-2.5 text-yellow-300" /> Admin Suite
              </button>
            )}
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Brand with bold colorful styling */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left group flex items-baseline gap-1 focus:outline-none"
            >
              <span className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-neutral-900 group-hover:text-red-600 transition-colors">
                STARDOT
              </span>
              {/* Secret click target on the dot */}
              <span 
                onClick={handleDotClick}
                title="Stardot"
                className="w-2.5 h-2.5 rounded-full bg-red-600 hover:bg-amber-500 inline-block cursor-pointer transition-colors shadow-xs"
              />
              <span className="text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-900 ml-1 font-bold border border-amber-400/40">
                WHOLESALE • INDIA
              </span>
            </button>
          </div>

          {/* Search Bar - Desktop & Tablet */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search styles, 450 GSM fleece, denim jeans, SKU..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#f1f1ee] border border-neutral-200 focus:border-red-600 focus:bg-white text-sm rounded-full pl-10 pr-9 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-2">
            
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="p-2 text-neutral-700 hover:bg-neutral-100 rounded-full md:hidden transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Button */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2.5 text-neutral-700 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Wishlist"
              title="Saved wholesale styles"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart / Wholesale Bag Button with Bold Accents */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-3.5 py-2 transition-all active:scale-95 shadow-md border border-neutral-800"
              aria-label="Wholesale Bag"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold hidden sm:inline">Bulk Lot</span>
              <span className="w-5 h-5 bg-red-600 text-white text-[11px] font-black rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {/* User Account Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 ml-1">
                <button
                  onClick={onSignOut}
                  className="text-xs font-semibold text-neutral-500 hover:text-red-600 hidden sm:inline transition-colors"
                >
                  Logout
                </button>

                <div 
                  onClick={onOpenAuth}
                  className="w-9 h-9 rounded-full bg-neutral-900 text-amber-400 text-xs font-bold flex items-center justify-center cursor-pointer border-2 border-amber-400 shadow-sm"
                  title={`${currentUser.name || currentUser.email || 'Trader'}${currentUser.phone ? ` (${currentUser.phone})` : ''}`}
                >
                  {(currentUser.name || currentUser.email || 'U').slice(0, 1).toUpperCase()}
                </div>

                {/* Show Admin Suite button in header for logged in admin */}
                {showAdminButton && (
                  <button
                    onClick={onOpenAdminPanel}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs font-black hover:bg-red-700 transition-all shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Admin Suite</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 rounded-full text-xs font-bold transition-all shadow-2xs"
                title="B2B Login / Sign Up"
              >
                <UserIcon className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">Login / Register</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {isSearchExpanded && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-neutral-200 bg-[#fdfdfc]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search bulk products in ₹ INR..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-neutral-100 border border-neutral-300 focus:border-red-600 focus:bg-white text-sm rounded-full pl-9 pr-9 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
