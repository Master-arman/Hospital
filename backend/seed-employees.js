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

const employees = [
  {
    name: "Dr. Amit Sharma",
    email: "amit@hospital.com",
    position: "Senior Doctor",
    department: "Cardiology",
  },
  {
    name: "Dr. Neha Verma",
    email: "neha@hospital.com",
    position: "Doctor",
    department: "Gynecology",
  },
  {
    name: "Dr. Rahul Singh",
    email: "rahul@hospital.com",
    position: "Specialist",
    department: "Orthopedics",
  },
  {
    name: "Dr. Pooja Mehta",
    email: "pooja@hospital.com",
    position: "Doctor",
    department: "Pediatrics",
  },
  {
    name: "Dr. Sanjay Kumar",
    email: "sanjay@hospital.com",
    position: "Senior Doctor",
    department: "Neurology",
  },
];

console.log("Adding sample doctors...\n");

employees.forEach((emp) => {
  const sql =
    "INSERT INTO employees (name, email, position, department) VALUES (?, ?, ?, ?)";
  db.query(
    sql,
    [emp.name, emp.email, emp.position, emp.department],
    (err, result) => {
      if (err) {
        if (err.code !== "ER_DUP_ENTRY") {
          console.error(`❌ Error adding ${emp.name}:`, err.message);
        }
      } else {
        console.log(`✅ Added: ${emp.name} (ID: ${result.insertId})`);
      }
    }
  );
});

setTimeout(() => {
  console.log("\n==== EMPLOYEES TABLE DATA ====");
  db.query("SELECT * FROM employees", (err, results) => {
    if (err) {
      console.error("Error fetching employees:", err.message);
    } else {
      console.log(`Total employees: ${results.length}`);
      if (results.length > 0) {
        console.table(results);
      }
    }
    db.end();
  });
}, 1000);
