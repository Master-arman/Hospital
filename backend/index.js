import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();

app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION (MySQL) =================

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "root",
  database: "arman",
  connectionLimit: 10,
  waitForConnections: true,
});

// ================= HEALTH CHECK =================

app.get("/api", (req, res) => {
  res.json({ status: "✅ API is working" });
});

// ======================================================
// ================= USERS API ===========================
// ======================================================

app.post("/api/users", async (req, res) => {
  try {
    const { name, email, gender, date_of_birth } = req.body;
    const [result] = await pool.query(
      `INSERT INTO users (name, email, gender, date_of_birth) VALUES (?,?,?,?)`,
      [name, email, gender, date_of_birth]
    );
    res.json({ message: "✅ User added successfully", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id=?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    let { name, email, gender, date_of_birth } = req.body;
    if (date_of_birth?.includes("T")) date_of_birth = date_of_birth.split("T")[0];
    await pool.query(
      `UPDATE users SET name=?, email=?, gender=?, date_of_birth=? WHERE id=?`,
      [name, email, gender, date_of_birth, req.params.id]
    );
    res.json({ message: "✅ User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ message: "🗑️ User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= PATIENTS API ========================
// ======================================================

app.post("/api/patients", async (req, res) => {
  try {
    const { id_proof, id_number, name, gender, disease, deposit, ambulance_required } = req.body;
    if (!id_number || !name) return res.status(400).json({ error: "ID number and name required" });
    const [result] = await pool.query(
      `INSERT INTO patients (id_proof,id_number,name,gender,disease,deposit,ambulance_required) VALUES (?,?,?,?,?,?,?)`,
      [id_proof, id_number, name, gender, disease, deposit, ambulance_required || 0]
    );
    res.json({ message: "✅ Patient added successfully", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients ORDER BY admission_date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/search", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;
    const [rows] = await pool.query(
      `SELECT id, name, id_number, disease, status FROM patients WHERE name LIKE ? OR id_number LIKE ? OR CAST(id AS CHAR) LIKE ? ORDER BY name LIMIT 10`,
      [q, q, q]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients WHERE id=?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Patient not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/patients/:id", async (req, res) => {
  try {
    const { name, gender, disease, deposit, status, ambulance_required, discharge_date } = req.body;
    await pool.query(
      `UPDATE patients SET name=?,gender=?,disease=?,deposit=?,status=?,ambulance_required=?,discharge_date=? WHERE id=?`,
      [name, gender, disease, deposit, status, ambulance_required, discharge_date, req.params.id]
    );
    res.json({ message: "✅ Patient updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/patients/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM patients WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= DEPARTMENTS API =====================
// ======================================================

app.post("/api/departments", async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.query(
      `INSERT INTO departments(name,description) VALUES(?,?)`, [name, description]
    );
    res.json({ message: "✅ Department added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/departments", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM departments");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/departments/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM departments WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Department deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= ROOMS API ===========================
// ======================================================

app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rooms");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= EMPLOYEES API =======================
// ======================================================

app.post("/api/employees", async (req, res) => {
  try {
    const { name, email, position, department } = req.body;
    const [result] = await pool.query(
      `INSERT INTO employees(name,email,position,department) VALUES(?,?,?,?)`,
      [name, email, position, department]
    );
    res.json({ message: "✅ Employee added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM employees ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= AMBULANCES API ======================
// ======================================================

app.get("/api/ambulances", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM ambulances ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= MEDICINES API =======================
// ======================================================

app.get("/api/medicines", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM medicines ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/medicines/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM medicines WHERE id=?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Medicine not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/medicines", async (req, res) => {
  try {
    const { name, category, stock, expiry_date, price, supplier } = req.body;
    if (!name) return res.status(400).json({ error: "Medicine name required" });
    const [result] = await pool.query(
      `INSERT INTO medicines (name, category, stock, expiry_date, price, supplier) VALUES (?,?,?,?,?,?)`,
      [name, category || "Tablet", stock || 0, expiry_date, price || 0, supplier || ""]
    );
    res.json({ message: "✅ Medicine added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/medicines/:id", async (req, res) => {
  try {
    const { name, category, stock, expiry_date, price, supplier } = req.body;
    await pool.query(
      `UPDATE medicines SET name=?, category=?, stock=?, expiry_date=?, price=?, supplier=? WHERE id=?`,
      [name, category, stock, expiry_date, price, supplier, req.params.id]
    );
    res.json({ message: "✅ Medicine updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/medicines/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM medicines WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Medicine deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications: low stock + expiring soon
app.get("/api/medicines/alerts/all", async (req, res) => {
  try {
    const [lowStock] = await pool.query(
      "SELECT id, name, stock FROM medicines WHERE stock < 10 ORDER BY stock ASC"
    );
    const [expiringSoon] = await pool.query(
      "SELECT id, name, expiry_date FROM medicines WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) AND expiry_date >= CURDATE() ORDER BY expiry_date ASC"
    );
    const [expired] = await pool.query(
      "SELECT id, name, expiry_date FROM medicines WHERE expiry_date < CURDATE() ORDER BY expiry_date ASC"
    );
    res.json({ lowStock, expiringSoon, expired });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= PRESCRIPTIONS API ===================
// ======================================================

app.post("/api/prescriptions", async (req, res) => {
  try {
    const { patient_id, medicine_id, quantity, notes } = req.body;
    // Deduct stock
    const [med] = await pool.query("SELECT stock, name FROM medicines WHERE id=?", [medicine_id]);
    if (!med.length) return res.status(404).json({ error: "Medicine not found" });
    if (med[0].stock < quantity) return res.status(400).json({ error: `Not enough stock for ${med[0].name}. Only ${med[0].stock} left.` });

    await pool.query("UPDATE medicines SET stock = stock - ? WHERE id=?", [quantity, medicine_id]);
    const [result] = await pool.query(
      `INSERT INTO prescriptions (patient_id, medicine_id, quantity, notes) VALUES (?,?,?,?)`,
      [patient_id, medicine_id, quantity, notes || ""]
    );
    res.json({ message: "✅ Prescription added & stock deducted", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/prescriptions", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, m.name as medicine_name, m.category, pt.name as patient_name 
       FROM prescriptions p 
       JOIN medicines m ON p.medicine_id = m.id 
       JOIN patients pt ON p.patient_id = pt.id 
       ORDER BY p.prescribed_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/prescriptions/patient/:patientId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, m.name as medicine_name, m.category 
       FROM prescriptions p 
       JOIN medicines m ON p.medicine_id = m.id 
       WHERE p.patient_id=? ORDER BY p.prescribed_at DESC`,
      [req.params.patientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// START SERVER (for local development)
// ======================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Hospital API running on http://localhost:${PORT}`);
});

export default app;
