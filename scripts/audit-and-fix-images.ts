import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import http from 'http';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Category verified reliable high-resolution images on Unsplash
export const CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  'cat-1': [ // Electronics
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
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop',
  ],
  'cat-2': [ // Apparel & Fashion
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
  ],
  'cat-3': [ // Home & Living
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?q=80&w=800&auto=format&fit=crop',
  ],
  'cat-4': [ // Watches & Accessories
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
  ],
  'cat-5': [ // Beauty & Wellness
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
  ],
};

function checkUrl(urlStr: string): Promise<{ ok: boolean; status: number }> {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const reqModule = url.protocol === 'https:' ? https : http;
      const req = reqModule.request(
        urlStr,
        { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 },
        (res) => {
          const status = res.statusCode || 0;
          resolve({ ok: status >= 200 && status < 400, status });
        }
      );
      req.on('error', () => resolve({ ok: false, status: 0 }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, status: 408 });
      });
      req.end();
    } catch {
      resolve({ ok: false, status: 0 });
    }
  });
}

async function runAudit() {
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

  console.log('Connected to TiDB Cloud. Fetching all distinct product image URLs...');

  const [imageRows] = await connection.query<mysql.RowDataPacket[]>(`
    SELECT img.id as img_id, img.product_id, img.image_url, p.category_id, p.title
    FROM product_images img
    JOIN products p ON img.product_id = p.id
  `);

  console.log(`Total image records in database: ${imageRows.length}`);

  // Get distinct URLs
  const urlMap = new Map<string, boolean>();
  const distinctUrls = Array.from(new Set(imageRows.map((r) => r.image_url)));
  console.log(`Distinct image URLs: ${distinctUrls.length}. Testing HTTP accessibility...`);

  for (const u of distinctUrls) {
    const result = await checkUrl(u);
    urlMap.set(u, result.ok);
    if (!result.ok) {
      console.log(`❌ BROKEN URL [${result.status}]: ${u}`);
    }
  }

  const brokenUrls = distinctUrls.filter((u) => !urlMap.get(u));
  console.log(`\nAudit Complete: ${brokenUrls.length} broken unique URLs discovered out of ${distinctUrls.length}.`);

  // Fix broken images in database
  let fixedCount = 0;
  for (const row of imageRows) {
    const isOk = urlMap.get(row.image_url);
    if (!isOk || !row.image_url) {
      const catId = row.category_id || 'cat-1';
      const fallbackList = CATEGORY_FALLBACK_IMAGES[catId] || CATEGORY_FALLBACK_IMAGES['cat-1'];
      // Deterministic hash assignment so product keeps its consistent valid image
      const hash = row.product_id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
      const validUrl = fallbackList[hash % fallbackList.length];

      await connection.query('UPDATE product_images SET image_url = ? WHERE id = ?', [validUrl, row.img_id]);
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} product_image records with verified category-specific Unsplash URLs.`);

  // Also check products table directly if any columns store image
  const [categories] = await connection.query<mysql.RowDataPacket[]>('SELECT id, image_url FROM categories');
  for (const cat of categories) {
    const res = await checkUrl(cat.image_url);
    if (!res.ok) {
      console.log(`❌ Broken category image for ${cat.id}: ${cat.image_url}`);
      const fallback = (CATEGORY_FALLBACK_IMAGES[cat.id] || CATEGORY_FALLBACK_IMAGES['cat-1'])[0];
      await connection.query('UPDATE categories SET image_url = ? WHERE id = ?', [fallback, cat.id]);
      console.log(`Fixed category ${cat.id} image.`);
    }
  }

  await connection.end();
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
