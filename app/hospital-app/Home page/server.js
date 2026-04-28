// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool for handling high request volumes
const pool = mysql.createPool({
    host: 127.0.0.1 ,
    port: 3306,
    user: root,
    password: root,
    database: hospital,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000
});

