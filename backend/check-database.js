import mysql from "mysql2";

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "123456789",
  database: "arman",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to MySQL database\n");
  }
});

// Check tables
console.log("==== DATABASE TABLES ====");
db.query("SHOW TABLES", (err, results) => {
  if (err) {
    console.error("Error fetching tables:", err.message);
  } else {
    console.log(
      "Tables in database:",
      results.map((r) => Object.values(r)[0])
    );
  }

  // Check patients table
  console.log("\n==== PATIENTS TABLE DATA ====");
  db.query("SELECT * FROM patients", (err, results) => {
    if (err) {
      console.error("Error fetching patients:", err.message);
    } else {
      console.log("Total patients:", results.length);
      if (results.length > 0) {
        console.table(results);
      } else {
        console.log("❌ No patients in database");
      }
    }

    // Check users table
    console.log("\n==== USERS TABLE DATA ====");
    db.query("SELECT * FROM users", (err, results) => {
      if (err) {
        console.error("Error fetching users:", err.message);
      } else {
        console.log("Total users:", results.length);
        if (results.length > 0) {
          console.table(results);
        } else {
          console.log("❌ No users in database");
        }
      }

      db.end();
    });
  });
});
