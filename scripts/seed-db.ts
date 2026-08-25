import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  const host = process.env.TIDB_HOST;
  const user = process.env.TIDB_USER;
  const password = process.env.TIDB_PASSWORD;
  const port = Number(process.env.TIDB_PORT || 4000);

  console.log('Connecting to TiDB Cloud server...');

  let connection: mysql.Connection;

  try {
    if (dbUrl) {
      connection = await mysql.createConnection({
        uri: dbUrl,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
      });
    } else if (host && user && password) {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
      });
    } else {
      console.error('Error: Database configuration missing in .env.local');
      process.exit(1);
    }
  } catch (err) {
    console.error('Failed to connect to TiDB Cloud:', err);
    process.exit(1);
  }

  console.log('Connected to TiDB Cloud successfully.');

  // Create & Select Custom Database schema
  console.log('Creating database "shopping_by_jitesh" schema...');
  await connection.query(`CREATE DATABASE IF NOT EXISTS shopping_by_jitesh; USE shopping_by_jitesh;`);

  // Create Schema Tables
  console.log('Creating database tables in shopping_by_jitesh...');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(500),
        role ENUM('customer', 'admin', 'staff') DEFAULT 'customer',
        is_active BOOLEAN DEFAULT TRUE,
        email_verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        parent_id VARCHAR(36) NULL,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(120) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        icon VARCHAR(50),
        is_featured BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_categories_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        category_id VARCHAR(36) NOT NULL,
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(220) UNIQUE NOT NULL,
        short_description VARCHAR(500),
        description TEXT NOT NULL,
        base_price DECIMAL(10, 2) NOT NULL,
        sale_price DECIMAL(10, 2) NULL,
        cost_price DECIMAL(10, 2) NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        barcode VARCHAR(100),
        brand VARCHAR(100) DEFAULT 'Shopping by Jitesh',
        is_featured BOOLEAN DEFAULT FALSE,
        is_new_arrival BOOLEAN DEFAULT FALSE,
        is_best_seller BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        average_rating DECIMAL(3, 2) DEFAULT 0.00,
        review_count INT DEFAULT 0,
        tags JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        INDEX idx_products_slug (slug),
        INDEX idx_products_category (category_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS product_images (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_images_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS product_variants (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        title VARCHAR(150) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        price_modifier DECIMAL(10, 2) DEFAULT 0.00,
        attributes JSON NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NULL,
        quantity_available INT NOT NULL DEFAULT 0,
        quantity_reserved INT NOT NULL DEFAULT 0,
        low_stock_threshold INT DEFAULT 5,
        warehouse_location VARCHAR(100) DEFAULT 'Main Hub - Mumbai',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS addresses (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        street_address TEXT NOT NULL,
        apartment VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        address_type ENUM('home', 'work', 'other') DEFAULT 'home',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_addresses_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        shipping_address_id VARCHAR(36) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0.00,
        shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
        tax_amount DECIMAL(10, 2) DEFAULT 0.00,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'payment_pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        coupon_code VARCHAR(50) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE RESTRICT,
        INDEX idx_orders_user (user_id),
        INDEX idx_orders_number (order_number),
        INDEX idx_orders_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        variant_id VARCHAR(36) NULL,
        product_title VARCHAR(200) NOT NULL,
        variant_title VARCHAR(150) NULL,
        sku VARCHAR(100) NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        INDEX idx_order_items_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        payment_method VARCHAR(100) DEFAULT 'Manual Transfer / UPI',
        transaction_reference VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'pending',
        proof_url LONGTEXT NULL,
        rejection_reason TEXT NULL,
        reviewed_by VARCHAR(36) NULL,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_payments_order (order_id),
        INDEX idx_payments_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS payment_settings (
        id VARCHAR(36) PRIMARY KEY,
        upi_id VARCHAR(100) NOT NULL,
        qr_code_url LONGTEXT NULL,
        payment_display_name VARCHAR(150) NOT NULL DEFAULT 'Shopping by Jitesh',
        payment_instructions TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255) NULL,
        discount_type ENUM('percentage', 'fixed_amount') NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00,
        max_discount_amount DECIMAL(10, 2) NULL,
        valid_until TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Creating push_subscriptions table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Inserting seed categories...');

  const categoriesData = [
    ['cat-1', null, 'Consumer Electronics', 'electronics', 'Next-gen audio, smart wearables, and personal tech', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop', 'Laptop', 1, 1],
    ['cat-2', null, 'Apparel & Fashion', 'apparel', 'Tailored ethnic wear, outerwear, and modern luxury fits', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop', 'Shirt', 1, 2],
    ['cat-3', null, 'Home & Living', 'home-living', 'Handcrafted decor, lighting, and artisanal furniture', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop', 'Home', 1, 3],
    ['cat-4', null, 'Timepieces & Accessories', 'watches-jewelry', 'Precision chronograph watches and heritage accessories', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop', 'Watch', 1, 4],
    ['cat-5', null, 'Beauty & Wellness', 'wellness-gourmet', 'Artisanal organic skincare, botanical oils, and wellness hampers', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop', 'Sparkles', 0, 5],
  ];

  for (const cat of categoriesData) {
    await connection.query(
      `INSERT INTO categories (id, parent_id, name, slug, description, image_url, icon, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), image_url=VALUES(image_url)`,
      cat
    );
  }

  console.log('Inserting seed products...');

  const productsData = [
    [
      'prod-101', 'cat-1', 'Aura Studio Wireless ANC Headphones', 'aura-studio-wireless-anc-headphones',
      'Active noise cancelling studio headphones with 45h playback & lossless audio output.',
      'Immerse yourself in acoustic perfection with the Aura Studio Headphones.',
      24999.00, 19999.00, 'SBJ-AUDIO-101', 'Aura Sound', 1, 1, 1, 1, 4.80, 42, JSON.stringify(['wireless', 'audio'])
    ],
    [
      'prod-102', 'cat-4', 'Vanguard Automatic GMT Chronograph Watch', 'vanguard-automatic-gmt-chronograph-watch',
      'Swiss-inspired automatic movement with dual time zone bezel and sapphire crystal.',
      'The Vanguard Automatic GMT is crafted for global travelers.',
      48999.00, 42500.00, 'SBJ-WATCH-202', 'Vanguard Horology', 1, 1, 0, 1, 4.90, 19, JSON.stringify(['watch', 'automatic'])
    ],
    [
      'prod-103', 'cat-2', 'Heritage Mulberry Silk Kurta Jacket Set', 'heritage-mulberry-silk-kurta-jacket-set',
      'Handwoven pure mulberry silk structured jacket paired with a tailored kurta.',
      'Exude timeless elegance at celebratory occasions with our Heritage Mulberry Silk Set.',
      18999.00, 15999.00, 'SBJ-ETHNIC-303', 'Jitesh Couture', 1, 0, 1, 1, 4.70, 31, JSON.stringify(['ethnic', 'silk'])
    ],
    [
      'prod-104', 'cat-3', 'Nordic Ceramic Sculptural Table Lamp', 'nordic-ceramic-sculptural-table-lamp',
      'Warm ambient ceramic table lamp with dimmable warm LED bulb & linen shade.',
      'Elevate your living spaces with serene warm light.',
      8999.00, 7499.00, 'SBJ-DECOR-404', 'Lumina Living', 0, 1, 0, 1, 4.60, 14, JSON.stringify(['lighting', 'decor'])
    ],
    [
      'prod-105', 'cat-5', 'Botanical Elixir Facial Serum & Rose Quartz Roller', 'botanical-elixir-facial-serum-rose-quartz-roller',
      'Cold-pressed organic rosehip & saffron oil infused serum with rose quartz applicator.',
      'Rejuvenate your skin with 100% pure cold-pressed botanical oils.',
      4499.00, 3899.00, 'SBJ-SKIN-505', 'Aetheria Botanicals', 1, 1, 1, 1, 4.90, 56, JSON.stringify(['skincare', 'organic'])
    ]
  ];

  for (const prod of productsData) {
    await connection.query(
      `INSERT INTO products (id, category_id, title, slug, short_description, description, base_price, sale_price, sku, brand, is_featured, is_new_arrival, is_best_seller, is_active, average_rating, review_count, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), sale_price=VALUES(sale_price), base_price=VALUES(base_price)`,
      prod
    );

    await connection.query(
      `INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, display_order)
       VALUES (?, ?, ?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE image_url=VALUES(image_url)`,
      [`img-${prod[0]}`, prod[0], prod[0] === 'prod-101' ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000' : prod[0] === 'prod-102' ? 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000' : prod[0] === 'prod-103' ? 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000' : prod[0] === 'prod-104' ? 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1000' : 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000', prod[2]]
    );

    await connection.query(
      `INSERT INTO inventory (id, product_id, quantity_available, quantity_reserved)
       VALUES (?, ?, 25, 0)
       ON DUPLICATE KEY UPDATE quantity_available = VALUES(quantity_available)`,
      [`inv-${prod[0]}`, prod[0]]
    );
  }

  console.log('Database seeding completed successfully for all tables!');
  await connection.end();
}

seed().catch((err) => {
  console.error('Seeding script error:', err);
  process.exit(1);
});
