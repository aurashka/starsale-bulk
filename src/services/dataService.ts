import { 
  db, 
  rtdb,
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  ref,
  set,
  get,
  onValue,
  remove,
  update
} from '../firebase.ts';
import { Product, WholesaleOrder, WholesaleUser, CategoryItem, CompanyFooterInfo, HeroSlide, PaymentSettings } from '../types.ts';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, DEFAULT_FOOTER_INFO, DEFAULT_HERO_SLIDES, DEFAULT_PAYMENT_SETTINGS } from '../data/defaultProducts.ts';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'wholesale_orders';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const HERO_SLIDES_COLLECTION = 'hero_slides';

const LOCAL_PRODUCTS_KEY = 'stardot_local_products_inr_v3';
const LOCAL_CATEGORIES_KEY = 'stardot_local_categories_v3';
const LOCAL_ORDERS_KEY = 'stardot_local_orders_inr_v3';
const LOCAL_USERS_KEY = 'stardot_users_db_v3';
const LOCAL_HERO_SLIDES_KEY = 'stardot_local_hero_slides_v3';
const WISHLIST_KEY = 'stardot_wishlist_inr';

// Helper to get cached products
export function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Local product read error', err);
  }
  return INITIAL_PRODUCTS;
}

export function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.warn('Local product save error', err);
  }
}

// Helper to get cached categories
export function getLocalCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Local categories read error', err);
  }
  return INITIAL_CATEGORIES;
}

export function saveLocalCategories(cats: CategoryItem[]) {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(cats));
  } catch (err) {
    console.warn('Local categories save error', err);
  }
}

// Seed initial demo products to Firebase Realtime Database and Firestore
export async function seedInitialProducts(products: Product[] = INITIAL_PRODUCTS): Promise<void> {
  try {
    const rtdbProductsMap: Record<string, Product> = {};
    for (const prod of products) {
      rtdbProductsMap[prod.id] = prod;
    }
    await set(ref(rtdb, 'products'), rtdbProductsMap);
  } catch (err) {
    console.warn('RTDB seed note:', err);
  }

  try {
    for (const prod of products) {
      const { id, ...data } = prod;
      await setDoc(doc(db, PRODUCTS_COLLECTION, id), data);
    }
  } catch (err) {
    console.warn('Firestore seed note:', err);
  }
}

// Seed initial categories
export async function seedInitialCategories(categories: CategoryItem[] = INITIAL_CATEGORIES): Promise<void> {
  try {
    const map: Record<string, CategoryItem> = {};
    categories.forEach(c => { map[c.id] = c; });
    await set(ref(rtdb, 'categories'), map);
  } catch (err) {
    console.warn(err);
  }

  try {
    for (const c of categories) {
      await setDoc(doc(db, CATEGORIES_COLLECTION, c.id), c);
    }
  } catch (err) {
    console.warn(err);
  }
}

// Dynamic Categories Subscription
export function subscribeToCategories(onUpdate: (cats: CategoryItem[]) => void): () => void {
  const initial = getLocalCategories();
  onUpdate(initial);

  try {
    const catRef = ref(rtdb, 'categories');
    const unsub = onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        seedInitialCategories(initial);
        return;
      }
      const list: CategoryItem[] = [];
      Object.keys(data).forEach(key => {
        if (data[key]) list.push({ id: key, name: data[key].name || key });
      });
      if (list.length > 0) {
        // Ensure 'all' is always at top
        const hasAll = list.find(c => c.id === 'all');
        const sorted = hasAll 
          ? [hasAll, ...list.filter(c => c.id !== 'all')]
          : [{ id: 'all', name: 'All Wholesale Lots' }, ...list];
        saveLocalCategories(sorted);
        onUpdate(sorted);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  } catch (err) {
    console.warn('Categories RTDB error:', err);
    return () => {};
  }
}

// Save or Update Category
export async function saveCategory(category: CategoryItem): Promise<void> {
  const current = getLocalCategories();
  const existingIdx = current.findIndex(c => c.id === category.id);
  let updated: CategoryItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = category;
  } else {
    updated = [...current, category];
  }
  saveLocalCategories(updated);

  try {
    await set(ref(rtdb, `categories/${category.id}`), category);
    await setDoc(doc(db, CATEGORIES_COLLECTION, category.id), category);
  } catch (err) {
    console.warn('Save category error:', err);
  }
}

// Delete Category
export async function deleteCategoryById(categoryId: string): Promise<void> {
  if (categoryId === 'all') return; // Cannot delete 'all'
  const current = getLocalCategories();
  const updated = current.filter(c => c.id !== categoryId);
  saveLocalCategories(updated);

  try {
    await remove(ref(rtdb, `categories/${categoryId}`));
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
  } catch (err) {
    console.warn('Delete category error:', err);
  }
}

// -------------------------------------------------------------
// HERO SLIDER / TOP BANNER SERVICES
// -------------------------------------------------------------

