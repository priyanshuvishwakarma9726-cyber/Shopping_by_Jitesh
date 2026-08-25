import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function calculateAffordablePrices(title: string, categoryId: string, index: number): { basePrice: number; salePrice: number | null } {
  const lower = title.toLowerCase();
  let minP = 299;
  let maxP = 2999;

  if (categoryId === 'cat-1') {
    if (lower.includes('charger') || lower.includes('cable') || lower.includes('stand') || lower.includes('case')) {
      minP = 199; maxP = 1499;
    } else if (lower.includes('earbud') || lower.includes('earphone')) {
      minP = 499; maxP = 3999;
    } else if (lower.includes('headphone') || lower.includes('speaker') || lower.includes('soundbar')) {
      minP = 799; maxP = 6999;
    } else if (lower.includes('power bank')) {
      minP = 599; maxP = 2499;
    } else if (lower.includes('keyboard') || lower.includes('dock')) {
      minP = 899; maxP = 4999;
    } else if (lower.includes('display') || lower.includes('monitor') || lower.includes('tablet') || lower.includes('drone')) {
      minP = 3999; maxP = 19999;
    } else {
      minP = 499; maxP = 5999;
    }
  } else if (categoryId === 'cat-2') {
    if (lower.includes('t-shirt') || lower.includes('polo')) {
      minP = 299; maxP = 999;
    } else if (lower.includes('shirt') || lower.includes('kurta')) {
      minP = 499; maxP = 1799;
    } else if (lower.includes('jeans') || lower.includes('trouser') || lower.includes('chino')) {
      minP = 699; maxP = 2299;
    } else if (lower.includes('dress')) {
      minP = 599; maxP = 2499;
    } else if (lower.includes('jacket') || lower.includes('hoodie') || lower.includes('cardigan') || lower.includes('sweater')) {
      minP = 799; maxP = 3499;
    } else if (lower.includes('shoe') || lower.includes('boot') || lower.includes('sneaker')) {
      minP = 699; maxP = 3499;
    } else if (lower.includes('bag') || lower.includes('tote')) {
      minP = 399; maxP = 2499;
    } else if (lower.includes('blazer')) {
      minP = 1299; maxP = 3999;
    } else {
      minP = 399; maxP = 1999;
    }
  } else if (categoryId === 'cat-3') {
    if (lower.includes('cushion') || lower.includes('decor') || lower.includes('vase')) {
      minP = 199; maxP = 999;
    } else if (lower.includes('lamp') || lower.includes('light') || lower.includes('diffuser')) {
      minP = 399; maxP = 2499;
    } else if (lower.includes('kitchen') || lower.includes('oven') || lower.includes('glass')) {
      minP = 249; maxP = 1999;
    } else if (lower.includes('storage') || lower.includes('clock')) {
      minP = 199; maxP = 1499;
    } else if (lower.includes('chair') || lower.includes('table') || lower.includes('bookshelf') || lower.includes('rug') || lower.includes('duvet')) {
      minP = 999; maxP = 6999;
    } else {
      minP = 249; maxP = 2499;
    }
  } else if (categoryId === 'cat-4') {
    if (lower.includes('wallet') || lower.includes('cardholder') || lower.includes('belt')) {
      minP = 299; maxP = 1499;
    } else if (lower.includes('sunglasses') || lower.includes('shades')) {
      minP = 299; maxP = 1999;
    } else if (lower.includes('bracelet') || lower.includes('cufflink') || lower.includes('ring') || lower.includes('jewellery')) {
      minP = 199; maxP = 2999;
    } else if (lower.includes('automatic') || lower.includes('chronograph') || lower.includes('skeleton') || lower.includes('swiss')) {
      minP = 1999; maxP = 14999;
    } else if (lower.includes('watch')) {
      minP = 799; maxP = 4499;
    } else {
      minP = 299; maxP = 2999;
    }
  } else if (categoryId === 'cat-5') {
    if (lower.includes('face wash') || lower.includes('cleanser') || lower.includes('polish') || lower.includes('lip')) {
      minP = 199; maxP = 699;
    } else if (lower.includes('serum') || lower.includes('elixir')) {
      minP = 299; maxP = 1299;
    } else if (lower.includes('cream') || lower.includes('moisturizer') || lower.includes('body wash') || lower.includes('mask')) {
      minP = 199; maxP = 999;
    } else if (lower.includes('candle') || lower.includes('oil')) {
      minP = 249; maxP = 1199;
    } else if (lower.includes('hair dryer') || lower.includes('grooming')) {
      minP = 499; maxP = 2499;
    } else if (lower.includes('parfum') || lower.includes('perfume')) {
      minP = 399; maxP = 2499;
    } else {
      minP = 199; maxP = 999;
    }
  }

  const spread = maxP - minP;
  const hash = ((index * 37 + title.length * 13) % 100) / 100;
  const rawBase = minP + hash * spread;
  const basePrice = Math.max(minP, Math.round(rawBase / 50) * 50 - 1);

  const hasSale = index % 3 === 0;
  let salePrice: number | null = null;
  if (hasSale) {
    const discountRatio = 0.10 + ((index % 5) * 0.05);
    const discounted = Math.round((basePrice * (1 - discountRatio)) / 50) * 50 - 1;
    salePrice = Math.min(basePrice - 50, Math.max(99, discounted));
  }

  return { basePrice, salePrice };
}

