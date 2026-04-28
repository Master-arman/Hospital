import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import nodemailer from "nodemailer";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
let uploadsDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.warn("Could not create uploads dir in __dirname (read-only filesystem). Falling back to /tmp/uploads");
  uploadsDir = '/tmp/uploads';
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer for prescription file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Serve Static Frontend files from Express
app.use(express.static(path.join(__dirname, "../app/hospital-app/home-page")));
app.use('/uploads', express.static(uploadsDir));

// ================= DATABASE CONNECTION (MySQL) =================

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456789",
  database: process.env.DB_NAME || "arman",
  ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : undefined,
  connectionLimit: 10,
  waitForConnections: true,
});

// ================= HEALTH CHECK =================

app.get("/", (req, res) => {
  res.redirect("/home.html");
});

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
    const { patient_id, medicine_name, quantity, notes } = req.body;
    // Deduct stock
    const [med] = await pool.query("SELECT stock, name FROM medicines WHERE name=?", [medicine_name]);
    if (!med.length) return res.status(404).json({ error: "Medicine not found" });
    if (med[0].stock < quantity) return res.status(400).json({ error: `Not enough stock for ${med[0].name}. Only ${med[0].stock} left.` });

    await pool.query("UPDATE medicines SET stock = stock - ? WHERE name=?", [quantity, medicine_name]);
    const [result] = await pool.query(
      `INSERT INTO prescriptions (patient_id, medicine_name, quantity, notes) VALUES (?,?,?,?)`,
      [patient_id, medicine_name, quantity, notes || ""]
    );
    res.json({ message: "✅ Prescription added & stock deducted", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/prescriptions", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, pt.name as patient_name 
       FROM prescriptions p 
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
      `SELECT p.* 
       FROM prescriptions p 
       WHERE p.patient_id=? ORDER BY p.prescribed_at DESC`,
      [req.params.patientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= BILLING API =========================
// ======================================================

app.post("/api/billing", async (req, res) => {
  try {
    const { invoice_number, patient_name, amount, payment_mode, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO billing_receipts (invoice_number, patient_name, amount, payment_mode, status) VALUES (?,?,?,?,?)`,
      [invoice_number, patient_name, amount, payment_mode, status || 'pending']
    );
    res.json({ message: "✅ Billing receipt added", id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Invoice number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/billing", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM billing_receipts ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= AUTOMATED ALERTS =====================
// ======================================================

// Setup nodemailer transporter (using a test account or mock for now)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'test_user', // Replace with real credentials in production
      pass: 'test_pass'
  }
});

// Cron job to run every hour and check for unpaid bills > 48 hours
cron.schedule('0 * * * *', async () => {
  try {
    console.log("⏰ Running automated check for unpaid bills...");
    
    // Select bills that are pending and were created more than 48 hours ago
    const [unpaidBills] = await pool.query(`
      SELECT invoice_number, patient_name, amount, created_at 
      FROM billing_receipts 
      WHERE status = 'pending' 
      AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)
    `);

    if (unpaidBills.length > 0) {
      console.log(`⚠️ Found ${unpaidBills.length} unpaid bills older than 48 hours. Sending alert...`);
      
      let emailContent = "The following bills have been pending for more than 48 hours:\n\n";
      unpaidBills.forEach(bill => {
        emailContent += `- Invoice #${bill.invoice_number}: ${bill.patient_name} - $${bill.amount}\n`;
      });

      // Send email to accounting department
      /* Uncomment and configure transporter to actually send
      await transporter.sendMail({
        from: '"Hospital System" <noreply@hospital.com>',
        to: "accounting@hospital.com",
        subject: "🚨 ALERT: Unpaid Bills (>48 Hours)",
        text: emailContent,
      });
      */
      
      console.log("📧 Alert email generated for accounting department:\n", emailContent);
    } else {
      console.log("✅ No overdue bills found.");
    }
  } catch (error) {
    console.error("❌ Error in automated billing alert cron job:", error);
  }
});