// Helper to get cached hero slides
export function getLocalHeroSlides(): HeroSlide[] {
  try {
    const raw = localStorage.getItem(LOCAL_HERO_SLIDES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Local hero slides read error', err);
  }
  return DEFAULT_HERO_SLIDES;
}

export function saveLocalHeroSlides(slides: HeroSlide[]) {
  try {
    localStorage.setItem(LOCAL_HERO_SLIDES_KEY, JSON.stringify(slides));
  } catch (err) {
    console.warn('Local hero slides save error', err);
  }
}

// Seed initial hero slides
export async function seedInitialHeroSlides(slides: HeroSlide[] = DEFAULT_HERO_SLIDES): Promise<void> {
  try {
    const map: Record<string, HeroSlide> = {};
    slides.forEach((s, idx) => {
      map[s.id] = { ...s, sequence: s.sequence ?? idx + 1 };
    });
    await set(ref(rtdb, 'hero_slides'), map);
  } catch (err) {
    console.warn('RTDB seed hero slides error:', err);
  }

  try {
    for (const s of slides) {
      const { id, ...data } = s;
      await setDoc(doc(db, HERO_SLIDES_COLLECTION, id), data);
    }
  } catch (err) {
    console.warn('Firestore seed hero slides error:', err);
  }
}

// Dynamic Hero Slides Subscription
export function subscribeToHeroSlides(onUpdate: (slides: HeroSlide[]) => void): () => void {
  const initial = getLocalHeroSlides();
  onUpdate(initial);

  let hasData = false;

  try {
    const heroRef = ref(rtdb, 'hero_slides');
    const unsubRtdb = onValue(heroRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        seedInitialHeroSlides(initial);
        return;
      }
      const list: HeroSlide[] = [];
      if (Array.isArray(data)) {
        data.forEach(item => { if (item) list.push(item); });
      } else if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
          if (data[key]) list.push({ ...data[key], id: data[key].id || key });
        });
      }

      if (list.length > 0) {
        hasData = true;
        list.sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
        saveLocalHeroSlides(list);
        onUpdate(list);
      } else {
        seedInitialHeroSlides(initial);
      }
    });

    const colRef = collection(db, HERO_SLIDES_COLLECTION);
    const unsubFs = onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty && !hasData) {
        seedInitialHeroSlides(initial);
        return;
      }
      const items: HeroSlide[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<HeroSlide, 'id'>) });
      });
      if (items.length > 0) {
        items.sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
        saveLocalHeroSlides(items);
        onUpdate(items);
      }
    }, () => {});

    return () => {
      if (typeof unsubRtdb === 'function') unsubRtdb();
      if (typeof unsubFs === 'function') unsubFs();
    };
  } catch (err) {
    console.warn('Hero slides sync error:', err);
    return () => {};
  }
}

// Save or Update Hero Slide
export async function saveHeroSlide(slide: HeroSlide): Promise<void> {
  const current = getLocalHeroSlides();
  const existingIdx = current.findIndex(s => s.id === slide.id);
  let updated: HeroSlide[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = slide;
  } else {
    updated = [...current, slide];
  }
  updated.sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
  saveLocalHeroSlides(updated);

  try {
    await set(ref(rtdb, `hero_slides/${slide.id}`), slide);
    const { id, ...data } = slide;
    await setDoc(doc(db, HERO_SLIDES_COLLECTION, id), data);
  } catch (err) {
    console.warn('Save hero slide error:', err);
  }
}

// Delete Hero Slide
export async function deleteHeroSlideById(slideId: string): Promise<void> {
  const current = getLocalHeroSlides();
  const updated = current.filter(s => s.id !== slideId);
  saveLocalHeroSlides(updated);

  try {
    await remove(ref(rtdb, `hero_slides/${slideId}`));
    await deleteDoc(doc(db, HERO_SLIDES_COLLECTION, slideId));
  } catch (err) {
    console.warn('Delete hero slide error:', err);
  }
}

// Reorder hero slides sequence
export async function updateHeroSlideSequences(slides: HeroSlide[]): Promise<void> {
  const sequenced = slides.map((s, idx) => ({ ...s, sequence: idx + 1 }));
  saveLocalHeroSlides(sequenced);

  for (const s of sequenced) {
    try {
      await update(ref(rtdb, `hero_slides/${s.id}`), { sequence: s.sequence });
      await setDoc(doc(db, HERO_SLIDES_COLLECTION, s.id), { sequence: s.sequence }, { merge: true });
    } catch (e) {
      console.warn(e);
    }
  }
}

// -------------------------------------------------------------
// SELECTIVE PRODUCT PLACEMENT & ARROW SEQUENCING
// -------------------------------------------------------------

// Update selective product placements and sequence
export async function updateProductPlacements(
  updates: { 
    id: string; 
    showInHorizontal?: boolean; 
    horizontalSequence?: number; 
    showInVertical?: boolean; 
    verticalSequence?: number;
  }[]
): Promise<void> {
  const current = getLocalProducts();
  const map = new Map(updates.map(u => [u.id, u]));
  const updated = current.map(p => {
    const patch = map.get(p.id);
    return patch ? { ...p, ...patch } : p;
  });
  saveLocalProducts(updated);

  for (const item of updates) {
    const patch: Partial<Product> = {};
    if (typeof item.showInHorizontal === 'boolean') patch.showInHorizontal = item.showInHorizontal;
    if (typeof item.horizontalSequence === 'number') patch.horizontalSequence = item.horizontalSequence;
    if (typeof item.showInVertical === 'boolean') patch.showInVertical = item.showInVertical;
    if (typeof item.verticalSequence === 'number') patch.verticalSequence = item.verticalSequence;

    try {
      await update(ref(rtdb, `products/${item.id}`), patch);
      await setDoc(doc(db, PRODUCTS_COLLECTION, item.id), patch, { merge: true });
    } catch (e) {
      console.warn('Placement update error for', item.id, e);
    }
  }
}

