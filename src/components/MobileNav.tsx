import React from 'react';
import { Home, Search, Heart, ShoppingBag, User, Lock } from 'lucide-react';

interface MobileNavProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onScrollToTop: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onScrollToTop,
  isAdmin,
  onOpenAdmin
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#ffffff]/95 backdrop-blur-md border-t border-[#e5e5df] md:hidden px-3 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={onScrollToTop}
        className="flex flex-col items-center gap-1 text-neutral-800 p-1 active:scale-95 transition-transform"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Store</span>
      </button>

      <button
        onClick={() => {
          const el = document.getElementById('full-catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-800 p-1 active:scale-95 transition-transform"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Search</span>
      </button>

      <button
        onClick={onOpenWishlist}
        className="relative flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-800 p-1 active:scale-95 transition-transform"
      >
        <Heart className="w-5 h-5" />
        {wishlistCount > 0 && (
          <span className="absolute top-0 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {wishlistCount}
          </span>
        )}
        <span className="text-[10px] font-semibold">Saved</span>
      </button>

      <button
        onClick={onOpenCart}
        className="relative flex flex-col items-center gap-1 text-neutral-900 p-1 active:scale-95 transition-transform"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-neutral-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold">Bag</span>
      </button>

      <button
        onClick={onOpenAuth}
        className="flex flex-col items-center gap-1 text-neutral-500 hover:text-neutral-800 p-1 active:scale-95 transition-transform"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Account</span>
      </button>

      {isAdmin && onOpenAdmin && (
        <button
          onClick={onOpenAdmin}
          className="flex flex-col items-center gap-1 text-red-800 hover:text-red-900 p-1 active:scale-95 transition-transform animate-in fade-in"
          title="Open Admin Suite"
        >
          <div className="relative">
            <Lock className="w-5 h-5 text-red-800" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-red-800">Admin</span>
        </button>
      )}
    </nav>
  );
};
