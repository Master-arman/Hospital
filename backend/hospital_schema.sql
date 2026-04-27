-- Hospital Management System Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS arman;
USE arman;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  gender ENUM('Male', 'Female', 'Other'),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_proof VARCHAR(50) NOT NULL,
  id_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender ENUM('Male', 'Female', 'Other'),
  disease VARCHAR(200),
  deposit DECIMAL(10, 2),
  ambulance_required TINYINT(1) DEFAULT 0,
  admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  discharge_date DATETIME,
  status ENUM('Active', 'Discharged', 'Deceased') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  position VARCHAR(50),
  department VARCHAR(100),
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  head_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (head_id) REFERENCES employees(id)
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  department_id INT,
  capacity INT DEFAULT 1,
  status ENUM('Available', 'Occupied', 'Maintenance') DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Patient Admission Details
CREATE TABLE IF NOT EXISTS patient_admission (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  room_id INT,
  department_id INT,
  admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  discharge_date DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Ambulances Table
CREATE TABLE IF NOT EXISTS ambulances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ambulance_id VARCHAR(50) UNIQUE,
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  driver_name VARCHAR(100),
  driver_phone VARCHAR(30),
  type ENUM('Basic','ICU','Ventilator') NOT NULL,
  status ENUM('Available','On Duty','Maintenance') DEFAULT 'Available',
  location VARCHAR(255),
  oxygen_available TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category ENUM('Tablet','Syrup','Injection','Capsule','Ointment','Drops','Inhaler','Powder') DEFAULT 'Tablet',
  stock INT DEFAULT 0,
  expiry_date DATE,
  price DECIMAL(10,2) DEFAULT 0.00,
  supplier VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medicine_name VARCHAR(150) NOT NULL,
  quantity INT DEFAULT 1,
  notes TEXT,
  prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ================= SAMPLE MEDICINES DATA =================
INSERT INTO medicines (name, category, stock, expiry_date, price, supplier) VALUES
('Paracetamol 500mg',    'Tablet',    150, '2027-06-15', 2.50,  'Sun Pharma'),
('Amoxicillin 250mg',    'Capsule',   85,  '2026-12-20', 8.00,  'Cipla Ltd'),
('Ibuprofen 400mg',      'Tablet',    200, '2027-03-10', 3.75,  'Dr. Reddy'),
('Cetirizine 10mg',      'Tablet',    300, '2027-09-01', 1.50,  'Mankind Pharma'),
('Azithromycin 500mg',   'Tablet',    45,  '2026-08-25', 15.00, 'Zydus Cadila'),
('Cough Syrup (Benadryl)','Syrup',    60,  '2026-11-15', 65.00, 'Johnson & Johnson'),
('Insulin Glargine',     'Injection', 25,  '2026-07-10', 450.00,'Novo Nordisk'),
('Omeprazole 20mg',      'Capsule',   120, '2027-04-20', 5.00,  'Sun Pharma'),
('Metformin 500mg',      'Tablet',    180, '2027-08-12', 4.00,  'USV Pvt Ltd'),
('Amlodipine 5mg',       'Tablet',    90,  '2027-01-30', 6.50,  'Torrent Pharma'),
('Salbutamol Inhaler',   'Inhaler',   8,   '2026-09-05', 120.00,'Cipla Ltd'),
('Betadine Ointment',    'Ointment',  40,  '2027-05-18', 35.00, 'Win-Medicare'),
('Diclofenac Gel',       'Ointment',  55,  '2027-02-28', 28.00, 'Novartis'),
('ORS Powder',           'Powder',    5,   '2026-06-30', 12.00, 'FDC Ltd'),
('Ciprofloxacin 500mg',  'Tablet',    7,   '2026-10-12', 10.00, 'Ranbaxy'),
('Pantoprazole 40mg',    'Tablet',    110, '2027-07-22', 7.00,  'Alkem Labs'),
('Eye Drops (Moxiflox)', 'Drops',     30,  '2026-08-01', 55.00, 'Allergan'),
('Dolo 650mg',           'Tablet',    250, '2027-11-05', 3.00,  'Micro Labs'),
('Vitamin D3 60K',       'Capsule',   75,  '2027-10-15', 25.00, 'Mankind Pharma'),
('Ranitidine 150mg',     'Tablet',    3,   '2026-05-20', 4.50,  'GSK'),
('Amikacin Injection',   'Injection', 15,  '2026-09-30', 85.00, 'Cipla Ltd'),
('Levofloxacin 500mg',   'Tablet',    65,  '2027-03-25', 12.00, 'Glenmark'),
('Multivitamin Syrup',   'Syrup',     42,  '2027-06-10', 75.00, 'Abbott India'),
('B-Complex Forte',      'Tablet',    9,   '2026-07-18', 8.50,  'Abbott India');

-- Billing Receipts Table
CREATE TABLE IF NOT EXISTS billing_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  patient_name VARCHAR(150) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_mode VARCHAR(50),
  status ENUM('pending', 'paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= ONLINE MEDICINE DELIVERY =================

-- Delivery Addresses
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  distance_km DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
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
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  medicine_name VARCHAR(150) NOT NULL,
  quantity INT DEFAULT 1,
  price_at_purchase DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