// Subscribe to products with automatic demo creation if not available on Firebase
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: unknown) => void
) {
  const initial = getLocalProducts();
  onUpdate(initial);

  let hasReceivedData = false;

  try {
    const productsRef = ref(rtdb, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        seedInitialProducts(initial);
        return;
      }

      const items: Product[] = [];
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item) items.push(item);
        });
      } else if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
          if (data[key]) {
            items.push({ ...data[key], id: data[key].id || key });
          }
        });
      }

      if (items.length > 0) {
        hasReceivedData = true;
        // Sort by sequence if present
        items.sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
        saveLocalProducts(items);
        onUpdate(items);
      } else {
        seedInitialProducts(initial);
      }
    }, (error) => {
      if (onError) onError(error);
    });
  } catch (err) {
    console.warn('RTDB connection notice:', err);
  }

  // Firestore fallback
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const unsubscribeFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty && !hasReceivedData) {
          seedInitialProducts(initial);
          return;
        }
        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
        });
        if (items.length > 0) {
          items.sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
          saveLocalProducts(items);
          onUpdate(items);
        }
      },
      (err) => {
        console.warn('Firestore fallback note:', err);
      }
    );
    return unsubscribeFirestore;
  } catch (err) {
    return () => {};
  }
}

// Add or edit product across both Firebase Realtime DB and Firestore
export async function saveProduct(product: Product): Promise<void> {
  const current = getLocalProducts();
  const existingIdx = current.findIndex(p => p.id === product.id);
  let updatedList: Product[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = product;
  } else {
    updatedList = [product, ...current];
  }
  updatedList.sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
  saveLocalProducts(updatedList);

  try {
    await set(ref(rtdb, `products/${product.id}`), product);
  } catch (err) {
    console.warn('RTDB saveProduct error:', err);
  }

  try {
    const { id, ...data } = product;
    await setDoc(doc(db, PRODUCTS_COLLECTION, id), data);
  } catch (err) {
    console.warn('Firestore saveProduct error:', err);
  }
}

// Reorder product sequence (via Up / Down arrows)
export async function updateProductSequences(updatedProducts: Product[]): Promise<void> {
  const sequenced = updatedProducts.map((p, idx) => ({
    ...p,
    sequence: idx + 1
  }));
  saveLocalProducts(sequenced);

  for (const prod of sequenced) {
    try {
      await update(ref(rtdb, `products/${prod.id}`), { sequence: prod.sequence });
      await updateDocFallback(prod.id, { sequence: prod.sequence });
    } catch (e) {
      console.warn(e);
    }
  }
}

async function updateDocFallback(id: string, data: Partial<Product>) {
  try {
    await setDoc(doc(db, PRODUCTS_COLLECTION, id), data, { merge: true });
  } catch (e) {
    console.warn(e);
  }
}

// Delete product
export async function deleteProductById(productId: string): Promise<void> {
  const current = getLocalProducts();
  const updated = current.filter(p => p.id !== productId);
  saveLocalProducts(updated);

  try {
    await remove(ref(rtdb, `products/${productId}`));
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  } catch (err) {
    console.warn('Delete product error:', err);
  }
}

// Validate real non-empty orders and filter out ghost/demo/deleted entries
export function isValidRealOrder(ord: any): ord is WholesaleOrder {
  if (!ord || typeof ord !== 'object') return false;
  if (!ord.id || typeof ord.id !== 'string') return false;
  if (ord.isDeleted === true) return false;

  // Filter out completely empty/test records with no buyer identity or order #
  const hasIdentity = Boolean(
    (ord.customerName && ord.customerName.trim().length > 0) ||
    (ord.phone && ord.phone.replace(/\D/g, '').length >= 4) ||
    (ord.orderNumber && ord.orderNumber.trim().length > 0)
  );

  // Must have goods or valid total value (not empty zero ghost)
  const hasItems = Array.isArray(ord.items) && ord.items.length > 0;
  const hasAmount = typeof ord.totalAmount === 'number' && ord.totalAmount > 0;

  return hasIdentity && (hasItems || hasAmount);
}

// Device & Guest User Auto-Login Persistence (No forced login required to order)
const DEVICE_USER_KEY = 'stardot_device_user_id';
const CURRENT_USER_KEY = 'stardot_current_user';

// Strict check if user has admin privileges
export function isUserAdmin(user?: WholesaleUser | Partial<WholesaleUser> | null): boolean {
  if (!user) return false;
  // Guest device users are strictly NOT admin unless explicitly granted
  if (user.uid && user.uid.startsWith('dev_') && user.role !== 'admin') return false;

  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin' || role === 'superadmin' || role === 'administrator') return true;

  // Master fallback only for explicit master admin UID
  if (user.uid === 'admin-master-uid' && role !== 'user') return true;

  return false;
}

export function saveCurrentUser(user: WholesaleUser) {
  try {
    const isAdmin = isUserAdmin(user);
    const normalized: WholesaleUser = {
      ...user,
      role: isAdmin ? 'admin' : 'user'
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
    if (isAdmin) {
      sessionStorage.setItem('stardot_admin_auth', 'true');
    } else {
      sessionStorage.removeItem('stardot_admin_auth');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stardot_user_changed', { detail: normalized }));
    }
  } catch (e) {
    console.warn('saveCurrentUser error:', e);
  }
}

export function getCurrentStoredUser(): WholesaleUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const u: WholesaleUser = JSON.parse(raw);
      if (u.uid && u.uid.startsWith('dev_') && u.role !== 'admin') {
        u.role = 'user';
      }
      return u;
    }
  } catch {}
  return null;
}

