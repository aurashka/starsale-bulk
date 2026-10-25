import { Product } from '../types.ts';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-heavy-sweater',
    name: 'Heavyweight Ribbed Oversized Sweater',
    category: 'Sweaters',
    subCategory: 'Knitwear',
    sku: 'STD-SW-9901',
    basePrice: 799,
    moq: 10,
    stock: 1450,
    description: 'Premium drop-shoulder waffle rib knit sweater. High-demand winter inventory for fashion retailers and online stores. Machine-washable with anti-shrink yarn.',
    material: '70% Recycled Cotton, 30% Merino Wool (480 GSM)',
    colors: ['Oatmeal Heather', 'Charcoal Grey', 'Stone Taupe', 'Jet Black'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=1000&q=80'
    ],
    isNew: true,
    isTrending: true,
    isFeatured: true,
    bulkTiers: [
      { minQty: 10, maxQty: 49, unitPrice: 749, label: 'Tier 1 (10-49 pcs)' },
      { minQty: 50, maxQty: 99, unitPrice: 689, label: 'Tier 2 (50-99 pcs)' },
      { minQty: 100, unitPrice: 599, label: 'Tier 3 (100+ pcs bulk)' }
    ]
  },
  {
    id: 'prod-ashwave-denim',
    name: 'Ashwave Heavy Acid Washed Denim Jacket',
    category: 'Jackets',
    subCategory: 'Outerwear',
    sku: 'STD-JK-4412',
    basePrice: 1299,
    moq: 5,
    stock: 620,
    description: 'Heavy 14.5 oz ring-spun cotton denim jacket with antique brass rivets and dual flap chest pockets. Top trending outerwear item across Indian retail boutiques.',
    material: '100% Ring-Spun Cotton Denim (14.5 oz Heavyweight)',
    colors: ['Washed Sand', 'Vintage Indigo', 'Faded Charcoal'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80'
    ],
    isNew: true,
    isTrending: true,
    isFeatured: true,
    bulkTiers: [
      { minQty: 5, maxQty: 24, unitPrice: 1199, label: 'Tier 1 (5-24 pcs)' },
      { minQty: 25, maxQty: 49, unitPrice: 1080, label: 'Tier 2 (25-49 pcs)' },
      { minQty: 50, unitPrice: 950, label: 'Tier 3 (50+ pcs bulk)' }
    ]
  },
  {
    id: 'prod-striped-work-shirt',
    name: 'Carhartt Style Chalk Stripe Heavy Shirt',
    category: 'Shirts',
    subCategory: 'Tops',
    sku: 'STD-SH-8834',
    basePrice: 599,
    moq: 15,
    stock: 2200,
    description: 'Structured short-sleeve resort workwear shirt with dual button flaps and vertical chalk pinstripes. Premium linen-cotton blend suited for Indian all-season wear.',
    material: '65% Combed Cotton, 35% Linen Canvas (240 GSM)',
    colors: ['Chalk Grey Striped', 'Vintage Sky Blue', 'Olive Ecru'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=80'
    ],
    isTrending: true,
    bulkTiers: [
      { minQty: 15, maxQty: 49, unitPrice: 549, label: 'Tier 1 (15-49 pcs)' },
      { minQty: 50, maxQty: 99, unitPrice: 489, label: 'Tier 2 (50-99 pcs)' },
      { minQty: 100, unitPrice: 420, label: 'Tier 3 (100+ pcs bulk)' }
    ]
  },
  {
    id: 'prod-fleece-hoodie-450',
    name: 'Heavyweight Loopback Fleece Hoodie 450 GSM',
    category: 'Hoodies',
    subCategory: 'Fleece',
    sku: 'STD-HD-5520',
    basePrice: 899,
    moq: 10,
    stock: 2800,
    description: 'The heavyweight blank trusted by top D2C streetwear labels in India. Double-lined hood without drawstrings, French terry interior, seamless kangaroo pouch.',
    material: '100% Combed Organic Cotton Fleece (450 GSM Heavy)',
    colors: ['Washed Black', 'Bone White', 'Dust Sage', 'Mocha Brown'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1000&q=80'
    ],
    isFeatured: true,
    isTrending: true,
    bulkTiers: [
      { minQty: 10, maxQty: 49, unitPrice: 820, label: 'Tier 1 (10-49 pcs)' },
      { minQty: 50, maxQty: 99, unitPrice: 740, label: 'Tier 2 (50-99 pcs)' },
      { minQty: 100, unitPrice: 650, label: 'Tier 3 (100+ pcs bulk)' }
    ]
  },
  {
    id: 'prod-baggy-denim-jeans',
    name: 'Wide-Leg Skater Washed Baggy Jeans',
    category: 'Pants',
    subCategory: 'Bottoms',
    sku: 'STD-PT-7721',
    basePrice: 849,
    moq: 10,
    stock: 1100,
    description: 'Relaxed baggy silhouette with stacked hems and vintage whiskering. Heavy cotton twill built to last. Highly sought after by Gen-Z retail shoppers.',
    material: '100% Heavy Cotton Denim (13.8 oz)',
    colors: ['Dirty Wash Tan', 'Faded Stone Blue', 'Washed Jet'],
    sizes: ['30', '32', '34', '36', '38'],
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1000&q=80'
    ],
    isTrending: true,
    bulkTiers: [
      { minQty: 10, maxQty: 29, unitPrice: 780, label: 'Tier 1 (10-29 pcs)' },
      { minQty: 30, maxQty: 74, unitPrice: 710, label: 'Tier 2 (30-74 pcs)' },
      { minQty: 75, unitPrice: 620, label: 'Tier 3 (75+ pcs bulk)' }
    ]
  },
  {
    id: 'prod-blue-striped-oxford',
    name: 'Blue Resort Striped Boxy Camp Shirt',
    category: 'Shirts',
    subCategory: 'Tops',
    sku: 'STD-SH-3109',
    basePrice: 549,
    moq: 12,
    stock: 1350,
    description: 'Cobalt and white vertical resort stripe shirt with relaxed camp collar. Pre-washed for super soft handfeel.',
    material: '100% Combed Cotton Poplin (190 GSM)',
    colors: ['Cobalt White Stripe', 'Sage Cream Stripe', 'Onyx Monochrome'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=1000&q=80'
    ],
    bulkTiers: [
      { minQty: 12, maxQty: 39, unitPrice: 499, label: 'Tier 1 (12-39 pcs)' },
      { minQty: 40, maxQty: 99, unitPrice: 440, label: 'Tier 2 (40-99 pcs)' },
      { minQty: 100, unitPrice: 380, label: 'Tier 3 (100+ pcs bulk)' }
    ]
  },
  {
    id: 'prod-sneakers-tc79',
    name: 'Retro Court Low-Top Casual Sneakers',
    category: 'Shoes',
    subCategory: 'Footwear',
    sku: 'STD-SN-1200',
    basePrice: 999,
    moq: 8,
    stock: 750,
    description: 'Low-profile court sneakers with vulcanized rubber outsoles and memory foam footbeds. Shipped in sturdy retail master cartons.',
    material: 'Full Grain Vegan Napa & Vulcanized Rubber',
    colors: ['Off-White / Olive', 'Triple White', 'Panda Black/White'],
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80'
    ],
    bulkTiers: [
      { minQty: 8, maxQty: 23, unitPrice: 920, label: 'Tier 1 (8-23 pairs)' },
      { minQty: 24, maxQty: 49, unitPrice: 840, label: 'Tier 2 (24-49 pairs)' },
      { minQty: 50, unitPrice: 720, label: 'Tier 3 (50+ pairs bulk)' }
    ]
  },
  {
    id: 'prod-retro-beanie-cap',
    name: 'English Rib Knit Fisherman Beanie',
    category: 'Hats',
    subCategory: 'Accessories',
    sku: 'STD-AC-9011',
    basePrice: 199,
    moq: 25,
    stock: 3500,
    description: 'Dense 7-gauge English rib knit watch cap. High margin accessory for billing counter displays and winter bundles.',
    material: '50% Merino Wool Feel Acrylic, 50% Cotton',
    colors: ['Oatmeal', 'Espresso', 'Forest Green', 'Black'],
    sizes: ['Free Size (Stretch Unisex)'],
    images: [
      'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=1000&q=80'
    ],
    bulkTiers: [
      { minQty: 25, maxQty: 99, unitPrice: 175, label: 'Tier 1 (25-99 pcs)' },
      { minQty: 100, maxQty: 249, unitPrice: 145, label: 'Tier 2 (100-249 pcs)' },
      { minQty: 250, unitPrice: 115, label: 'Tier 3 (250+ pcs bulk)' }
    ]
  }
];

export const CATEGORIES = [
  { id: 'all', name: 'All Wholesale Lots', count: 8 },
  { id: 'Sweaters', name: 'Knitwear & Sweaters', count: 1 },
  { id: 'Jackets', name: 'Denim & Heavy Jackets', count: 1 },
  { id: 'Shirts', name: 'Casual & Workwear Shirts', count: 2 },
  { id: 'Hoodies', name: 'Fleece Hoodies (450 GSM)', count: 1 },
  { id: 'Pants', name: 'Skater Denim & Cargo', count: 1 },
  { id: 'Shoes', name: 'Court Sneakers', count: 1 },
  { id: 'Hats', name: 'Beanies & Caps', count: 1 }
];

export const SAMPLE_IMAGE_PRESETS = [
  { label: 'Beige Oversized Knitwear', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Heavy Washed Denim Jacket', url: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Striped Resort Shirt', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80' },
  { label: '450 GSM Fleece Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Baggy Skater Denim', url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Vintage Court Sneakers', url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Watch Beanie', url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Boxy Heavy Tee 280 GSM', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80' }
];
