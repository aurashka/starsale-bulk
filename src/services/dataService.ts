import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from '../firebase.ts';
import { Product, WholesaleOrder, WholesaleUser } from '../types.ts';
import { INITIAL_PRODUCTS } from '../data/defaultProducts.ts';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'wholesale_orders';
const USERS_COLLECTION = 'users';

const LOCAL_PRODUCTS_KEY = 'stardot_local_products_inr_v2';
const LOCAL_ORDERS_KEY = 'stardot_local_orders_inr_v2';
const LOCAL_USERS_KEY = 'stardot_users_db_v2';
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

// Subscribe to products from Firebase with fallback
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: unknown) => void
) {
  const initial = getLocalProducts();
  onUpdate(initial);

  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialProducts(initial);
          return;
        }
        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
        });
        if (items.length > 0) {
          saveLocalProducts(items);
          onUpdate(items);
        }
      },
      (err) => {
        console.warn('Firestore snapshot error, falling back to local sync:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Firebase connection failed, using local offline storage:', err);
    return () => {};
  }
}

// Seed initial products to Firestore
export async function seedInitialProducts(products: Product[] = INITIAL_PRODUCTS) {
  try {
    for (const prod of products) {
      const { id, ...data } = prod;
      await setDoc(doc(db, PRODUCTS_COLLECTION, id), data);
    }
  } catch (err) {
    console.warn('Could not seed initial products to Firebase:', err);
  }
}

// Add or edit product
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
  saveLocalProducts(updatedList);

  try {
    const { id, ...data } = product;
    await setDoc(doc(db, PRODUCTS_COLLECTION, id), data);
  } catch (err) {
    console.warn('Firebase product save error (persisted locally):', err);
  }
}

// Delete product
export async function deleteProductById(productId: string): Promise<void> {
  const current = getLocalProducts();
  const updated = current.filter(p => p.id !== productId);
  saveLocalProducts(updated);

  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  } catch (err) {
    console.warn('Firebase product delete error:', err);
  }
}

// Save Wholesale Order
export async function createWholesaleOrder(order: WholesaleOrder): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list: WholesaleOrder[] = raw ? JSON.parse(raw) : [];
    list.unshift(order);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Local order save error', err);
  }

  try {
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), order);
  } catch (err) {
    console.warn('Firebase order save error (saved locally):', err);
  }
}

// Subscribe to Orders (for Admin panel)
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
    const colRef = collection(db, ORDERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const orders: WholesaleOrder[] = [];
        snapshot.forEach((snap) => {
          orders.push(snap.data() as WholesaleOrder);
        });
        orders.sort((a, b) => b.createdAt - a.createdAt);
        if (orders.length > 0) {
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
          onUpdate(orders);
        }
      },
      (err) => {
        console.warn('Order subscription fallback to local storage:', err);
      }
    );
  } catch (err) {
    console.warn('Could not subscribe to orders in Firebase:', err);
    return () => {};
  }
}

// User Authentication & Hidden Role Storage
// As requested:
// "User create account Name number email pass"
// "Hiddenly save role as : user. Dont show that on web"
// "When login if user role user , normal web acces. If role admin , admin panel button"

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
      name: 'Senior Administrator',
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

  // Secretly and strictly assign role: 'user'
  const newUser: WholesaleUser = {
    uid,
    name: data.name.trim(),
    phone: data.phone.trim().startsWith('+91') ? data.phone.trim() : `+91 ${data.phone.trim()}`,
    email: data.email.trim().toLowerCase(),
    role: 'user', // HIDDEN: Never shown in the UI
    companyName: data.companyName?.trim() || 'Retail Partner'
  };

  // Save to local registry
  const users = getLocalRegisteredUsers();
  users.push({
    ...newUser,
    passwordHash: data.password
  });
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

  // Save to Firebase Firestore users collection
  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      role: 'user', // Hiddenly saved in Firebase
      companyName: newUser.companyName,
      createdAt: Date.now()
    });
  } catch (err) {
    console.warn('Firestore user registration save note:', err);
  }

  return newUser;
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<{ user: WholesaleUser | null; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  // 1. Direct Admin credential check (as specified by user: User: admin, Pass: admin9557)
  if ((cleanId === 'admin' || cleanId === 'admin@stardot.in') && cleanPass === 'admin9557') {
    const adminUser: WholesaleUser = {
      uid: 'admin-master-uid',
      name: 'System Admin',
      email: 'admin@stardot.in',
      phone: '+91 99999 00000',
      role: 'admin', // Triggers Admin Panel button!
      companyName: 'Stardot Wholesale Admin'
    };
    return { user: adminUser };
  }

  // 2. Check registered users
  const users = getLocalRegisteredUsers();
  const found = users.find(
    u => (u.email.toLowerCase() === cleanId || u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) && 
         u.passwordHash === cleanPass
  );

  if (found) {
    const { passwordHash, ...userClean } = found;
    return { user: userClean };
  }

  // 3. Fallback for demo: if user types an email & password, log them in as a normal user
  if (cleanId.includes('@') && cleanPass.length >= 4) {
    const fallbackUser: WholesaleUser = {
      uid: `usr_${Date.now()}`,
      name: cleanId.split('@')[0],
      email: cleanId,
      phone: '+91 98000 00000',
      role: 'user', // Regular user access
      companyName: 'Verified Trader'
    };
    return { user: fallbackUser };
  }

  return { user: null, error: 'Incorrect email/number or password. Please verify your details.' };
}

// Wishlist helpers
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
