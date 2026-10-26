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
import { Product, WholesaleOrder, WholesaleUser, CategoryItem, CompanyFooterInfo, HeroSlide } from '../types.ts';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, DEFAULT_FOOTER_INFO, DEFAULT_HERO_SLIDES } from '../data/defaultProducts.ts';

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

// Save Wholesale Order user-wise & in root collection
export async function createWholesaleOrder(order: WholesaleOrder): Promise<void> {
  const enrichedOrder: WholesaleOrder = {
    ...order,
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
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
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
}

// Update order status, tracking ID, rejected state, delivery attempt, and custom note
export async function updateOrderStatus(
  orderId: string, 
  status: WholesaleOrder['status'], 
  trackingStep: number, 
  biltiNumber?: string,
  statusNote?: string,
  userId?: string
): Promise<void> {
  const updatePayload: Record<string, any> = {
    status,
    trackingStep,
    updatedAt: Date.now()
  };
  if (biltiNumber !== undefined) updatePayload.trackingBiltiNumber = biltiNumber;
  if (statusNote !== undefined) updatePayload.statusNote = statusNote;

  let resolvedUserId = userId;
  const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (raw) {
    const list: WholesaleOrder[] = JSON.parse(raw);
    const idx = list.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updatePayload };
      if (!resolvedUserId) resolvedUserId = list[idx].userId;
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
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
}

// Subscribe to Orders (Admin & User tracking)
export function subscribeToOrders(onUpdate: (orders: WholesaleOrder[]) => void) {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      onUpdate(JSON.parse(raw));
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    const ordersRef = ref(rtdb, 'wholesale_orders');
    return onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList: WholesaleOrder[] = [];
        Object.keys(data).forEach(key => {
          if (data[key]) orderList.push(data[key]);
        });
        orderList.sort((a, b) => b.createdAt - a.createdAt);
        if (orderList.length > 0) {
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orderList));
          onUpdate(orderList);
        }
      }
    });
  } catch (err) {
    console.warn('Orders subscribe notice:', err);
    return () => {};
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
          const matchedUser: WholesaleUser = {
            uid: u.uid || key,
            name: u.name || 'Valued Trader',
            email: u.email || cleanId,
            phone: u.phone || '+91 98000 00000',
            role: (u.role as 'user' | 'admin') || 'user',
            companyName: u.companyName || 'Retail Partner'
          };
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