// ======================================================
// ================= DELIVERY ADDRESSES API ==============
// ======================================================

app.post("/api/delivery-addresses", async (req, res) => {
  try {
    const { patient_id, address_line, city, pincode, phone, distance_km } = req.body;
    const [result] = await pool.query(
      `INSERT INTO delivery_addresses (patient_id, address_line, city, pincode, phone, distance_km) VALUES (?,?,?,?,?,?)`,
      [patient_id, address_line, city, pincode, phone, distance_km || 0]
    );
    res.json({ message: "✅ Address saved", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/delivery-addresses/:patientId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM delivery_addresses WHERE patient_id=? ORDER BY created_at DESC",
      [req.params.patientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================================
// ================= ORDERS API ==========================
// ======================================================

// Place a new order
app.post("/api/orders", upload.single('prescription'), async (req, res) => {
  try {
    const { patient_id, address_id, items, payment_method, delivery_type, is_monthly_refill, distance_km } = req.body;
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    // Calculate total price and validate stock
    let totalPrice = 0;
    for (const item of parsedItems) {
      const [med] = await pool.query("SELECT stock, price FROM medicines WHERE name=?", [item.medicine_name]);
      if (!med.length) return res.status(404).json({ error: `Medicine "${item.medicine_name}" not found` });
      if (med[0].stock < item.quantity) return res.status(400).json({ error: `Not enough stock for ${item.medicine_name}. Only ${med[0].stock} left.` });
      item.price = parseFloat(med[0].price);
      totalPrice += item.price * item.quantity;
    }

    // Calculate ETA: 30 min prep + 5 min per km
    const dist = parseFloat(distance_km) || 0;
    const etaMinutes = delivery_type === 'Hospital Pickup' ? 30 : Math.round(30 + dist * 5);

    // Determine next refill date
    let nextRefillDate = null;
    if (is_monthly_refill === '1' || is_monthly_refill === true) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      nextRefillDate = d.toISOString().split('T')[0];
    }

    const prescriptionFile = req.file ? req.file.filename : null;

    // Insert order
    const [orderResult] = await pool.query(
      `INSERT INTO orders (patient_id, address_id, total_price, payment_method, delivery_type, prescription_file, is_monthly_refill, next_refill_date, eta_minutes) VALUES (?,?,?,?,?,?,?,?,?)`,
      [patient_id, address_id || null, totalPrice, payment_method || 'Cash', delivery_type || 'Home Delivery', prescriptionFile, is_monthly_refill ? 1 : 0, nextRefillDate, etaMinutes]
    );
    const orderId = orderResult.insertId;

    // Insert items & deduct stock
    for (const item of parsedItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, medicine_name, quantity, price_at_purchase) VALUES (?,?,?,?)`,
        [orderId, item.medicine_name, item.quantity, item.price]
      );
      await pool.query("UPDATE medicines SET stock = stock - ? WHERE name=?", [item.quantity, item.medicine_name]);
    }

    res.json({ message: "✅ Order placed successfully", id: orderId, eta_minutes: etaMinutes, total_price: totalPrice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (admin queue)
app.get("/api/orders", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.name as patient_name, da.address_line, da.city, da.pincode, da.phone, da.distance_km
       FROM orders o
       JOIN patients p ON o.patient_id = p.id
       LEFT JOIN delivery_addresses da ON o.address_id = da.id
       ORDER BY o.created_at DESC`
    );
    // Attach items to each order
    for (const order of rows) {
      const [items] = await pool.query("SELECT * FROM order_items WHERE order_id=?", [order.id]);
      order.items = items;
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order
app.get("/api/orders/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.name as patient_name, da.address_line, da.city, da.pincode, da.phone, da.distance_km
       FROM orders o
       JOIN patients p ON o.patient_id = p.id
       LEFT JOIN delivery_addresses da ON o.address_id = da.id
       WHERE o.id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Order not found" });
    const order = rows[0];
    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id=?", [order.id]);
    order.items = items;
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders by patient
app.get("/api/orders/patient/:patientId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, da.address_line, da.city FROM orders o LEFT JOIN delivery_addresses da ON o.address_id = da.id WHERE o.patient_id=? ORDER BY o.created_at DESC`,
      [req.params.patientId]
    );
    for (const order of rows) {
      const [items] = await pool.query("SELECT * FROM order_items WHERE order_id=?", [order.id]);
      order.items = items;
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending Verification','Approved','Packed','Out for Delivery','Delivered','Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    // If cancelling, restore stock
    if (status === 'Cancelled') {
      const [items] = await pool.query("SELECT * FROM order_items WHERE order_id=?", [req.params.id]);
      for (const item of items) {
        await pool.query("UPDATE medicines SET stock = stock + ? WHERE name=?", [item.quantity, item.medicine_name]);
      }
    }

    await pool.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    res.json({ message: `✅ Order #${req.params.id} updated to: ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== AUTO-REFILL CRON (runs daily at midnight) =====
cron.schedule('0 0 * * *', async () => {
  try {
    console.log("🔄 Running daily auto-refill check...");
    const [dueOrders] = await pool.query(
      `SELECT o.*, da.distance_km FROM orders o LEFT JOIN delivery_addresses da ON o.address_id = da.id WHERE o.is_monthly_refill = 1 AND o.next_refill_date <= CURDATE() AND o.status = 'Delivered'`
    );

    for (const order of dueOrders) {
      const [items] = await pool.query("SELECT * FROM order_items WHERE order_id=?", [order.id]);
      let totalPrice = 0;
      let canRefill = true;

      for (const item of items) {
        const [med] = await pool.query("SELECT stock, price FROM medicines WHERE name=?", [item.medicine_name]);
        if (!med.length || med[0].stock < item.quantity) { canRefill = false; break; }
        totalPrice += parseFloat(med[0].price) * item.quantity;
      }

      if (!canRefill) {
        console.log(`⚠️ Cannot auto-refill order #${order.id} — insufficient stock`);
        continue;
      }

      const dist = parseFloat(order.distance_km) || 0;
      const etaMinutes = order.delivery_type === 'Hospital Pickup' ? 30 : Math.round(30 + dist * 5);
      const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + 30);

      const [newOrder] = await pool.query(
        `INSERT INTO orders (patient_id, address_id, total_price, payment_method, delivery_type, is_monthly_refill, next_refill_date, eta_minutes, status) VALUES (?,?,?,?,?,1,?,?,?)`,
        [order.patient_id, order.address_id, totalPrice, order.payment_method, order.delivery_type, nextDate.toISOString().split('T')[0], etaMinutes, 'Approved']
      );

      for (const item of items) {
        await pool.query(`INSERT INTO order_items (order_id, medicine_name, quantity, price_at_purchase) VALUES (?,?,?,?)`,
          [newOrder.insertId, item.medicine_name, item.quantity, item.price_at_purchase]);
        await pool.query("UPDATE medicines SET stock = stock - ? WHERE name=?", [item.quantity, item.medicine_name]);
      }

      // Mark original order's next_refill_date forward
      await pool.query("UPDATE orders SET next_refill_date=? WHERE id=?", [nextDate.toISOString().split('T')[0], order.id]);
      console.log(`✅ Auto-refill order #${newOrder.insertId} created from original #${order.id}`);
    }
  } catch (err) {
    console.error("❌ Auto-refill cron error:", err);
  }
});

// ======================================================
// START SERVER (for local development)
// ======================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Hospital API running on http://localhost:${PORT}`);
  console.log(`✅ Backend successfully connected to frontend!`);
  console.log(`✅ Successfully complete. hn complete ho gaya hai!`);
});

export default app;
