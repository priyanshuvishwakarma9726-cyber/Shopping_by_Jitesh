import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface ProductSeedItem {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  salePrice: number | null;
  sku: string;
  brand: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  rating: number;
  reviews: number;
  tags: string[];
  imageUrl: string;
  stock: number;
}

// 5 Main Categories
const CATEGORIES = [
  {
    id: 'cat-1',
    parentId: null,
    name: 'Consumer Electronics',
    slug: 'electronics',
    description: 'Next-gen audio, smart wearables, monitors, computing accessories, and personal tech.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    icon: 'Laptop',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: 'cat-2',
    parentId: null,
    name: 'Apparel & Fashion',
    slug: 'apparel',
    description: 'Bespoke tailoring, luxury silk kurtas, designer outerwear, premium denim, and footwear.',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    icon: 'Shirt',
    isFeatured: true,
    sortOrder: 2,
  },
  {
    id: 'cat-3',
    parentId: null,
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Solid wood furniture, handcrafted ceramic decor, architectural lighting, and plush textiles.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
    icon: 'Home',
    isFeatured: true,
    sortOrder: 3,
  },
  {
    id: 'cat-4',
    parentId: null,
    name: 'Timepieces & Accessories',
    slug: 'watches-jewelry',
    description: 'Automatic chronographs, Italian leather goods, titanium eyewear, and handcrafted jewelry.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    icon: 'Watch',
    isFeatured: true,
    sortOrder: 4,
  },
  {
    id: 'cat-5',
    parentId: null,
    name: 'Beauty & Wellness',
    slug: 'wellness-gourmet',
    description: 'Ayurvedic formulations, clinical skincare, botanical perfumes, and single-estate teas.',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
    icon: 'Sparkles',
    isFeatured: true,
    sortOrder: 5,
  },
];

// Unsplash curated product images per category
const IMAGES_ELECTRONICS = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1609081219094-979a0446b738?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563770660941-20978e870e26?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1629429408209-1ab91295b30a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop',
];

const IMAGES_APPAREL = [
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop',
];

const IMAGES_HOME = [
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540518614846-7ede433c457b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?q=80&w=800&auto=format&fit=crop',
];

const IMAGES_WATCHES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1622434641406-a158123450f9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop',
];

const IMAGES_WELLNESS = [
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1608248597359-07f9c2d1b54a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
];

