// =============================================
// TOKOKU CONFIG — UPDATE SESUAI KEBUTUHAN
// =============================================

export const CONFIG = {
  // Google Apps Script Web App URL
  GAS_URL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',

  // Livekit
  LIVEKIT_URL: 'wss://exora-85vdrsxe.livekit.cloud',
  LIVEKIT_API_KEY: 'API8L7e9n2Kwu6W',
  LIVEKIT_API_SECRET: 'qIWnbZosENTeUO9PFqMUqi0Xp8DWeqavM3VpF8Hw2f5B',
  
  // Google OAuth Client ID
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // Google Analytics
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || '',

  // Nomor WA Admin (format: 628xxx tanpa +)
  ADMIN_WA: import.meta.env.VITE_ADMIN_WA || '6283879527517',

  // App info
  APP_NAME: 'Exora',
  APP_TAGLINE: 'Buka toko online gratis, terima pesanan via WhatsApp',
  APP_URL: import.meta.env.VITE_APP_URL || 'https://myexora.com',

  // Batas produk untuk free plan (legacy)
  FREE_PRODUCT_LIMIT: 25,

  // =============================================
  // HARGA PLANS (untuk ditampilkan di UI)
  // =============================================
  STARTER_PRICE: 'Rp 39.000/bulan',
  PRO_PRICE: 'Rp 59.000/bulan',
  BUSINESS_PRICE: 'Rp 79.000/bulan',
  NEXT_PRICE: 'Rp 79.000/bulan',
  
  // Shipping & AI APIs
  BITESHIP_KEY: 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiRXhvcmEiLCJ1c2VySWQiOiI2YTJhZmJiZGEyZTlhZjRjMzMyM2YzYTAiLCJpYXQiOjE3ODEyMDc2ODV9.jUyJf6vfA_Z51r7IfOXAlHTkFhIQ1X18HyLw15bsdok',
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY,
  GROQ_SHOWCASE_KEY: import.meta.env.VITE_GROQ_SHOWCASE_KEY, 
  GROQ_PRODUK_KEY: import.meta.env.VITE_GROQ_PRODUK_KEY,
  GROQ_KEYS: [],
  GROQ_MODELS: [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
  ],

  // =============================================
  // STRUKTUR TIER (4 Tiers)
  // =============================================
  TIERS: {
    FREE: {
      id: 'free',
      name: 'Free',
      price: 0,
      maxProducts: 25,
      maxImagesPerProduct: 2,
      maxToko: 1,
      features: ['Dasar', '2 Foto/Produk', '1 Toko'],
      color: 'gray'
    },
    STARTER: {
      id: 'starter',
      name: 'Starter',
      price: 29000,
      maxProducts: 100,
      maxImagesPerProduct: 5,
      maxToko: 1,
      features: ['100 Produk', '5 Foto/Produk', 'Stream Posting', 'Analitik Mingguan', '50 Query AI'],
      color: 'blue'
    },
    PRO: {
      id: 'pro',
      name: 'Pro',
      price: 49000,
      maxProducts: -1, // Unlimited
      maxImagesPerProduct: -1, // Unlimited
      maxToko: 1,
      features: ['Produk Unlimited', 'Foto Unlimited', '3 Pin Post', 'Analitik Lengkap', '500 Query AI', 'Badge Verified'],
      color: 'purple'
    },
    BUSINESS: {
      id: 'business',
      name: 'Business',
      price: 99000,
      maxProducts: -1, // Unlimited
      maxImagesPerProduct: -1, // Unlimited
      maxToko: 5,
      features: ['5 Toko', 'Pin Unlimited', 'Analitik Lanjut', 'AI Unlimited', 'Custom Domain', '5 Akun Staff'],
      color: 'green'
    }
  }
};

// =============================================
// TIER HELPERS
// =============================================

// Urutan tingkatan tier (dari terendah ke tertinggi)
export const TIER_ORDER = ['FREE', 'STARTER', 'PRO', 'BUSINESS'];

// Helper untuk mendapatkan level tier (index)
export const getTierLevel = (tierName) => {
  if (!tierName) return 0;
  const upperName = String(tierName).toUpperCase();
  const index = TIER_ORDER.indexOf(upperName);
  return index === -1 ? 0 : index;
};

// Cek apakah user punya akses ke fitur tertentu berdasarkan level tier
export const hasAccessToFeature = (userTier, requiredTier) => {
  return getTierLevel(userTier) >= getTierLevel(requiredTier);
};

// Dapatkan batas produk berdasarkan tier
export const getProductLimit = (tierName) => {
  const tier = CONFIG.TIERS[String(tierName).toUpperCase()];
  return tier ? tier.maxProducts : CONFIG.TIERS.FREE.maxProducts;
};

// Cek apakah user melebihi batas produk
export const checkProductLimit = (currentCount, tierName) => {
  const limit = getProductLimit(tierName);
  if (limit === -1) return true; // Unlimited
  return currentCount < limit;
};

// Dapatkan tier berikutnya untuk upgrade
export const getNextPlan = (currentTierName) => {
  const currentIndex = getTierLevel(currentTierName);
  if (currentIndex >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[currentIndex + 1];
};

// Dapatkan warna badge untuk tier
export const getPlanBadgeColor = (tierName) => {
  const tier = CONFIG.TIERS[String(tierName).toUpperCase()];
  return tier ? tier.color : 'gray';
};

// Dapatkan nama tampilan tier
export const getPlanDisplayName = (tierName) => {
  const tier = CONFIG.TIERS[String(tierName).toUpperCase()];
  return tier ? tier.name : 'Free';
};

// Cek apakah user adalah Pro atau lebih tinggi
export const isPro = (tierName) => getTierLevel(tierName) >= getTierLevel('PRO');

// Cek apakah user adalah Starter atau lebih tinggi
export const isStarter = (tierName) => getTierLevel(tierName) >= getTierLevel('STARTER');

// Cek apakah user adalah Business
export const isBusiness = (tierName) => getTierLevel(tierName) >= getTierLevel('BUSINESS');

// =============================================
// PLAN FEATURES (Backward Compatibility)
// =============================================

export const PLAN_FEATURES = {
  // Format lowercase - untuk komponen lama
  free: {
    name: 'Free',
    price: 'Rp 0',
    color: 'var(--text-secondary)',
    features: CONFIG.TIERS.FREE.features,
    limits: ['Tidak ada custom domain', 'Tema terbatas', 'Tanpa analytics lanjut']
  },
  starter: {
    name: 'Starter',
    price: CONFIG.STARTER_PRICE,
    color: '#3B82F6',
    features: CONFIG.TIERS.STARTER.features,
    limits: []
  },
  pro: {
    name: 'Pro',
    price: CONFIG.PRO_PRICE,
    color: 'var(--accent)',
    features: CONFIG.TIERS.PRO.features,
    limits: []
  },
  business: {
    name: 'Business',
    price: CONFIG.BUSINESS_PRICE,
    color: '#10B981',
    features: CONFIG.TIERS.BUSINESS.features,
    limits: []
  },
  
  // Format uppercase - untuk komponen baru
  FREE: CONFIG.TIERS.FREE.features,
  STARTER: CONFIG.TIERS.STARTER.features,
  PRO: CONFIG.TIERS.PRO.features,
  BUSINESS: CONFIG.TIERS.BUSINESS.features
};
