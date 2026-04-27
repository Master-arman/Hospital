import mysql from "mysql2/promise";

async function cleanupDB() {
  try {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "123456789",
      database: "arman",
      waitForConnections: true,
    });

    console.log("Connected to the database. Running cleanup operations...");

    // Drop redundant employee tables
    await pool.query("DROP TABLE IF EXISTS employe;");
    await pool.query("DROP TABLE IF EXISTS employee;");
    await pool.query("DROP TABLE IF EXISTS employeee;");
    console.log("✅ Redundant employee tables dropped (employe, employee, employeee)");

    // Create billing_receipts table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS billing_receipts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        patient_name VARCHAR(150) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_mode VARCHAR(50),
        status ENUM('pending', 'paid') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTableQuery);
    console.log("✅ billing_receipts table created successfully");

    console.log("All cleanup tasks completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during DB cleanup:", error.message);
    process.exit(1);
  }
}

cleanupDB();
