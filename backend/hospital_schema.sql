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

