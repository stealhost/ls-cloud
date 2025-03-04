const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection (Environment Variables Required)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

// User Authentication
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role || 'user'], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "User registered" });
        });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// VPS Management APIs
app.post('/create-vps', (req, res) => {
    const { userId, os, ram, cpu, storage } = req.body;
    const ipAddress = `192.168.1.${Math.floor(Math.random() * 255)}`;
    const port = Math.floor(10000 + Math.random() * 50000);

    db.query('INSERT INTO vps_instances (user_id, os, ram, cpu, storage, ip_address, port, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, os, ram, cpu, storage, ipAddress, port, 'running'], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            exec(`docker run -d --name vps_${result.insertId} --memory=${ram}m --cpus=${cpu} -p ${port}:22 ubuntu`,
                (error, stdout, stderr) => {
                    if (error) return res.status(500).json({ error: stderr });
                    res.json({ message: "VPS created", instanceId: result.insertId, ip: ipAddress, port });
                }
            );
        });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
