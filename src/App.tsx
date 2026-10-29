import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { CategoryScroller } from './components/CategoryScroller.tsx';
import { HorizontalProductScroller } from './components/HorizontalProductScroller.tsx';
import { ProductGrid } from './components/ProductGrid.tsx';
import { ProductDetailView } from './components/ProductDetailView.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { WishlistDrawer } from './components/WishlistDrawer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Footer } from './components/Footer.tsx';
import { MobileNav } from './components/MobileNav.tsx';

import { PaymentGatewayModal } from './components/PaymentGatewayModal.tsx';
import { Product, CartItem, WholesaleUser, CategoryItem, CompanyFooterInfo, HeroSlide, PaymentSettings, WholesaleOrder } from './types.ts';
import { 
  subscribeToProducts, 
  subscribeToCategories,
  subscribeToFooterInfo,
  subscribeToHeroSlides,
  getLocalFooterInfo,
  getLocalHeroSlides,
  getSavedWishlist, 
  saveWishlist,
  getOrCreateDeviceUser,
  getLocalPaymentSettings,
  subscribeToPaymentSettings,
  isUserAdmin,
  subscribeToCurrentUser,
  saveCurrentUser
} from './services/dataService.ts';
import { INITIAL_CATEGORIES } from './data/defaultProducts.ts';