async function main() {
  console.log('========================================================================');
  console.log('  SHOPPING BY JITESH — AFFORDABLE PRICING REALIGNMENT ON 10,000+ CATALOG ');
  console.log('========================================================================\n');

  let connection: mysql.Connection;
  if (process.env.DATABASE_URL) {
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
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

  console.log('Connected to TiDB Cloud.');

  const [products] = await connection.query<mysql.RowDataPacket[]>(
    'SELECT id, title, category_id FROM products ORDER BY id ASC'
  );

  console.log(`Fetched ${products.length} products to realign with affordable pricing guidelines...`);

  // High-performance batch updates using CASE statements
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(products.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const batch = products.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    
    const ids: string[] = [];
    const baseCaseParts: string[] = [];
    const saleCaseParts: string[] = [];
    const params: unknown[] = [];

    for (let idx = 0; idx < batch.length; idx++) {
      const p = batch[idx];
      const { basePrice } = calculateAffordablePrices(p.title, String(p.category_id), b * BATCH_SIZE + idx);
      ids.push(p.id);
      baseCaseParts.push(`WHEN id = ? THEN ?`);
      params.push(p.id, basePrice);
    }

    for (let idx = 0; idx < batch.length; idx++) {
      const p = batch[idx];
      const { salePrice } = calculateAffordablePrices(p.title, String(p.category_id), b * BATCH_SIZE + idx);
      saleCaseParts.push(`WHEN id = ? THEN ?`);
      params.push(p.id, salePrice);
    }

    const inPlaceholders = ids.map(() => '?').join(', ');
    params.push(...ids);

    const updateSql = `
      UPDATE products 
      SET 
        base_price = CASE ${baseCaseParts.join(' ')} END,
        sale_price = CASE ${saleCaseParts.join(' ')} END
      WHERE id IN (${inPlaceholders})
    `;

    await connection.query(updateSql, params);

    console.log(`  Processed batch ${b + 1} / ${totalBatches} (${Math.min((b + 1) * BATCH_SIZE, products.length)} products updated)...`);
  }

  // Calculate and report final pricing statistics
  console.log('\n========================================================================');
  console.log('               AFFORDABLE PRICING AUDIT & STATISTICS REPORT              ');
  console.log('========================================================================\n');

  const [stats] = await connection.query<mysql.RowDataPacket[]>(`
    SELECT 
      c.id,
      c.name as category_name,
      MIN(p.base_price) as min_price,
      MAX(p.base_price) as max_price,
      ROUND(AVG(p.base_price)) as avg_price,
      COUNT(CASE WHEN p.sale_price IS NOT NULL AND p.sale_price < p.base_price THEN 1 END) as discounted_count,
      COUNT(*) as total_count
    FROM products p
    JOIN categories c ON p.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY c.sort_order ASC
  `);

  console.log('Category Price Statistics:');
  for (const s of stats) {
    const [prices] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT base_price FROM products WHERE category_id = ? ORDER BY base_price ASC',
      [s.id]
    );
    const mid = Math.floor(prices.length / 2);
    const median = prices.length > 0 ? prices[mid].base_price : 0;

    console.log(`\n  📦 ${s.category_name} (${s.total_count} products):`);
    console.log(`     - Min Price: ₹${s.min_price.toLocaleString('en-IN')}`);
    console.log(`     - Max Price: ₹${s.max_price.toLocaleString('en-IN')}`);
    console.log(`     - Average Price: ₹${s.avg_price.toLocaleString('en-IN')}`);
    console.log(`     - Median Price: ₹${median.toLocaleString('en-IN')}`);
    console.log(`     - Discounted Products: ${s.discounted_count} (${Math.round((s.discounted_count / s.total_count) * 100)}% on sale)`);
  }

  console.log('\n========================================================================\n');
  await connection.end();
}

main().catch((err) => {
  console.error('Pricing realignment error:', err);
  process.exit(1);
});
