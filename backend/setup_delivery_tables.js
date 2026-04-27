import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: '127.0.0.1', port: 3306,
    user: 'root', password: '123456789',
    database: 'arman'
  });

  await pool.query(`CREATE TABLE IF NOT EXISTS delivery_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    pincode VARCHAR(10),
    phone VARCHAR(20),
    distance_km DECIMAL(6,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  )`);
  console.log('✅ delivery_addresses table created');

  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    address_id INT,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash','Card','UPI','Insurance') DEFAULT 'Cash',
    status ENUM('Pending Verification','Approved','Packed','Out for Delivery','Delivered','Cancelled') DEFAULT 'Pending Verification',
    prescription_file VARCHAR(255),
    is_monthly_refill TINYINT(1) DEFAULT 0,
    refill_interval_days INT DEFAULT 30,
    next_refill_date DATE,
    delivery_type ENUM('Home Delivery','Hospital Pickup') DEFAULT 'Home Delivery',
    eta_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (address_id) REFERENCES delivery_addresses(id)
  )`);
  console.log('✅ orders table created');

  await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    quantity INT DEFAULT 1,
    price_at_purchase DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
  console.log('✅ order_items table created');

  console.log('\n🎉 All delivery tables created successfully!');
  process.exit(0);
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