// Live real-time listener for current logged-in user's role from Firebase RTDB & Firestore:
// - If role in Firebase is 'admin', admin buttons appear immediately (live).
// - If role in Firebase is changed to 'user', admin buttons disappear immediately (live).
export function subscribeToCurrentUser(
  currentUser: WholesaleUser | null,
  onUserUpdate: (updatedUser: WholesaleUser) => void
): () => void {
  if (!currentUser || !currentUser.uid) return () => {};

  let isMounted = true;
  const cleanListeners: (() => void)[] = [];

  const handleUserData = (userData: any, sourceKey?: string) => {
    if (!isMounted || !userData || typeof userData !== 'object') return;
    const current = getCurrentStoredUser() || currentUser;
    if (!current) return;

    const uPhone = String(userData.phone || '').replace(/\D/g, '').slice(-10);
    const currPhone = String(current.phone || '').replace(/\D/g, '').slice(-10);
    const uEmail = String(userData.email || '').trim().toLowerCase();
    const currEmail = String(current.email || '').trim().toLowerCase();
    const uUid = String(userData.uid || sourceKey || '').trim();

    // STRICT MATCH: Only updates if UID matches, OR 10-digit mobile matches, OR verified email matches!
    const isSameUser = Boolean(
      (uUid && current.uid && uUid === current.uid) ||
      (currPhone && uPhone && currPhone.length >= 10 && currPhone === uPhone) ||
      (currEmail && uEmail && currEmail.includes('@') && currEmail === uEmail)
    );

    if (isSameUser) {
      // Dynamic live role based on Firebase record:
      // If Firebase role is 'admin', role becomes 'admin'.
      // If Firebase role is 'user', role becomes 'user' and admin button disappears live!
      const rawRole = String(userData.role || '').trim().toLowerCase();
      const targetRole: 'admin' | 'user' = (rawRole === 'admin' || rawRole === 'superadmin' || rawRole === 'administrator')
        ? 'admin'
        : 'user';

      if (current.role !== targetRole || current.name !== userData.name || (uUid && current.uid !== uUid)) {
        const enriched: WholesaleUser = {
          ...current,
          ...userData,
          uid: uUid || current.uid,
          role: targetRole
        };
        saveCurrentUser(enriched);
        onUserUpdate(enriched);
      }
    }
  };

  try {
    // 1. Listen directly to user's UID node in Firebase Realtime Database
    const userRef = ref(rtdb, `users/${currentUser.uid}`);
    const unsubUser = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) handleUserData(data, currentUser.uid);
    });
    cleanListeners.push(() => {
      if (typeof unsubUser === 'function') unsubUser();
    });

    // 2. Also listen to users collection in RTDB to catch live role edits from Firebase Console
    const allUsersRef = ref(rtdb, 'users');
    const unsubAll = onValue(allUsersRef, (snapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        Object.keys(val).forEach(k => {
          handleUserData(val[k], k);
        });
      }
    });
    cleanListeners.push(() => {
      if (typeof unsubAll === 'function') unsubAll();
    });

    // 3. Listen to Firestore user document in case role was updated in Firestore Console
    const userDocRef = doc(db, USERS_COLLECTION, currentUser.uid);
    const unsubFs = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        handleUserData(snap.data(), currentUser.uid);
      }
    }, () => {});
    cleanListeners.push(() => {
      if (typeof unsubFs === 'function') unsubFs();
    });
  } catch (err) {
    console.warn('subscribeToCurrentUser RTDB error:', err);
  }

  return () => {
    isMounted = false;
    cleanListeners.forEach(c => c());
  };
}

export function getOrCreateDeviceUser(existingData?: Partial<WholesaleUser>): WholesaleUser {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const u: WholesaleUser = JSON.parse(raw);
      if (u && u.uid) {
        if (u.uid.startsWith('dev_')) {
          u.role = 'user';
        } else {
          u.role = isUserAdmin(u) ? 'admin' : 'user';
        }
        if (existingData && Object.keys(existingData).length > 0) {
          const updated: WholesaleUser = {
            ...u,
            ...existingData,
            name: existingData.name?.trim() || u.name,
            phone: existingData.phone?.trim() || u.phone,
            companyName: existingData.companyName?.trim() || u.companyName,
            city: existingData.city?.trim() || u.city,
            state: existingData.state?.trim() || u.state,
            gstin: existingData.gstin?.trim() || u.gstin,
            role: (u.uid.startsWith('dev_')) ? 'user' : (isUserAdmin(existingData) ? 'admin' : (u.role || 'user'))
          };
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
          return updated;
        }
        return u;
      }
    }
  } catch (e) {
    console.warn('Device user read error:', e);
  }

  // Create or retrieve persistent device ID
  let deviceId = '';
  try {
    deviceId = localStorage.getItem(DEVICE_USER_KEY) || '';
  } catch {}

  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    try {
      localStorage.setItem(DEVICE_USER_KEY, deviceId);
    } catch {}
  }

  const newDeviceUser: WholesaleUser = {
    uid: deviceId,
    name: existingData?.name?.trim() || 'Trader Partner',
    phone: existingData?.phone?.trim() || '',
    email: existingData?.email?.trim() || `trader_${deviceId.slice(-5)}@stardot.in`,
    role: 'user', // Device users are strictly role 'user'
    companyName: existingData?.companyName?.trim() || 'Retail Partner',
    city: existingData?.city?.trim() || 'Direct Godown',
    state: existingData?.state?.trim() || 'India',
    gstin: existingData?.gstin?.trim() || undefined
  };

  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newDeviceUser));
  } catch (e) {
    console.warn('Device user save error:', e);
  }

  return newDeviceUser;
}

// Delete Wholesale Order permanently from localStorage, RTDB & Firestore
export async function deleteOrderById(orderId: string, userId?: string): Promise<void> {
  // 1. Remove from LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const filtered = list.filter(o => o.id !== orderId);
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn('Local order delete error:', err);
  }

  // 2. Remove from Firebase Realtime Database
  try {
    await remove(ref(rtdb, `wholesale_orders/${orderId}`));
    if (userId) {
      await remove(ref(rtdb, `user_orders/${userId}/${orderId}`));
    }
  } catch (err) {
    console.warn('RTDB delete order error:', err);
  }

  // 3. Remove from Firebase Firestore
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
    if (userId) {
      await deleteDoc(doc(db, USERS_COLLECTION, userId, 'orders', orderId));
    }
  } catch (err) {
    console.warn('Firestore delete order error:', err);
  }
}