// Generate 1050 unique products
function generateCatalog(): ProductSeedItem[] {
  const products: ProductSeedItem[] = [];
  let globalIndex = 1000;

  // 1. Consumer Electronics (210 items)
  const elecTypes = [
    { prefix: 'Aura', item: 'Wireless ANC Headphones', desc: 'Studio grade active noise cancelling over-ear headphones with 40h battery.', minP: 7999, maxP: 24999 },
    { prefix: 'PulseFit', item: 'AMOLED Smartwatch', desc: 'Fitness and health tracker with SpO2, heart rate, and GPS navigation.', minP: 3499, maxP: 18999 },
    { prefix: 'SonicWave', item: 'True Wireless Earbuds', desc: 'Hi-Fi dual driver earbuds with transparency mode and IPX7 rating.', minP: 1999, maxP: 11999 },
    { prefix: 'VividView', item: '4K Ultra-HD Monitor', desc: 'IPS HDR professional calibrated display with Type-C 90W charging.', minP: 16999, maxP: 64999 },
    { prefix: 'ApexKey', item: 'Mechanical RGB Keyboard', desc: 'Hot-swappable tactile switch mechanical keyboard with PBT keycaps.', minP: 2499, maxP: 9999 },
    { prefix: 'HyperGlide', item: 'Wireless Gaming Mouse', desc: 'Ultralight 58g ergonomic mouse with 26000 DPI optical sensor.', minP: 1799, maxP: 6999 },
    { prefix: 'CinePro', item: 'Portable Full HD Projector', desc: '1080p native smart projector with auto keystone and Harman speakers.', minP: 12999, maxP: 42999 },
    { prefix: 'PowerVolt', item: '100W GaN Fast Charger', desc: 'Multi-port USB-C fast wall charger for laptops and mobile devices.', minP: 1499, maxP: 4999 },
    { prefix: 'NovaTab', item: '11-inch 2K Android Tablet', desc: 'Octa-core processing tablet with stylus pen support and quad speakers.', minP: 14999, maxP: 38999 },
    { prefix: 'AeroSound', item: 'Stereo Bluetooth Soundbar', desc: 'Spatial audio soundbar with wireless subwoofer and HDMI eARC.', minP: 4999, maxP: 22999 },
    { prefix: 'ProCam', item: '4K Action Camera', desc: 'Waterproof vlog camera with 6-axis gimbal stabilization and dual screens.', minP: 8999, maxP: 32999 },
    { prefix: 'MagCharge', item: '3-in-1 Magnetic Charging Stand', desc: 'Fast Qi2 charging dock for phone, smartwatch, and earbuds simultaneously.', minP: 2299, maxP: 6499 },
  ];
  const elecVariants = ['Pro', 'Elite', 'Max', 'Plus', 'Studio Edition', 'Carbon Black', 'Frost White', 'Titanium Edition', 'Ultra', 'Signature', 'V2', 'Prime', 'Nomad Edition', 'Xtreme', 'Stealth', 'Enterprise', 'Vanguard', 'Matrix', 'Zenith', 'Phantom'];
  const elecBrands = ['AuraTech', 'HyperSound', 'VividVision', 'ApexCraft', 'SonicPulse', 'NovaAudio', 'VoltPower', 'ProView', 'QuantumTech', 'AeroLab'];

  for (let i = 0; i < 210; i++) {
    globalIndex++;
    const t = elecTypes[i % elecTypes.length];
    const v = elecVariants[Math.floor(i / elecTypes.length) % elecVariants.length];
    const brand = elecBrands[i % elecBrands.length];
    const title = `${brand} ${t.prefix} ${t.item} ${v}`;
    const slug = `${brand.toLowerCase()}-${t.prefix.toLowerCase()}-${t.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${globalIndex}`;
    const basePrice = Math.round((t.minP + (i * 317) % (t.maxP - t.minP)) / 100) * 100 - 1;
    const hasDiscount = i % 2 === 0;
    const salePrice = hasDiscount ? Math.round(basePrice * (0.65 + (i % 30) * 0.01)) : null;
    const isFeatured = i % 5 === 0;
    const isBestSeller = i % 4 === 0;
    const img = IMAGES_ELECTRONICS[i % IMAGES_ELECTRONICS.length];

    products.push({
      id: `prod-${globalIndex}`,
      categoryId: 'cat-1',
      title,
      slug,
      shortDescription: `${t.desc} Precision engineered by ${brand}.`,
      description: `Experience premier performance with the ${title}. Built with cutting-edge engineering, premium components, and backed by a comprehensive 1-year brand warranty.`,
      basePrice,
      salePrice,
      sku: `SKU-EL-${globalIndex}`,
      brand,
      isFeatured,
      isNewArrival: i % 3 === 0,
      isBestSeller,
      rating: +(4.2 + (i % 8) * 0.1).toFixed(1),
      reviews: 15 + (i * 7) % 240,
      tags: ['electronics', 'gadgets', brand.toLowerCase(), t.prefix.toLowerCase()],
      imageUrl: img,
      stock: 15 + (i * 13) % 120,
    });
  }

  // 2. Apparel & Fashion (210 items)
  const fashTypes = [
    { prefix: 'Heritage', item: 'Mulberry Silk Kurta Set', desc: 'Handcrafted traditional ethnic wear with intricate zari thread embroidery.', minP: 3999, maxP: 18999 },
    { prefix: 'Milano', item: 'Italian Wool Double-Breasted Trench', desc: 'Tailored luxury outerwear crafted from fine Italian merino wool blend.', minP: 7999, maxP: 29999 },
    { prefix: 'Artisan', item: 'Selvedge Raw Denim Jeans', desc: 'Japanese shuttle-loom woven 14oz raw denim with custom brass hardware.', minP: 2999, maxP: 9999 },
    { prefix: 'Venezia', item: 'Pure French Linen Resort Shirt', desc: 'Relaxed fit breathable organic linen shirt ideal for tropical summers.', minP: 1899, maxP: 5999 },
    { prefix: 'Royal', item: 'Chanderi Handloom Saree', desc: 'Woven Banarasi border drape with gold and silver brocade motifs.', minP: 4999, maxP: 24999 },
    { prefix: 'Oxford', item: 'Slim Tailored Egyptian Cotton Shirt', desc: 'Crisp 120s two-ply organic cotton business shirt with mother-of-pearl buttons.', minP: 1999, maxP: 6499 },
    { prefix: 'Nomad', item: 'Full-Grain Leather Biker Jacket', desc: 'Hand-distressed genuine lambskin leather jacket with YKK brass zippers.', minP: 8999, maxP: 27999 },
    { prefix: 'Urban', item: 'Heavyweight Organic Cotton Hoodie', desc: '450 GSM French terry oversized streetwear hoodie with ribbed cuffs.', minP: 1899, maxP: 5499 },
    { prefix: 'Aura', item: 'Minimalist Italian Leather Sneakers', desc: 'Handcrafted low-top sneakers in supple calfskin with Margom rubber soles.', minP: 3499, maxP: 12999 },
    { prefix: 'Classic', item: 'Cashmere Wool Crewneck Sweater', desc: 'Ultra-soft grade-A Mongolian cashmere knit designed for timeless elegance.', minP: 4999, maxP: 16999 },
    { prefix: 'Savile', item: 'Bespoke Structured Blazer', desc: 'Single-breasted modern cut suit jacket with half-canvas construction.', minP: 6999, maxP: 22999 },
    { prefix: 'Boho', item: 'Hand-Block Printed Tiered Maxi Dress', desc: 'Natural vegetable-dye printed artisanal cotton flowy silhouette.', minP: 2299, maxP: 7999 },
  ];
  const fashVariants = ['Classic Cut', 'Midnight Navy', 'Emerald Green', 'Charcoal Grey', 'Ivory White', 'Tuscan Tan', 'Crimson Red', 'Olive Green', 'Oatmeal', 'Onyx Black', 'Cobalt Blue', 'Saffron Gold', 'Burgundy', 'Sky Blue', 'Dusty Rose', 'Espresso', 'Sandstone', 'Indigo Wash', 'Raw Finish', 'Platinum Edition'];
  const fashBrands = ['VogueIndia', 'Elysian Sartorial', 'CraftWeave', 'KashmirSilks', 'UrbanNomad', 'Sartoria Luxe', 'Aethel Apparel', 'Zari & Loom', 'Bespoke Atelier', 'Velvet & Co'];

  for (let i = 0; i < 210; i++) {
    globalIndex++;
    const t = fashTypes[i % fashTypes.length];
    const v = fashVariants[Math.floor(i / fashTypes.length) % fashVariants.length];
    const brand = fashBrands[i % fashBrands.length];
    const title = `${brand} ${t.prefix} ${t.item} - ${v}`;
    const slug = `${brand.toLowerCase()}-${t.prefix.toLowerCase()}-${t.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${globalIndex}`;
    const basePrice = Math.round((t.minP + (i * 283) % (t.maxP - t.minP)) / 100) * 100 - 1;
    const hasDiscount = i % 2 === 1;
    const salePrice = hasDiscount ? Math.round(basePrice * (0.7 + (i % 25) * 0.01)) : null;
    const isFeatured = i % 6 === 0;
    const isBestSeller = i % 5 === 0;
    const img = IMAGES_APPAREL[i % IMAGES_APPAREL.length];

    products.push({
      id: `prod-${globalIndex}`,
      categoryId: 'cat-2',
      title,
      slug,
      shortDescription: `${t.desc} Exclusive collection by ${brand}.`,
      description: `Elevate your wardrobe with the exquisite ${title}. Masterfully designed and tailored using premium materials for unparalleled comfort and modern sophistication.`,
      basePrice,
      salePrice,
      sku: `SKU-AP-${globalIndex}`,
      brand,
      isFeatured,
      isNewArrival: i % 4 === 0,
      isBestSeller,
      rating: +(4.3 + (i % 7) * 0.1).toFixed(1),
      reviews: 12 + (i * 9) % 210,
      tags: ['fashion', 'apparel', brand.toLowerCase(), t.prefix.toLowerCase()],
      imageUrl: img,
      stock: 10 + (i * 11) % 90,
    });
  }

  // 3. Home & Living (210 items)
  const homeTypes = [
    { prefix: 'Nordic', item: 'Ceramic Sculptural Table Lamp', desc: 'Matte glaze earthenware accent lamp with warm ambient LED glow.', minP: 1899, maxP: 7499 },
    { prefix: 'Solstice', item: 'Solid Mango Wood Nesting Tables', desc: 'Set of 2 handcrafted round accent tables with black powder-coated steel frame.', minP: 4499, maxP: 16999 },
    { prefix: 'Heritage', item: 'Hand-Tufted 100% Wool Area Rug', desc: 'Geometric plush wool floor rug in warm earth tones for living spaces.', minP: 5999, maxP: 24999 },
    { prefix: 'Kyoto', item: 'Minimalist Cast Iron Teapot Set', desc: 'Tetsubin style heavy cast iron kettle with porcelain tea cups and infuser.', minP: 2499, maxP: 7999 },
    { prefix: 'Aura', item: 'Linen Textured Blackout Curtains', desc: 'Thermal insulated heavy draping window panels with antique brass grommets.', minP: 1499, maxP: 4999 },
    { prefix: 'Botanica', item: 'Hand-Poured Soy Wax Scented Candle', desc: 'Oud wood, amber, and vanilla aromatherapy candle with wooden crackling wick.', minP: 799, maxP: 2499 },
    { prefix: 'Artisan', item: 'Handmade Glazed Ceramic Dinnerware Set', desc: '16-piece stoneware collection including dinner plates, bowls, and mugs.', minP: 3499, maxP: 12999 },
    { prefix: 'Zenith', item: 'Solid Teak Wood Wall Shelf Unit', desc: 'Floating modular storage shelf with concealed mounting hardware.', minP: 1999, maxP: 6999 },
    { prefix: 'Royal', item: 'Egyptian Cotton 400TC Bed Linen Set', desc: 'Super king size satin-weave bedsheet with two matching pillowcases.', minP: 2999, maxP: 8999 },
    { prefix: 'Terra', item: 'Abstract Hand-Painted Canvas Wall Art', desc: 'Textured acrylic on stretched canvas with sleek floating natural wood frame.', minP: 2499, maxP: 9499 },
    { prefix: 'Luxe', item: 'Brass & Smoked Glass Pendant Light', desc: 'Mid-century modern ceiling luminaire with adjustable braided cable.', minP: 3299, maxP: 11999 },
    { prefix: 'Comfort', item: 'Velvet Ergonomic Accent Lounge Armchair', desc: 'Plush high-density foam upholstered reading chair with walnut wood legs.', minP: 9999, maxP: 34999 },
  ];
  const homeVariants = ['Natural Finish', 'Walnut Brown', 'Charcoal Black', 'Warm Sand', 'Sage Green', 'Terracotta', 'Off-White', 'Smoked Amber', 'Matte Gold', 'Mustard Yellow', 'Forest Green', 'Teal Blue', 'Raw Wood', 'Brushed Nickel', 'Clay Pink', 'Navy Indigo', 'Pewter', 'Rustic Oak', 'Desert Ochre', 'Stone Grey'];
  const homeBrands = ['Solstice Living', 'HavenCraft', 'ArtisanAbode', 'NordicNest', 'Kasa Luxe', 'TerraForma', 'AuraDecor', 'Zenitha Home', 'Loom & Timber', 'Clay & Glaze'];

  for (let i = 0; i < 210; i++) {
    globalIndex++;
    const t = homeTypes[i % homeTypes.length];
    const v = homeVariants[Math.floor(i / homeTypes.length) % homeVariants.length];
    const brand = homeBrands[i % homeBrands.length];
    const title = `${brand} ${t.prefix} ${t.item} in ${v}`;
    const slug = `${brand.toLowerCase()}-${t.prefix.toLowerCase()}-${t.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${globalIndex}`;
    const basePrice = Math.round((t.minP + (i * 331) % (t.maxP - t.minP)) / 100) * 100 - 1;
    const hasDiscount = i % 3 === 0;
    const salePrice = hasDiscount ? Math.round(basePrice * (0.75 + (i % 20) * 0.01)) : null;
    const isFeatured = i % 5 === 0;
    const isBestSeller = i % 6 === 0;
    const img = IMAGES_HOME[i % IMAGES_HOME.length];

    products.push({
      id: `prod-${globalIndex}`,
      categoryId: 'cat-3',
      title,
      slug,
      shortDescription: `${t.desc} Curated by ${brand}.`,
      description: `Transform your living atmosphere with the stunning ${title}. Crafted from high-grade, sustainable materials that blend functional comfort with architectural elegance.`,
      basePrice,
      salePrice,
      sku: `SKU-HM-${globalIndex}`,
      brand,
      isFeatured,
      isNewArrival: i % 3 === 0,
      isBestSeller,
      rating: +(4.4 + (i % 6) * 0.1).toFixed(1),
      reviews: 10 + (i * 8) % 180,
      tags: ['home', 'decor', brand.toLowerCase(), t.prefix.toLowerCase()],
      imageUrl: img,
      stock: 12 + (i * 9) % 80,
    });
  }

  // 4. Timepieces & Accessories (210 items)
  const watchTypes = [
    { prefix: 'AeroPilot', item: 'Mechanical Skeleton Automatic Watch', desc: 'Open-heart skeleton movement watch with sapphire crystal and Italian leather strap.', minP: 14999, maxP: 59999 },
    { prefix: 'OceanDiver', item: '300M Professional Automatic Diver Watch', desc: '300m water-resistant tool watch with ceramic unidirectional rotating bezel.', minP: 19999, maxP: 74999 },
    { prefix: 'Vanguard', item: 'Automatic GMT Dual-Time Chronograph', desc: 'Swiss caliber dual-time chronometer in 316L solid surgical stainless steel.', minP: 24999, maxP: 99999 },
    { prefix: 'Chronos', item: 'Polarized Titanium Aviator Sunglasses', desc: 'Ultra-lightweight aerospace grade titanium sunglasses with 100% UV400 lenses.', minP: 3499, maxP: 12999 },
    { prefix: 'Titan', item: 'Smart Health & Sleep Tracking Ring', desc: 'Waterproof smart ring with biometric body temperature and heart rate sensors.', minP: 9999, maxP: 24999 },
    { prefix: 'Elysian', item: 'Full-Grain Leather Bi-Fold Wallet', desc: 'Hand-stitched vegetable-tanned Italian leather wallet with RFID blocking layer.', minP: 1499, maxP: 4999 },
    { prefix: 'Heritage', item: 'Sterling Silver 925 Cuban Link Chain', desc: 'Solid 925 sterling silver hallmarked chain necklace with lobster clasp.', minP: 2999, maxP: 14999 },
    { prefix: 'Voyager', item: 'Top-Grain Leather Travel Duffle Bag', desc: 'Waxed canvas and heavy leather weekend duffle bag with brass hardware.', minP: 4999, maxP: 18999 },
    { prefix: 'Celeste', item: 'Moissanite Diamond Solitaire Ring', desc: '2 Carat brilliant round cut certified VVS1 moissanite in 18k white gold band.', minP: 8999, maxP: 38999 },
    { prefix: 'Zenith', item: 'Minimalist Automatic Dress Watch', desc: 'Ultra-thin 7.8mm automatic timepiece with exhibition caseback and sunray dial.', minP: 11999, maxP: 44999 },
  ];
  const watchVariants = ['Rose Gold', 'Obsidian Black', 'Classic Silver', 'Sunburst Blue', 'Emerald Sunray', 'Champagne Gold', 'Titanium Grey', 'Vintage Bronze', 'Gunmetal', 'Midnight Blue', 'Cognac Brown', 'Dark Olive', 'Oxblood Leather', 'Smoked Carbon', 'Pure Platinum', 'Pebbled Tan', 'Deep Onyx', 'Brushed Steel', 'Copper Alloy', 'Antique Silver'];
  const watchBrands = ['Vanguard Horology', 'Chronos Craft', 'Elysian Leather', 'AeroTimepieces', 'Orion Jewels', 'TitaniumLab', 'Heritage Guild', 'Celeste & Co', 'Monarch Time', 'SilverCraft'];

  for (let i = 0; i < 210; i++) {
    globalIndex++;
    const t = watchTypes[i % watchTypes.length];
    const v = watchVariants[Math.floor(i / watchTypes.length) % watchVariants.length];
    const brand = watchBrands[i % watchBrands.length];
    const title = `${brand} ${t.prefix} ${t.item} (${v})`;
    const slug = `${brand.toLowerCase()}-${t.prefix.toLowerCase()}-${t.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${globalIndex}`;
    const basePrice = Math.round((t.minP + (i * 457) % (t.maxP - t.minP)) / 100) * 100 - 1;
    const hasDiscount = i % 2 === 0;
    const salePrice = hasDiscount ? Math.round(basePrice * (0.8 + (i % 15) * 0.01)) : null;
    const isFeatured = i % 4 === 0;
    const isBestSeller = i % 5 === 0;
    const img = IMAGES_WATCHES[i % IMAGES_WATCHES.length];

    products.push({
      id: `prod-${globalIndex}`,
      categoryId: 'cat-4',
      title,
      slug,
      shortDescription: `${t.desc} Precision created by ${brand}.`,
      description: `Meticulously assembled with heirloom craftsmanship, the ${title} is designed for enduring luxury and daily excellence. Accompanied by authentic certification.`,
      basePrice,
      salePrice,
      sku: `SKU-WT-${globalIndex}`,
      brand,
      isFeatured,
      isNewArrival: i % 4 === 0,
      isBestSeller,
      rating: +(4.5 + (i % 5) * 0.1).toFixed(1),
      reviews: 14 + (i * 6) % 190,
      tags: ['watches', 'accessories', brand.toLowerCase(), t.prefix.toLowerCase()],
      imageUrl: img,
      stock: 8 + (i * 7) % 60,
    });
  }

  // 5. Beauty & Wellness (210 items)
  const wellTypes = [
    { prefix: 'Botanical', item: 'Radiance Face Elixir Serum', desc: '100% cold-pressed botanical facial oil with Bakuchiol and Rosehip extract.', minP: 999, maxP: 3499 },
    { prefix: 'HydraGlow', item: 'Hyaluronic & Niacinamide Day Gel Cream', desc: 'Ultra-lightweight oil-free moisturizer with 2% Niacinamide and SPF 30.', minP: 799, maxP: 2499 },
    { prefix: 'Vedic', item: 'Pure Kumkumadi Ayurvedic Miraculous Beauty Oil', desc: 'Authentic 26-herb Ayurvedic formulation infused with Kashmiri Saffron.', minP: 1499, maxP: 4999 },
    { prefix: 'PureMatcha', item: 'Ceremonial Grade Uji Matcha Powder', desc: 'Stone-ground 100g tin of first harvest Japanese green tea rich in L-theanine.', minP: 1299, maxP: 3999 },
    { prefix: 'Aromatherapy', item: 'Himalayan Pink Salt Bath Soak & Scrub', desc: 'Mineral rich body exfoliant infused with pure lavender and frankincense oil.', minP: 499, maxP: 1899 },
    { prefix: 'DermaPro', item: 'Vitamin C 20% Brightening Serum', desc: 'Clinical strength stabilized L-Ascorbic Acid and Ferulic Acid anti-aging serum.', minP: 899, maxP: 2999 },
    { prefix: 'Artisan', item: 'First-Flush Organic Darjeeling Black Tea', desc: 'Estate-plucked single origin whole leaf muscatel aromatic loose tea.', minP: 799, maxP: 2699 },
    { prefix: 'Kashmiri', item: 'Organic Rose Water Toner & Face Mist', desc: 'Steam-distilled pure Rosa Damascena water for skin hydration and calming.', minP: 399, maxP: 1499 },
    { prefix: 'LuxeOud', item: 'Extrait de Parfum Artisanal Fragrance', desc: 'Long-lasting luxury perfume with top notes of bergamot, oud wood, and amber.', minP: 2499, maxP: 8999 },
    { prefix: 'BioActive', item: 'Peptide Firming Eye Repair Cream', desc: 'Concentrated eye treatment reducing dark circles, puffiness, and fine lines.', minP: 899, maxP: 2799 },
  ];
  const wellVariants = ['50ml Bottle', '100ml Pump', '200g Jar', '100g Tin', '30ml Dropper', 'Travel Edition', 'Intense Formula', 'Sensitive Skin', 'Gentle Formula', 'Concentrated Extract', 'Ultra Rich', 'Citrus Blossom', 'Lavender Calm', 'Sandalwood Amber', 'Rose Damascena', 'Green Tea Infusion', 'Eucalyptus Mint', 'Vanilla Bean', 'Kashmiri Saffron', 'Wild Vetiver'];
  const wellBrands = ['PureVita Organics', 'Vedic Apothecary', 'DermaLuxe', 'Botanica Herbals', 'AromaKashmir', 'Uji Naturals', 'Elysian Scent', 'Sattva Wellness', 'BioEssence', 'Flora & Root'];

  for (let i = 0; i < 210; i++) {
    globalIndex++;
    const t = wellTypes[i % wellTypes.length];
    const v = wellVariants[Math.floor(i / wellTypes.length) % wellVariants.length];
    const brand = wellBrands[i % wellBrands.length];
    const title = `${brand} ${t.prefix} ${t.item} - ${v}`;
    const slug = `${brand.toLowerCase()}-${t.prefix.toLowerCase()}-${t.item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${globalIndex}`;
    const basePrice = Math.round((t.minP + (i * 193) % (t.maxP - t.minP)) / 100) * 100 - 1;
    const hasDiscount = i % 2 === 1;
    const salePrice = hasDiscount ? Math.round(basePrice * (0.75 + (i % 20) * 0.01)) : null;
    const isFeatured = i % 5 === 0;
    const isBestSeller = i % 4 === 0;
    const img = IMAGES_WELLNESS[i % IMAGES_WELLNESS.length];

    products.push({
      id: `prod-${globalIndex}`,
      categoryId: 'cat-5',
      title,
      slug,
      shortDescription: `${t.desc} Formulated by ${brand}.`,
      description: `Nourish your skin and senses with the pure, therapeutic benefits of ${title}. Formulated without parabens, sulfates, or artificial fragrances.`,
      basePrice,
      salePrice,
      sku: `SKU-BW-${globalIndex}`,
      brand,
      isFeatured,
      isNewArrival: i % 3 === 0,
      isBestSeller,
      rating: +(4.4 + (i % 6) * 0.1).toFixed(1),
      reviews: 20 + (i * 11) % 300,
      tags: ['beauty', 'wellness', brand.toLowerCase(), t.prefix.toLowerCase()],
      imageUrl: img,
      stock: 20 + (i * 15) % 150,
    });
  }

  return products;
}

