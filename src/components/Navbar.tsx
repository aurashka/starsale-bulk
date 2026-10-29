import React, { useState } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  X, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';
import { WholesaleUser } from '../types.ts';
import { isUserAdmin } from '../services/dataService.ts';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenUserProfile: () => void;
  currentUser: WholesaleUser | null;
  onSignOut: () => void;
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
  onOpenUserProfile,
  currentUser,
  onSignOut,
  onOpenAdminPanel
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // STRICT REQUIREMENT: Admin button ONLY visible to role === 'admin'
  const isSuperAdmin = isUserAdmin(currentUser);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
        
        {/* Top Professional Indian B2B Ticker - White & Darkish Red Theme (NO Yellow) */}
        <div className="bg-neutral-900 text-white text-[11px] font-medium py-1.5 px-4 tracking-wide flex items-center justify-between border-b border-neutral-800">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">All-India Transport</span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-300">Tirupur & Surat Factory Direct Rates (₹ INR)</span>
          </div>

          <div className="mx-auto sm:mx-0 flex items-center gap-2">
            <span className="bg-red-800 text-white px-2 py-0.2 rounded font-bold text-[10px] tracking-wider uppercase">
              GST INVOICE
            </span>
            <span className="text-neutral-200 font-semibold">100% Tax Compliant B2B Billing</span>
            <span className="text-red-300 font-bold hidden md:inline">• Volume Slabs Active</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-neutral-300 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Cargo Transport +91
            </span>

            {/* ONLY visible if role === 'admin' */}
            {isSuperAdmin && (
              <button 
                onClick={onOpenAdminPanel}
                className="bg-red-800 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Lock className="w-3 h-3 text-red-200" /> Admin Suite
              </button>
            )}
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Brand (Clean White & Darkish Red, No secret clues) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left group flex items-baseline gap-1.5 focus:outline-none"
            >
              <span className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-neutral-900 group-hover:text-red-800 transition-colors">
                STARDOT
              </span>
              <span className="text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded-md bg-red-50 text-red-800 font-bold border border-red-200">
                WHOLESALE
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
                className="w-full bg-neutral-100 border border-neutral-200 focus:border-red-800 focus:bg-white text-sm rounded-full pl-10 pr-9 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
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
              className="relative p-2.5 text-neutral-700 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Wishlist"
              title="Saved styles"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-800 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart / Wholesale Bag Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-3.5 py-2 transition-all active:scale-95 shadow-sm"
              aria-label="Wholesale Bag"
            >
              <ShoppingBag className="w-4 h-4 text-red-200" />
              <span className="text-xs font-bold hidden sm:inline">Bulk Lot</span>
              <span className="w-5 h-5 bg-red-800 text-white text-[11px] font-black rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {/* User Account Button: Opens User Profile with Live Order Tracking when logged in! */}
            {currentUser ? (
              <div className="flex items-center gap-2 ml-1">
                <button
                  onClick={onOpenUserProfile}
                  className="flex items-center gap-1.5 p-1 pl-2 pr-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-full transition-all group"
                  title="My Account & Order Tracking"
                >
                  <div className="w-7 h-7 rounded-full bg-red-800 text-white text-xs font-bold flex items-center justify-center">
                    {(currentUser.name || currentUser.email || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-neutral-800 hidden sm:inline max-w-[100px] truncate">
                    {currentUser.name || 'Account'}
                  </span>
                </button>

                {/* Show Admin Suite button in header for logged in admin */}
                {isSuperAdmin && (
                  <button
                    onClick={onOpenAdminPanel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white rounded-full text-xs font-bold hover:bg-red-900 transition-all shadow-sm active:scale-95"
                    title="Open Admin Suite"
                  >
                    <Lock className="w-3.5 h-3.5 text-red-200" />
                    <span className="hidden sm:inline">Admin Suite</span>
                    <span className="sm:hidden">Admin</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 rounded-full text-xs font-bold transition-all shadow-2xs"
                title="B2B Login / Register"
              >
                <UserIcon className="w-4 h-4 text-red-800" />
                <span className="hidden sm:inline">Login / Register</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {isSearchExpanded && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-neutral-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search bulk products in ₹ INR..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-neutral-100 border border-neutral-300 focus:border-red-800 focus:bg-white text-sm rounded-full pl-9 pr-9 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none"
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