// Purge all corrupt, empty, and ghost demo orders
export async function purgeCorruptOrders(): Promise<number> {
  let purgedCount = 0;

  // 1. LocalStorage clean
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const valid = list.filter(isValidRealOrder);
      purgedCount += Math.max(0, list.length - valid.length);
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(valid));
    }
  } catch (err) {
    console.warn(err);
  }

  // 2. RTDB clean
  try {
    const snapshot = await get(ref(rtdb, 'wholesale_orders'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key of Object.keys(data)) {
        const item = data[key];
        if (!isValidRealOrder(item)) {
          await remove(ref(rtdb, `wholesale_orders/${key}`));
          purgedCount++;
        }
      }
    }
  } catch (err) {
    console.warn('RTDB purge error:', err);
  }

  return purgedCount;
}

// Save Wholesale Order user-wise & in root collection
// Auto-Register or Log in buyer during checkout/payment
export async function autoRegisterOrLoginCheckoutUser(data: {
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  city?: string;
  state?: string;
  gstin?: string;
}): Promise<WholesaleUser> {
  const cleanPhone10 = (data.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = cleanPhone10.length >= 10 ? `+91 ${cleanPhone10}` : data.phone.trim();
  const formattedEmail = (data.email && data.email.trim()) ? data.email.trim().toLowerCase() : `trader_${cleanPhone10 || 'buyer'}@stardot.in`;
  const name = data.name?.trim() || 'Trader Partner';

  let uid = cleanPhone10.length >= 10 ? `usr_${cleanPhone10}` : `usr_${Date.now()}`;
  let role: 'user' | 'admin' = 'user';

  // 1. Check if current stored user is admin
  const current = getCurrentStoredUser();
  if (current && isUserAdmin(current)) {
    uid = current.uid;
    role = 'admin';
  }

  // 2. Check if phone or email matches an existing user in Firebase RTDB
  try {
    const snap = await get(ref(rtdb, 'users'));
    if (snap.exists()) {
      const allUsers = snap.val();
      for (const k of Object.keys(allUsers)) {
        const u = allUsers[k];
        if (u) {
          const uPhone = String(u.phone || '').replace(/\D/g, '').slice(-10);
          const uEmail = String(u.email || '').trim().toLowerCase();
          if (
            (cleanPhone10 && uPhone === cleanPhone10) ||
            (data.email && uEmail === data.email.trim().toLowerCase()) ||
            (current && k === current.uid)
          ) {
            uid = u.uid || k;
            if (isUserAdmin(u) || String(u.role || '').toLowerCase() === 'admin') {
              role = 'admin';
            }
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Check RTDB user error:', err);
  }

  // 3. Fallback: Check if user has admin identifiers
  if (isUserAdmin({ phone: formattedPhone, email: formattedEmail, uid })) {
    role = 'admin';
  }

  const userObj: WholesaleUser = {
    uid,
    name,
    phone: formattedPhone,
    email: formattedEmail,
    role,
    companyName: data.companyName?.trim() || 'Retail Partner',
    city: data.city?.trim() || 'Direct Godown',
    state: data.state?.trim() || 'India',
    gstin: data.gstin?.trim() || undefined
  };

  saveCurrentUser(userObj);

  try {
    localStorage.setItem(DEVICE_USER_KEY, uid);
  } catch (e) {
    console.warn(e);
  }

  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const users: any[] = raw ? JSON.parse(raw) : [];
    const idx = users.findIndex(u => u.uid === uid || (u.phone && u.phone.replace(/\D/g, '').slice(-10) === cleanPhone10));
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userObj };
    } else {
      users.push({ ...userObj, passwordHash: 'auto_trader' });
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn(e);
  }

  try {
    await update(ref(rtdb, `users/${uid}`), {
      ...userObj,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('RTDB user auto-save note:', err);
  }

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      ...userObj,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore user auto-save note:', err);
  }

  return userObj;
}

export async function createWholesaleOrder(order: WholesaleOrder): Promise<void> {
  const cleanDigits = (order.phone || '').replace(/\D/g, '').slice(-10);
  const resolvedUserId = order.userId || (cleanDigits.length >= 10 ? `usr_${cleanDigits}` : `usr_${Date.now()}`);
  const ticketId = order.trackingTicketId || `TRK-${(order.orderNumber || '').replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
  
  const enrichedOrder: WholesaleOrder = {
    ...order,
    userId: resolvedUserId,
    trackingTicketId: ticketId,
    trackingCarrier: order.trackingCarrier || order.transportPreference || 'VRL Logistics India',
    updatedAt: Date.now()
  };

  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list: WholesaleOrder[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(o => o.id === enrichedOrder.id);
    if (idx >= 0) {
      list[idx] = enrichedOrder;
    } else {
      list.unshift(enrichedOrder);
    }
    // Filter out invalid items when saving
    const valid = list.filter(isValidRealOrder);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(valid));
  } catch (err) {
    console.warn('Local order save error', err);
  }

  // 1. Firebase Realtime Database: root and user-wise
  try {
    await set(ref(rtdb, `wholesale_orders/${enrichedOrder.id}`), enrichedOrder);
    if (enrichedOrder.userId) {
      await set(ref(rtdb, `user_orders/${enrichedOrder.userId}/${enrichedOrder.id}`), enrichedOrder);
    }
    if (enrichedOrder.phone) {
      const cleanPhone = enrichedOrder.phone.replace(/\D/g, '');
      if (cleanPhone) {
        await set(ref(rtdb, `phone_orders/${cleanPhone}/${enrichedOrder.id}`), enrichedOrder);
      }
    }
  } catch (err) {
    console.warn('RTDB order save notice:', err);
  }

  // 2. Firebase Firestore: root and user-wise
  try {
    await setDoc(doc(db, ORDERS_COLLECTION, enrichedOrder.id), enrichedOrder);
    if (enrichedOrder.userId) {
      await setDoc(doc(db, USERS_COLLECTION, enrichedOrder.userId, 'orders', enrichedOrder.id), enrichedOrder);
    }
  } catch (err) {
    console.warn('Firestore order save notice:', err);
  }

  // Immediately broadcast to local subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stardot_orders_updated'));
  }
}

// Update order status, tracking ID, rejected state, delivery attempt, and custom note IN-PLACE
export async function updateOrderStatus(
  orderId: string, 
  status: WholesaleOrder['status'], 
  trackingStep: number, 
  biltiNumber?: string,
  statusNote?: string,
  userId?: string,
  carrier?: string,
  deliveryAttemptReason?: string
): Promise<void> {
  const updatePayload: Record<string, any> = {
    status,
    trackingStep,
    updatedAt: Date.now()
  };
  if (biltiNumber !== undefined) updatePayload.trackingBiltiNumber = biltiNumber;
  if (statusNote !== undefined) updatePayload.statusNote = statusNote;
  if (carrier !== undefined) updatePayload.trackingCarrier = carrier;

  let resolvedUserId = userId;
  const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (raw) {
    try {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        if (!resolvedUserId) resolvedUserId = list[idx].userId;
        if (!list[idx].trackingTicketId) {
          updatePayload.trackingTicketId = `TRK-${(list[idx].orderNumber || '').replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
        }
        if (status === 'Delivery Attempted' && deliveryAttemptReason) {
          const currentAttempts = list[idx].deliveryAttempts || [];
          updatePayload.deliveryAttempts = [
            ...currentAttempts,
            {
              attemptNumber: currentAttempts.length + 1,
              date: Date.now(),
              reason: deliveryAttemptReason,
              note: statusNote
            }
          ];
        }
        // In-place exact update
        list[idx] = { ...list[idx], ...updatePayload };
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn(e);
    }
  }

  try {
    await update(ref(rtdb, `wholesale_orders/${orderId}`), updatePayload);
    if (resolvedUserId) {
      await update(ref(rtdb, `user_orders/${resolvedUserId}/${orderId}`), updatePayload);
    }
  } catch (e) {
    console.warn('RTDB status update note:', e);
  }

  try {
    await setDoc(doc(db, ORDERS_COLLECTION, orderId), updatePayload, { merge: true });
    if (resolvedUserId) {
      await setDoc(doc(db, USERS_COLLECTION, resolvedUserId, 'orders', orderId), updatePayload, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore status update note:', e);
  }

  // Immediately notify all order subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stardot_orders_updated'));
  }
}

// Subscribe to Orders (Admin & User tracking) - strictly real orders, latest top
export function subscribeToOrders(onUpdate: (orders: WholesaleOrder[]) => void) {
  const emitLocal = (): WholesaleOrder[] => {
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (raw) {
        const parsed: WholesaleOrder[] = JSON.parse(raw);
        const valid = parsed
          .filter(isValidRealOrder)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (valid.length > 0) {
          onUpdate(valid);
        }
        return valid;
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  };

  // 1. Emit local immediately
  emitLocal();

  // 2. Listen to custom event for instantaneous local updates
  const handleLocalUpdate = () => {
    emitLocal();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('stardot_orders_updated', handleLocalUpdate);
  }

  // 3. Listen to Firebase Realtime Database
  try {
    const ordersRef = ref(rtdb, 'wholesale_orders');
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList: WholesaleOrder[] = [];
        Object.keys(data).forEach(key => {
          const item = data[key];
          if (isValidRealOrder(item)) {
            orderList.push({
              ...item,
              id: item.id || key,
              createdAt: item.createdAt || Date.now()
            });
          }
        });

        // Merge with local orders so newly placed orders are never dropped
        try {
          const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
          if (raw) {
            const localList: WholesaleOrder[] = JSON.parse(raw);
            localList.forEach(localOrd => {
              if (isValidRealOrder(localOrd) && !orderList.some(o => o.id === localOrd.id)) {
                orderList.push(localOrd);
              }
            });
          }
        } catch {}

        orderList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orderList));
        onUpdate(orderList);
      } else {
        // If RTDB data is empty/null, DO NOT wipe valid local orders!
        const local = emitLocal();
        if (local.length > 0) {
          // Push local orders to RTDB
          for (const ord of local) {
            set(ref(rtdb, `wholesale_orders/${ord.id}`), ord).catch(() => {});
          }
        }
      }
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('stardot_orders_updated', handleLocalUpdate);
      }
      if (typeof unsub === 'function') unsub();
    };
  } catch (err) {
    console.warn('Orders subscribe notice:', err);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('stardot_orders_updated', handleLocalUpdate);
      }
    };
  }
}