export default function App() {
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [footerInfo, setFooterInfo] = useState<CompanyFooterInfo>(() => getLocalFooterInfo());
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => getLocalHeroSlides());
  const [loading, setLoading] = useState(true);

  // Search & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Interactive views
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<WholesaleOrder | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => getLocalPaymentSettings());

  // User state: Persistent device auto-login so guest orders are never lost across restarts
  const [currentUser, setCurrentUser] = useState<WholesaleUser | null>(() => {
    try {
      return getOrCreateDeviceUser();
    } catch {
      return null;
    }
  });

  // Admin authentication state: ONLY active if isUserAdmin(currentUser)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      const rawUser = localStorage.getItem('stardot_current_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return isUserAdmin(u);
      }
    } catch {}
    return false;
  });

  // Strict synchronization: Ensure isAdminLoggedIn is always synced with isUserAdmin(currentUser)
  useEffect(() => {
    const isMasterAdmin = isUserAdmin(currentUser);
    setIsAdminLoggedIn(isMasterAdmin);
    if (!isMasterAdmin) {
      sessionStorage.removeItem('stardot_admin_auth');
    } else {
      sessionStorage.setItem('stardot_admin_auth', 'true');
    }
  }, [currentUser]);

  // Real-time synchronization of current user from Firebase Realtime Database:
  // When an admin edits the user in Firebase Console (e.g. changing role to 'admin'),
  // this listener immediately reflects the change in the web app without requiring page refresh!
  useEffect(() => {
    const unsubUser = subscribeToCurrentUser(currentUser, (freshUser) => {
      setCurrentUser(freshUser);
    });
    return () => {
      if (typeof unsubUser === 'function') unsubUser();
    };
  }, [currentUser?.uid]);

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

  // Listen for user auto-login events across components
  useEffect(() => {
    const handleUserChanged = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('stardot_user_changed', handleUserChanged);
    return () => window.removeEventListener('stardot_user_changed', handleUserChanged);
  }, []);

  // Subscribe to Products, Categories, Footer Profile & Hero Banners
  useEffect(() => {
    const unsubProducts = subscribeToProducts((liveProducts) => {
      setProducts(liveProducts);
      setLoading(false);
    });

    const unsubCategories = subscribeToCategories((liveCats) => {
      setCategories(liveCats);
    });

    const unsubFooter = subscribeToFooterInfo((info) => {
      setFooterInfo(info);
    });

    const unsubHero = subscribeToHeroSlides((slides) => {
      setHeroSlides(slides);
    });

    const unsubPayment = subscribeToPaymentSettings((settings) => {
      setPaymentSettings(settings);
    });

    return () => {
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubCategories === 'function') unsubCategories();
      if (typeof unsubFooter === 'function') unsubFooter();
      if (typeof unsubHero === 'function') unsubHero();
      if (typeof unsubPayment === 'function') unsubPayment();
    };
  }, []);

  // Save cart & wishlist
  useEffect(() => {
    localStorage.setItem('stardot_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    saveWishlist(wishlistIds);
  }, [wishlistIds]);

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
    setIsUserProfileOpen(false);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('stardot_admin_auth', 'true');
    const adminUser: WholesaleUser = (currentUser && currentUser.role === 'admin')
      ? currentUser
      : {
          uid: 'admin-master-uid',
          name: 'System Admin',
          email: 'admin@stardot.in',
          phone: '+91 99999 00000',
          role: 'admin',
          companyName: 'Stardot Wholesale Admin'
        };
    setCurrentUser(adminUser);
    try {
      localStorage.setItem('stardot_current_user', JSON.stringify(adminUser));
    } catch {}
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('stardot_admin_auth');
    setIsAdminPanelOpen(false);
  };

  // Filter products by selective placement & custom sequence:
  // Horizontal scroller: ONLY products with showInHorizontal === true (or legacy fallback)
  const horizontalProducts = products
    .filter(p => p.showInHorizontal !== undefined ? p.showInHorizontal : (!p.displayPlacement || p.displayPlacement === 'both' || p.displayPlacement === 'horizontal'))
    .sort((a, b) => (a.horizontalSequence ?? a.sequence ?? 999) - (b.horizontalSequence ?? b.sequence ?? 999));

  // Vertical catalog: ONLY products with showInVertical === true (or legacy fallback)
  const verticalProducts = products
    .filter(p => p.showInVertical !== undefined ? p.showInVertical : (!p.displayPlacement || p.displayPlacement === 'both' || p.displayPlacement === 'vertical'))
    .sort((a, b) => (a.verticalSequence ?? a.sequence ?? 999) - (b.verticalSequence ?? b.sequence ?? 999));

  const cartTotalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-red-800 selection:text-white pb-16 md:pb-0">
      
      {/* 1. If user clicked a product, show the Full-Screen Product View with floating buy bar! */}
      {selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          isWishlisted={wishlistIds.includes(selectedProduct.id)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onDirectOrderNow={handleDirectOrderNow}
        />
      ) : (
        <>
          {/* Main Catalog View */}
          <Navbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            cartCount={cartTotalCount}
            wishlistCount={wishlistIds.length}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenUserProfile={() => setIsUserProfileOpen(true)}
            currentUser={currentUser}
            onSignOut={handleBuyerSignOut}
            onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          />

          <main className="flex-1">
            
            {/* Hero Banner */}
            <HeroBanner
              slides={heroSlides}
              products={products}
              onSelectProduct={setSelectedProduct}
              onShopNow={(cat) => {
                if (cat) setSelectedCategory(cat);
                const el = document.getElementById('full-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Dynamic Category Scroller */}
            <CategoryScroller
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                const el = document.getElementById('full-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Horizontal Scroller: Configured for 'horizontal' or 'both' placement */}
            {horizontalProducts.length > 0 && (
              <HorizontalProductScroller
                title="Trending Wholesale Drops"
                subtitle="Fast-moving retail lots ready for immediate transport dispatch"
                badge="Hot Sourcing"
                products={horizontalProducts}
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

            {/* Vertical Catalog Grid: Configured for 'vertical' or 'both' placement */}
            <ProductGrid
              products={verticalProducts}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={setSelectedProduct}
              onQuickAdd={handleQuickAdd}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
            />

          </main>

          <Footer footerInfo={footerInfo} />

          {/* Mobile Bottom Bar */}
          <MobileNav
            cartCount={cartTotalCount}
            wishlistCount={wishlistIds.length}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            onOpenAuth={() => {
              if (currentUser) {
                setIsUserProfileOpen(true);
              } else {
                setIsAuthOpen(true);
              }
            }}
            onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            isAdmin={isUserAdmin(currentUser)}
            onOpenAdmin={() => setIsAdminPanelOpen(true)}
          />
        </>
      )}

      {/* Drawers & Modals */}
      {/* Wholesale Bag / Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          currentUser={currentUser}
          paymentSettings={paymentSettings}
          onUserAutoLogin={(u) => setCurrentUser(u)}
          onOpenPaymentGateway={(ord) => {
            setActivePaymentOrder(ord);
            setIsPaymentGatewayOpen(true);
          }}
        />
      )}

      {/* Wishlist Drawer */}
      {isWishlistOpen && (
        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          products={products}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onSelectProduct={setSelectedProduct}
          onQuickAdd={handleQuickAdd}
        />
      )}

      {/* Trader Sign In / Register Modal */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleBuyerLoginSuccess}
        />
      )}

      {/* User Profile & Live Order Tracking Full-Page View */}
      {isUserProfileOpen && (
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
          currentUser={currentUser || getOrCreateDeviceUser()}
          onSignOut={handleBuyerSignOut}
          onOpenPaymentGateway={(ord) => {
            setActivePaymentOrder(ord);
            setIsPaymentGatewayOpen(true);
          }}
          onOpenAdmin={() => {
            setIsUserProfileOpen(false);
            setIsAdminPanelOpen(true);
          }}
        />
      )}

      
      {/* UPI Payment Gateway & Verification Modal */}
      {isPaymentGatewayOpen && activePaymentOrder && (
        <PaymentGatewayModal
          isOpen={isPaymentGatewayOpen}
          onClose={() => setIsPaymentGatewayOpen(false)}
          order={activePaymentOrder}
          paymentSettings={paymentSettings}
          onPaymentSuccess={(updatedOrder) => {
            setActivePaymentOrder(updatedOrder);
          }}
          onOpenProfile={() => {
            setIsPaymentGatewayOpen(false);
            setIsUserProfileOpen(true);
          }}
        />
      )}

      {/* Floating Admin Quick Access Button: ONLY visible if isUserAdmin(currentUser) */}
      {isUserAdmin(currentUser) && (
        <button
          type="button"
          onClick={() => setIsAdminPanelOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-red-800 hover:bg-red-900 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black border-2 border-white/30 transition-all hover:scale-105 active:scale-95 animate-in fade-in"
          title="Open Admin Suite (Admin Access Only)"
        >
          <Lock className="w-4 h-4 text-red-200" />
          <span>Admin Suite</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Admin Suite: ONLY visible to role === 'admin' */}
      {isAdminPanelOpen && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          isAdminLoggedIn={isAdminLoggedIn}
          onLoginSuccess={handleAdminLoginSuccess}
          onLogout={handleAdminLogout}
          products={products}
          categories={categories}
          footerInfo={footerInfo}
          onFooterUpdate={setFooterInfo}
          onRefreshProducts={() => {
            const unsub = subscribeToProducts((live) => setProducts(live));
            if (typeof unsub === 'function') unsub();
          }}
        />
      )}

    </div>
  );
}
