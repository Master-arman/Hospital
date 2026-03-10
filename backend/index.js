import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "127.0.0.1", // from your image
  user: "root", // username
  password: "123456789", // if you set a MySQL password, add it here
  database: "arman", // your DB name
  port: 3306, // default MySQL port
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

app.get("/", async (req, res) => {
  res.json({ status: "API is working" });
});

// 🔹 CREATE - Add new user
app.post("/users", (req, res) => {
  const { name, email, gender, date_of_birth } = req.body;
  const sql =
    "INSERT INTO users (name, email, gender, date_of_birth) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email, gender, date_of_birth], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ User added successfully", id: result.insertId });
  });
});

// 🔹 READ - Get all users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 READ (by ID) - Get single user
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(result[0]);
  });
});

// 🔹 UPDATE - Edit user details

app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  let { name, email, gender, date_of_birth } = req.body;

  // 🧹 Clean the date (convert ISO -> YYYY-MM-DD)
  if (date_of_birth && date_of_birth.includes("T")) {
    date_of_birth = date_of_birth.split("T")[0];
  }

  const sql =
    "UPDATE users SET name=?, email=?, gender=?, date_of_birth=? WHERE id=?";
  db.query(sql, [name, email, gender, date_of_birth, id], (err, result) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "✅ User updated successfully" });
  });
});

// 🔹 DELETE - Remove a user
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ User deleted successfully" });
  });
});

// ============ PATIENTS API ============

// 🔹 CREATE - Add new patient
app.post("/patients", (req, res) => {
  const {
    id_proof,
    id_number,
    name,
    gender,
    disease,
    deposit,
    ambulance_required,
  } = req.body;

  if (!id_number || !name) {
    return res.status(400).json({ error: "ID number and name are required" });
  }

  const sql =
    "INSERT INTO patients (id_proof, id_number, name, gender, disease, deposit, ambulance_required) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      id_proof,
      id_number,
      name,
      gender,
      disease,
      deposit,
      ambulance_required || 0,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "ID number already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: "✅ Patient added successfully",
        id: result.insertId,
      });
    },
  );
});

// 🔹 READ - Get all patients
app.get("/patients", (req, res) => {
  db.query(
    "SELECT * FROM patients ORDER BY admission_date DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

// 🔹 READ (by ID) - Get single patient
app.get("/patients/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM patients WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ message: "Patient not found" });
    res.json(result[0]);
  });
});

// 🔹 UPDATE - Edit patient details
app.put("/patients/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    gender,
    disease,
    deposit,
    status,
    ambulance_required,
    discharge_date,
  } = req.body;

  let sql;
  let params;

  if (status === "Discharged" && discharge_date) {
    sql =
      "UPDATE patients SET name=?, gender=?, disease=?, deposit=?, status=?, ambulance_required=?, discharge_date=? WHERE id=?";
    params = [
      name,
      gender,
      disease,
      deposit,
      status,
      ambulance_required || 0,
      discharge_date,
      id,
    ];
  } else {
    sql =
      "UPDATE patients SET name=?, gender=?, disease=?, deposit=?, status=?, ambulance_required=? WHERE id=?";
    params = [
      name,
      gender,
      disease,
      deposit,
      status,
      ambulance_required || 0,
      id,
    ];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "✅ Patient updated successfully" });
  });
});

// 🔹 DELETE - Remove a patient
app.delete("/patients/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM patients WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "✅ Patient deleted successfully" });
  });
});

// ============ DEPARTMENTS API ============

// 🔹 CREATE - Add new department
app.post("/departments", (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Department name is required" });
  }

  const sql = "INSERT INTO departments (name, description) VALUES (?, ?)";
  db.query(sql, [name, description], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Department already exists" });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "✅ Department added successfully",
      id: result.insertId,
    });
  });
});

// 🔹 READ - Get all departments
app.get("/departments", (req, res) => {
  db.query("SELECT * FROM departments", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 DELETE - Remove a department
app.delete("/departments/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM departments WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Department not found" });
    res.json({ message: "✅ Department deleted successfully" });
  });
});

// ============ ROOMS API ============

// 🔹 CREATE - Add new room
app.post("/rooms", (req, res) => {
  const { room_number, department_id, capacity } = req.body;

  if (!room_number) {
    return res.status(400).json({ error: "Room number is required" });
  }

  const sql =
    "INSERT INTO rooms (room_number, department_id, capacity) VALUES (?, ?, ?)";
  db.query(sql, [room_number, department_id, capacity], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Room number already exists" });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "✅ Room added successfully", id: result.insertId });
  });
});