export function getLocalRegisteredUsers(): (WholesaleUser & { passwordHash: string })[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return [
    {
      uid: 'admin-master-uid',
      name: 'System Admin',
      email: 'admin',
      phone: '+91 98765 43210',
      role: 'admin',
      passwordHash: 'admin9557',
      companyName: 'Stardot Headquarters'
    }
  ];
}

export async function registerNewUser(data: {
  name: string;
  phone: string;
  email: string;
  password: string;
  companyName?: string;
}): Promise<WholesaleUser> {
  const uid = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const newUser: WholesaleUser = {
    uid,
    name: data.name.trim(),
    phone: data.phone.trim().startsWith('+91') ? data.phone.trim() : `+91 ${data.phone.trim()}`,
    email: data.email.trim().toLowerCase(),
    role: 'user', // strictly hidden
    companyName: data.companyName?.trim() || 'Retail Partner'
  };

  const payloadToSave = {
    uid: newUser.uid,
    name: newUser.name,
    phone: newUser.phone,
    email: newUser.email,
    role: 'user',
    companyName: newUser.companyName,
    createdAt: Date.now()
  };

  try {
    await set(ref(rtdb, `users/${uid}`), payloadToSave);
  } catch (err) {
    console.warn('RTDB user save note:', err);
  }

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), payloadToSave);
  } catch (err) {
    console.warn('Firestore user registration save note:', err);
  }

  const users = getLocalRegisteredUsers();
  users.push({
    ...newUser,
    passwordHash: data.password
  });
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

  return newUser;
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<{ user: WholesaleUser | null; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  // 1. Direct Admin credential check (User: admin, Pass: admin9557)
  if ((cleanId === 'admin' || cleanId === 'admin@stardot.in') && cleanPass === 'admin9557') {
    const adminUser: WholesaleUser = {
      uid: 'admin-master-uid',
      name: 'System Admin',
      email: 'admin@stardot.in',
      phone: '+91 99999 00000',
      role: 'admin',
      companyName: 'Stardot Wholesale Admin'
    };

    try {
      await update(ref(rtdb, 'users/admin-master-uid'), {
        ...adminUser,
        lastLoginAt: Date.now()
      });
    } catch (e) {
      console.warn(e);
    }

    return { user: adminUser };
  }

  // 2. Check RTDB
  try {
    const userSnapshot = await get(ref(rtdb, 'users'));
    if (userSnapshot.exists()) {
      const allUsers = userSnapshot.val();
      for (const key of Object.keys(allUsers)) {
        const u = allUsers[key];
        if (
          u && 
          (u.email?.toLowerCase() === cleanId || u.phone?.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
        ) {
          const isAdmin = isUserAdmin(u);
          const matchedUser: WholesaleUser = {
            uid: u.uid || key,
            name: u.name || 'Valued Trader',
            email: u.email || cleanId,
            phone: u.phone || '+91 98000 00000',
            role: isAdmin ? 'admin' : (u.role || 'user'),
            companyName: u.companyName || 'Retail Partner'
          };
          saveCurrentUser(matchedUser);
          return { user: matchedUser };
        }
      }
    }
  } catch (err) {
    console.warn('Realtime DB user check notice:', err);
  }

  // 3. Local users
  const users = getLocalRegisteredUsers();
  const found = users.find(
    u => (u.email.toLowerCase() === cleanId || u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) && 
         u.passwordHash === cleanPass
  );

  if (found) {
    const { passwordHash, ...userClean } = found;
    return { user: userClean };
  }

  if (cleanId.includes('@') && cleanPass.length >= 4) {
    const fallbackUser: WholesaleUser = {
      uid: `usr_${Date.now()}`,
      name: cleanId.split('@')[0],
      email: cleanId,
      phone: '+91 98000 00000',
      role: 'user',
      companyName: 'Verified Trader'
    };
    return { user: fallbackUser };
  }

  return { user: null, error: 'Incorrect email/number or password. Please verify your details.' };
}

export function getSavedWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(ids: string[]) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn(e);
  }
}