async function runSeed() {
  const dbUrl = process.env.DATABASE_URL;
  let connection: mysql.Connection;

  if (dbUrl) {
    connection = await mysql.createConnection({
      uri: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      port: Number(process.env.TIDB_PORT) || 4000,
      database: process.env.TIDB_DATABASE || 'shopping_by_jitesh',
      ssl: { rejectUnauthorized: false },
    });
  }

  console.log('Connected to TiDB Cloud successfully.');

  const [countRows] = await connection.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM products');
  const initialCount = countRows[0]?.count || 0;
  console.log(`Initial existing product count in database: ${initialCount}`);

  // 1. Upsert Categories
  console.log('Upserting 5 main categories...');
  for (const cat of CATEGORIES) {
    await connection.query(
      `INSERT INTO categories (id, parent_id, name, slug, description, image_url, icon, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         slug = VALUES(slug),
         description = VALUES(description),
         image_url = VALUES(image_url),
         icon = VALUES(icon),
         is_featured = VALUES(is_featured),
         sort_order = VALUES(sort_order)`,
      [cat.id, cat.parentId, cat.name, cat.slug, cat.description, cat.imageUrl, cat.icon, cat.isFeatured, cat.sortOrder]
    );
  }

  // 2. Generate 1050 products
  const generatedProducts = generateCatalog();
  console.log(`Generated ${generatedProducts.length} unique catalog items for batch ingestion.`);

  // 3. Multi-row Bulk Batch Insert (50 items per batch)
  const batchSize = 50;
  let newlyInserted = 0;

  for (let i = 0; i < generatedProducts.length; i += batchSize) {
    const batch = generatedProducts.slice(i, i + batchSize);

    // Products multi-row insert
    const prodValues: unknown[] = [];
    const prodPlaceholders = batch.map((p) => {
      prodValues.push(
        p.id,
        p.categoryId,
        p.title,
        p.slug,
        p.shortDescription,
        p.description,
        p.basePrice,
        p.salePrice,
        p.sku,
        p.brand,
        p.isFeatured,
        p.isNewArrival,
        p.isBestSeller,
        p.rating,
        p.reviews,
        JSON.stringify(p.tags)
      );
      return '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)';
    }).join(', ');

    await connection.query(
      `INSERT INTO products (
        id, category_id, title, slug, short_description, description,
        base_price, sale_price, sku, brand, is_featured, is_new_arrival,
        is_best_seller, is_active, average_rating, review_count, tags
      ) VALUES ${prodPlaceholders}
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        base_price = VALUES(base_price),
        sale_price = VALUES(sale_price),
        average_rating = VALUES(average_rating),
        review_count = VALUES(review_count)`,
      prodValues
    );

    // Images multi-row insert
    const imgValues: unknown[] = [];
    const imgPlaceholders = batch.map((p) => {
      imgValues.push(`img-${p.id}`, p.id, p.imageUrl, p.title);
      return '(?, ?, ?, ?, TRUE, 1)';
    }).join(', ');

    await connection.query(
      `INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, display_order)
       VALUES ${imgPlaceholders}
       ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)`,
      imgValues
    );

    // Inventory multi-row insert
    const invValues: unknown[] = [];
    const invPlaceholders = batch.map((p) => {
      invValues.push(`inv-${p.id}`, p.id, p.stock);
      return '(?, ?, NULL, ?, 0, 5, "Main Hub - Mumbai")';
    }).join(', ');

    await connection.query(
      `INSERT INTO inventory (id, product_id, variant_id, quantity_available, quantity_reserved, low_stock_threshold, warehouse_location)
       VALUES ${invPlaceholders}
       ON DUPLICATE KEY UPDATE quantity_available = VALUES(quantity_available)`,
      invValues
    );

    newlyInserted += batch.length;
    process.stdout.write(`\rProgress: ${newlyInserted} / ${generatedProducts.length} items ingested into TiDB...`);
  }

  console.log('\nSeed processing completed.');

  // 4. Verification
  const [finalRows] = await connection.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
  const finalCount = finalRows[0]?.count || 0;

  const [categoryBreakdown] = await connection.query<mysql.RowDataPacket[]>(`
    SELECT c.name as category_name, c.slug, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.sort_order ASC
  `);

  const [imagesCount] = await connection.query<mysql.RowDataPacket[]>('SELECT COUNT(DISTINCT product_id) as count FROM product_images WHERE is_primary = TRUE');
  const [inventoryCount] = await connection.query<mysql.RowDataPacket[]>('SELECT COUNT(DISTINCT product_id) as count FROM inventory WHERE quantity_available > 0');
  const [invalidPriceCount] = await connection.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM products WHERE sale_price IS NOT NULL AND sale_price > base_price');

  console.log('\n================ DATABASE VERIFICATION METRICS ================');
  console.log(`Initial Products in Database: ${initialCount}`);
  console.log(`New Products Ingested: ${newlyInserted}`);
  console.log(`Total Active Products in Database: ${finalCount}`);
  console.log(`Products with Primary Images: ${imagesCount[0]?.count || 0}`);
  console.log(`Products with Active Inventory: ${inventoryCount[0]?.count || 0}`);
  console.log(`Pricing Inconsistencies (sale > base): ${invalidPriceCount[0]?.count || 0}`);
  console.log('\n--- Breakdown Per Category ---');
  for (const cat of categoryBreakdown) {
    console.log(`- ${cat.category_name} (${cat.slug}): ${cat.product_count} products`);
  }
  console.log('===============================================================\n');

  await connection.end();
}

runSeed().catch((err) => {
  console.error('Error running 1000+ products seed:', err);
  process.exit(1);
});
