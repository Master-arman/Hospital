import mysql from "mysql2/promise";

async function createMedicineTables() {
  try {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "123456789",
      database: "arman",
      waitForConnections: true,
    });

    console.log("Connected. Creating medicines and prescriptions tables...");

    const createMedicinesQuery = `
      CREATE TABLE IF NOT EXISTS medicines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category ENUM('Tablet','Syrup','Injection','Capsule','Ointment','Drops','Inhaler','Powder', 'Cream', 'Gel', 'Patch', 'Solution', 'Suppository', 'Drip', 'Dangerous') DEFAULT 'Tablet',
        stock INT DEFAULT 0,
        expiry_date DATE,
        price DECIMAL(10,2) DEFAULT 0.00,
        supplier VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    const createPrescriptionsQuery = `
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        medicine_id INT NOT NULL,
        quantity INT DEFAULT 1,
        notes TEXT,
        prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
      );
    `;

    const insertSampleData = `
      INSERT IGNORE INTO medicines (name, category, stock, expiry_date, price, supplier) VALUES
      ('Paracetamol 500mg',    'Tablet',    150, '2027-06-15', 2.50,  'Sun Pharma'),
      ('Amoxicillin 250mg',    'Capsule',   85,  '2026-12-20', 8.00,  'Cipla Ltd'),
      ('Ibuprofen 400mg',      'Tablet',    200, '2027-03-10', 3.75,  'Dr. Reddy'),
      ('Cetirizine 10mg',      'Tablet',    300, '2027-09-01', 1.50,  'Mankind Pharma')
    `;

    await pool.query(createMedicinesQuery);
    console.log("✅ medicines table created.");

    await pool.query(createPrescriptionsQuery);
    console.log("✅ prescriptions table created.");

    await pool.query(insertSampleData);
    console.log("✅ sample medicines inserted.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding medicine tables:", error.message);
    process.exit(1);
  }
}

createMedicineTables();
