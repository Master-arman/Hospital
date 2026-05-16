import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function initDB() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456789",
    database: process.env.DB_NAME || "arman",
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ambulances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ambulance_id VARCHAR(50),
        vehicle_number VARCHAR(50) NOT NULL,
        driver_name VARCHAR(100),
        driver_phone VARCHAR(20),
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        oxygen_available TINYINT(1) DEFAULT 0
      )
    `);
    console.log("✅ Ambulances table created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    pool.end();
  }
}

initDB();
