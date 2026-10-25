import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { CategoryScroller } from './components/CategoryScroller.tsx';
import { HorizontalProductScroller } from './components/HorizontalProductScroller.tsx';
import { ProductGrid } from './components/ProductGrid.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { WishlistDrawer } from './components/WishlistDrawer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Footer } from './components/Footer.tsx';
import { MobileNav } from './components/MobileNav.tsx';

import { Product, CartItem, WholesaleUser } from './types.ts';
import { 
  subscribeToProducts, 
  getSavedWishlist, 
  saveWishlist 
} from './services/dataService.ts';

export default function App() {
  // Products state (synced with Firebase Firestore in real-time)
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Interactive Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);


  // User state (optional B2B buyer account)
  const [currentUser, setCurrentUser] = useState<WholesaleUser | null>(() => {
    try {
      const raw = localStorage.getItem('stardot_current_user');
      if (raw) {
        const u = JSON.parse(raw);
        return {
          ...u,
          name: u.name || (u.email ? u.email.split('@')[0] : 'Trader'),
          phone: u.phone || '+91 98000 00000',
          role: u.role || 'user'
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  // Admin authentication state (only true if role === 'admin' or session active)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      const rawUser = localStorage.getItem('stardot_current_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.role === 'admin') return true;
      }
    } catch {}
    return sessionStorage.getItem('stardot_admin_auth') === 'true';
  });

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('stardot_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getSavedWishlist());

  // Subscribe to Firebase Products in realtime
  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      setProducts(liveProducts);
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('stardot_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save wishlist to localStorage
  useEffect(() => {
    saveWishlist(wishlistIds);
  }, [wishlistIds]);

  // Keyboard shortcut for hidden admin: Ctrl+Alt+A or Cmd+Alt+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminPanelOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
      setIsAdminPanelOpen(true);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cart handlers
  const handleAddToCart = (
    product: Product, 
    size: string, 
    color: string, 
    quantity: number, 
    unitPrice: number
  ) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && 
                item.selectedSize === size && 
                item.selectedColor === color
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          appliedUnitPrice: unitPrice
        };
        return updated;
      } else {
        return [...prev, {
          product,
          selectedSize: size,
          selectedColor: color,
          quantity,
          appliedUnitPrice: unitPrice
        }];
      }
    });

    setIsCartOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    const defaultSize = product.sizes[0] || 'M';
    const defaultColor = product.colors[0] || 'Standard';
    const moq = product.moq || 10;
    
    let unitPrice = product.basePrice;
    if (product.bulkTiers && product.bulkTiers.length > 0) {
      const match = product.bulkTiers.find(t => moq >= t.minQty && (!t.maxQty || moq <= t.maxQty));
      if (match) unitPrice = match.unitPrice;
    }

    handleAddToCart(product, defaultSize, defaultColor, moq, unitPrice);
  };

  const handleDirectOrderNow = (
    product: Product,
    size: string,
    color: string,
    quantity: number,
    unitPrice: number
  ) => {
    handleAddToCart(product, size, color, quantity, unitPrice);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    setCartItems(prev => {
      const item = prev[index];
      if (!item) return prev;

      let newUnitPrice = item.product.basePrice;
      if (item.product.bulkTiers && item.product.bulkTiers.length > 0) {
        const sorted = [...item.product.bulkTiers].sort((a, b) => b.minQty - a.minQty);
        for (const t of sorted) {
          if (newQty >= t.minQty) {
            newUnitPrice = t.unitPrice;
            break;
          }
        }
      }

      const copy = [...prev];
      copy[index] = {
        ...item,
        quantity: newQty,
        appliedUnitPrice: newUnitPrice
      };
      return copy;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  // Login handler with role separation
  const handleBuyerLoginSuccess = (user: WholesaleUser) => {
    setCurrentUser(user);
    localStorage.setItem('stardot_current_user', JSON.stringify(user));
    if (user.role === 'admin') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('stardot_admin_auth', 'true');
    } else {
      setIsAdminLoggedIn(false);
      sessionStorage.removeItem('stardot_admin_auth');
    }
  };

  const handleBuyerSignOut = () => {
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('stardot_current_user');
    sessionStorage.removeItem('stardot_admin_auth');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('stardot_admin_auth', 'true');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('stardot_admin_auth');
    setIsAdminPanelOpen(false);
  };

  const trendingProducts = products.filter(p => p.isTrending || p.isFeatured);
  const knitwearAndHoodies = products.filter(p => p.category === 'Sweaters' || p.category === 'Hoodies');

  const cartTotalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="min-h-screen bg-[#fcfcfa] text-[#121212] flex flex-col selection:bg-red-600 selection:text-white pb-16 md:pb-0">
      
      {/* Navigation Header */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartTotalCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onSignOut={handleBuyerSignOut}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        
        {/* 1. Hero Banner: Horizontal card image scroller */}
        <HeroBanner
          onShopNow={(cat) => {
            if (cat) setSelectedCategory(cat);
            const el = document.getElementById('full-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 2. Category Scroller: Horizontal pill scroller */}
        <CategoryScroller
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            const el = document.getElementById('full-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 3. Horizontal Scroller Product List: Trending Wholesale Drops */}
        {trendingProducts.length > 0 && (
          <HorizontalProductScroller
            title="Trending Wholesale Drops"
            subtitle="Fast-moving retail lots ready for immediate container dispatch"
            badge="High Demand"
            products={trendingProducts}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={setSelectedProduct}
            onQuickAdd={handleQuickAdd}
            onViewAll={() => {
              setSelectedCategory('all');
              const el = document.getElementById('full-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* 4. Horizontal Scroller Product List: Heavyweight Knitwear & Fleece */}
        {knitwearAndHoodies.length > 0 && (
          <HorizontalProductScroller
            title="Heavyweight Blanks & Knitwear"
            subtitle="420–520 GSM luxury streetwear blanks ready for custom branding"
            badge="Factory Lot"
            products={knitwearAndHoodies}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={setSelectedProduct}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {/* 5. Vertical Product List: Full Wholesale Catalog with Search, Category Filter, and Sorting */}
        <ProductGrid
          products={products}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onSelectProduct={setSelectedProduct}
          onQuickAdd={handleQuickAdd}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />

      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Mobile Bottom Fixed Nav Bar (Phone Friendly) */}
      <MobileNav
        cartCount={cartTotalCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Modals & Drawers */}
      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onDirectOrderNow={handleDirectOrderNow}
      />

      {/* Cart & Wholesale Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={products}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onSelectProduct={setSelectedProduct}
        onQuickAdd={handleQuickAdd}
      />

      {/* Optional B2B Buyer Login/Signup (No Admin Traces) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleBuyerLoginSuccess}
      />

      {/* Hidden Admin Suite (User: admin / Pass: admin9557) */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        isAdminLoggedIn={isAdminLoggedIn}
        onLoginSuccess={handleAdminLoginSuccess}
        onLogout={handleAdminLogout}
        products={products}
        onRefreshProducts={() => {
          // Re-subscribe or trigger refresh
          const unsub = subscribeToProducts((live) => setProducts(live));
          if (typeof unsub === 'function') unsub();
        }}
      />

    </div>
  );
}
