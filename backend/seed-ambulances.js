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

const ambulances = [
  {
    ambulance_id: "AMB-001",
    vehicle_number: "MH12AB1234",
    driver_name: "Ramesh Kumar",
    driver_phone: "9876543210",
    type: "Basic",
    status: "Available",
    location: "Main Gate",
    oxygen_available: 1,
  },
  {
    ambulance_id: "AMB-002",
    vehicle_number: "MH12CD5678",
    driver_name: "Suresh Patil",
    driver_phone: "9876501234",
    type: "ICU",
    status: "On Duty",
    location: "Parking Lot",
    oxygen_available: 1,
  },
  {
    ambulance_id: "AMB-003",
    vehicle_number: "MH12EF9012",
    driver_name: "Vinod Sharma",
    driver_phone: "9876512345",
    type: "Ventilator",
    status: "Maintenance",
    location: "Workshop",
    oxygen_available: 1,
  },
];

console.log("Adding sample ambulances...\n");

ambulances.forEach((a) => {
  const sql =
    "INSERT INTO ambulances (ambulance_id, vehicle_number, driver_name, driver_phone, type, status, location, oxygen_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      a.ambulance_id,
      a.vehicle_number,
      a.driver_name,
      a.driver_phone,
      a.type,
      a.status,
      a.location,
      a.oxygen_available,
    ],
    (err, result) => {
      if (err) {
        if (err.code !== "ER_DUP_ENTRY") {
          console.error(`❌ Error adding ${a.vehicle_number}:`, err.message);
        }
      } else {
        console.log(`✅ Added: ${a.vehicle_number} (ID: ${result.insertId})`);
      }
    },
  );
});

setTimeout(() => {
  console.log("\n==== AMBULANCES TABLE DATA ====");
  db.query("SELECT * FROM ambulances", (err, results) => {
    if (err) {
      console.error("Error fetching ambulances:", err.message);
    } else {
      console.log(`Total ambulances: ${results.length}`);
      if (results.length > 0) {
        console.table(results);
      }
    }
    db.end();
  });
}, 1200);