// 🔹 READ - Get all rooms
app.get("/rooms", (req, res) => {
  db.query("SELECT * FROM rooms", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 GET - Get available rooms
app.get("/rooms/available/search", (req, res) => {
  db.query("SELECT * FROM rooms WHERE status='Available'", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 GET - Get unavailable rooms
app.get("/rooms/unavailable/search", (req, res) => {
  db.query("SELECT * FROM rooms WHERE status!='Available'", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 DELETE - Remove a room
app.delete("/rooms/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM rooms WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Room not found" });
    res.json({ message: "✅ Room deleted successfully" });
  });
});

// ============ AMBULANCES API ============

// 🔹 CREATE - Add new ambulance
app.post("/ambulances", (req, res) => {
  const {
    ambulance_id,
    vehicle_number,
    driver_name,
    driver_phone,
    type,
    status,
    location,
    oxygen_available,
  } = req.body;

  if (
    !vehicle_number ||
    !type ||
    !status ||
    typeof oxygen_available === "undefined"
  ) {
    return res
      .status(400)
      .json({
        error: "vehicle_number, type, status and oxygen_available are required",
      });
  }

  const sql =
    "INSERT INTO ambulances (ambulance_id, vehicle_number, driver_name, driver_phone, type, status, location, oxygen_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      ambulance_id || null,
      vehicle_number,
      driver_name || null,
      driver_phone || null,
      type,
      status,
      location || null,
      oxygen_available || 0,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .json({ error: "Vehicle number or ambulance ID already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: "✅ Ambulance added successfully",
        id: result.insertId,
      });
    },
  );
});

// 🔹 READ - Get all ambulances
app.get("/ambulances", (req, res) => {
  db.query("SELECT * FROM ambulances ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 READ (by ID) - Get single ambulance
app.get("/ambulances/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM ambulances WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ message: "Ambulance not found" });
    res.json(result[0]);
  });
});

// 🔹 UPDATE - Edit ambulance details
app.put("/ambulances/:id", (req, res) => {
  const { id } = req.params;
  const {
    ambulance_id,
    vehicle_number,
    driver_name,
    driver_phone,
    type,
    status,
    location,
    oxygen_available,
  } = req.body;

  const sql =
    "UPDATE ambulances SET ambulance_id=?, vehicle_number=?, driver_name=?, driver_phone=?, type=?, status=?, location=?, oxygen_available=? WHERE id=?";
  db.query(
    sql,
    [
      ambulance_id || null,
      vehicle_number,
      driver_name || null,
      driver_phone || null,
      type,
      status,
      location || null,
      oxygen_available || 0,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ SQL Error:", err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Ambulance not found" });
      res.json({ message: "✅ Ambulance updated successfully" });
    },
  );
});

// 🔹 DELETE - Remove an ambulance
app.delete("/ambulances/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM ambulances WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Ambulance not found" });
    res.json({ message: "✅ Ambulance deleted successfully" });
  });
});

// ============ EMPLOYEES API ============

// 🔹 CREATE - Add new employee
app.post("/employees", (req, res) => {
  const { name, email, position, department } = req.body;

  if (!name || !position || !department) {
    return res
      .status(400)
      .json({ error: "Name, position, and department are required" });
  }

  const sql =
    "INSERT INTO employees (name, email, position, department) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email || null, position, department], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Employee email already exists" });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "✅ Employee added successfully",
      id: result.insertId,
    });
  });
});

// 🔹 READ - Get all employees
app.get("/employees", (req, res) => {
  db.query("SELECT * FROM employees ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 READ (by ID) - Get single employee
app.get("/employees/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM employees WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ message: "Employee not found" });
    res.json(result[0]);
  });
});

// 🔹 UPDATE - Edit employee details
app.put("/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, position, department } = req.body;

  if (!name || !position || !department) {
    return res
      .status(400)
      .json({ error: "Name, position, and department are required" });
  }

  const sql =
    "UPDATE employees SET name=?, email=?, position=?, department=? WHERE id=?";
  db.query(
    sql,
    [name, email || null, position, department, id],
    (err, result) => {
      if (err) {
        console.error("❌ SQL Error:", err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Employee not found" });
      res.json({ message: "✅ Employee updated successfully" });
    },
  );
});

// 🔹 DELETE - Remove an employee
app.delete("/employees/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM employees WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "✅ Employee deleted successfully" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