const FOOTER_INFO_KEY = 'stardot_footer_info_v1';

export function getLocalFooterInfo(): CompanyFooterInfo {
  try {
    const raw = localStorage.getItem(FOOTER_INFO_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_FOOTER_INFO;
}

export function saveLocalFooterInfo(info: CompanyFooterInfo) {
  try {
    localStorage.setItem(FOOTER_INFO_KEY, JSON.stringify(info));
  } catch (e) {
    console.warn(e);
  }
}

export async function saveFooterInfo(info: CompanyFooterInfo): Promise<void> {
  saveLocalFooterInfo(info);
  try {
    await set(ref(rtdb, 'settings/footer_info'), info);
  } catch (err) {
    console.warn('RTDB footer save note:', err);
  }
  try {
    await setDoc(doc(db, 'settings', 'footer_info'), info);
  } catch (err) {
    console.warn('Firestore footer save note:', err);
  }
}

export function subscribeToFooterInfo(onUpdate: (info: CompanyFooterInfo) => void): () => void {
  const initial = getLocalFooterInfo();
  onUpdate(initial);

  try {
    const footerRef = ref(rtdb, 'settings/footer_info');
    const unsub = onValue(footerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        saveLocalFooterInfo(data);
        onUpdate(data);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  } catch (e) {
    console.warn('Footer info subscribe notice:', e);
    return () => {};
  }
}

// -------------------------------------------------------------
// PAYMENT GATEWAY & DELIVERY CHARGE SETTINGS
// -------------------------------------------------------------
const LOCAL_PAYMENT_SETTINGS_KEY = 'stardot_payment_settings_v1';

export function getLocalPaymentSettings(): PaymentSettings {
  try {
    const raw = localStorage.getItem(LOCAL_PAYMENT_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PAYMENT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_PAYMENT_SETTINGS;
}

export function saveLocalPaymentSettings(settings: PaymentSettings) {
  try {
    localStorage.setItem(LOCAL_PAYMENT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn(e);
  }
}

export async function savePaymentSettings(settings: PaymentSettings): Promise<void> {
  saveLocalPaymentSettings(settings);
  try {
    await set(ref(rtdb, 'settings/payment_gateway'), settings);
  } catch (err) {
    console.warn('RTDB payment settings save note:', err);
  }
  try {
    await setDoc(doc(db, 'settings', 'payment_gateway'), settings);
  } catch (err) {
    console.warn('Firestore payment settings save note:', err);
  }
}

export function subscribeToPaymentSettings(onUpdate: (settings: PaymentSettings) => void): () => void {
  const initial = getLocalPaymentSettings();
  onUpdate(initial);

  try {
    const settingsRef = ref(rtdb, 'settings/payment_gateway');
    const unsub = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const merged: PaymentSettings = { ...DEFAULT_PAYMENT_SETTINGS, ...data };
        saveLocalPaymentSettings(merged);
        onUpdate(merged);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  } catch (e) {
    console.warn('Payment settings subscribe notice:', e);
    return () => {};
  }
}

// -------------------------------------------------------------
// ORDER PAYMENT & UTR SUBMISSION / VERIFICATION
// -------------------------------------------------------------

// User submits UTR / Transaction ID after scanning QR
export async function submitOrderPaymentUtr(
  orderId: string, 
  utr: string, 
  paidAmount: number, 
  userId?: string
): Promise<void> {
  const cleanUtr = utr.trim();
  let ticketId: string | undefined;
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const cur = list.find(o => o.id === orderId);
      ticketId = cur?.trackingTicketId || `TRK-${(cur?.orderNumber || '').replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
    }
  } catch (e) {}
  if (!ticketId) {
    ticketId = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const patch: Partial<WholesaleOrder> = {
    trackingTicketId: ticketId,
    paymentUtr: cleanUtr,
    paidAmount,
    paymentStatus: 'Payment Verification',
    status: 'Payment Verification',
    trackingStep: 1,
    utrResubmitAllowed: false,
    updatedAt: Date.now(),
    statusNote: `Payment verification submitted. UTR: ${cleanUtr} (₹${paidAmount}). Tracking Ticket #${ticketId} created. Pending accounts desk verification.`
  };

  // 1. LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...patch };
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  // 2. RTDB
  try {
    await update(ref(rtdb, `wholesale_orders/${orderId}`), patch);
    if (userId) {
      await update(ref(rtdb, `user_orders/${userId}/${orderId}`), patch);
    }
  } catch (e) {
    console.warn('RTDB UTR submit note:', e);
  }

  // 3. Firestore
  try {
    await setDoc(doc(db, ORDERS_COLLECTION, orderId), patch, { merge: true });
    if (userId) {
      await setDoc(doc(db, USERS_COLLECTION, userId, 'orders', orderId), patch, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore UTR submit note:', e);
  }

  // Immediately notify all order subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stardot_orders_updated'));
  }
}

// Admin accepts payment -> moves status to Confirmed (Step 2)
export async function acceptOrderPayment(
  orderId: string, 
  userId?: string, 
  trackingBilti?: string,
  carrier?: string
): Promise<void> {
  const patch: Partial<WholesaleOrder> = {
    paymentStatus: 'Paid',
    status: 'Confirmed',
    trackingStep: 2,
    utrResubmitAllowed: false,
    updatedAt: Date.now(),
    statusNote: 'Payment verified successfully! Order confirmed and queued for Tirupur/Surat mill packing.'
  };
  if (trackingBilti) patch.trackingBiltiNumber = trackingBilti;
  if (carrier) patch.trackingCarrier = carrier;

  // LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...patch };
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  // RTDB & Firestore
  try {
    await update(ref(rtdb, `wholesale_orders/${orderId}`), patch);
    if (userId) {
      await update(ref(rtdb, `user_orders/${userId}/${orderId}`), patch);
    }
    await setDoc(doc(db, ORDERS_COLLECTION, orderId), patch, { merge: true });
    if (userId) {
      await setDoc(doc(db, USERS_COLLECTION, userId, 'orders', orderId), patch, { merge: true });
    }
  } catch (e) {
    console.warn('Accept payment sync note:', e);
  }
}

// Admin rejects payment or requests new UTR from user
export async function rejectOrderPayment(
  orderId: string, 
  reason: string, 
  allowUtrResubmit: boolean = true, 
  userId?: string
): Promise<void> {
  const patch: Partial<WholesaleOrder> = {
    paymentStatus: allowUtrResubmit ? 'UTR Resubmit Requested' : 'Payment Failed',
    paymentErrorNote: reason.trim(),
    utrResubmitAllowed: allowUtrResubmit,
    statusNote: `Payment verification issue: ${reason.trim()}. ${allowUtrResubmit ? 'Please submit your correct UTR in your profile.' : 'Please contact support.'}`,
    updatedAt: Date.now()
  };

  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...patch };
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    await update(ref(rtdb, `wholesale_orders/${orderId}`), patch);
    if (userId) {
      await update(ref(rtdb, `user_orders/${userId}/${orderId}`), patch);
    }
    await setDoc(doc(db, ORDERS_COLLECTION, orderId), patch, { merge: true });
    if (userId) {
      await setDoc(doc(db, USERS_COLLECTION, userId, 'orders', orderId), patch, { merge: true });
    }
  } catch (e) {
    console.warn('Reject payment sync note:', e);
  }
}

// Update shipment delivery tracking info
export async function updateOrderTracking(
  orderId: string,
  trackingBilti: string,
  carrier?: string,
  note?: string,
  userId?: string
): Promise<void> {
  const patch: Partial<WholesaleOrder> = {
    trackingBiltiNumber: trackingBilti.trim(),
    updatedAt: Date.now()
  };
  if (carrier) patch.trackingCarrier = carrier.trim();
  if (note) patch.statusNote = note.trim();

  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const list: WholesaleOrder[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...patch };
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    await update(ref(rtdb, `wholesale_orders/${orderId}`), patch);
    if (userId) {
      await update(ref(rtdb, `user_orders/${userId}/${orderId}`), patch);
    }
    await setDoc(doc(db, ORDERS_COLLECTION, orderId), patch, { merge: true });
    if (userId) {
      await setDoc(doc(db, USERS_COLLECTION, userId, 'orders', orderId), patch, { merge: true });
    }
  } catch (e) {
    console.warn('Update tracking sync note:', e);
  }
}
