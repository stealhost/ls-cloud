const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jwt-simple');
const bcrypt = require('bcryptjs');
const exec = require('child_process').exec;

const app = express();
const port = 3000;

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_mysql_password',  // Replace with your MySQL root password
  database: 'ls_cloud_db'
});

db.connect(err => {
  if (err) {
    console.log('Error connecting to DB: ', err);
    return;
  }
  console.log('Connected to MySQL');
  
  // Check if the admin user exists, if not, create it
  db.query('SELECT * FROM users WHERE username = "oonice"', (err, result) => {
    if (err) {
      console.log('Error checking admin user: ', err);
      return;
    }
    
    if (result.length === 0) {
      const hashedPassword = bcrypt.hashSync('lscloudadmin@54321', 10);
      db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['oonice', hashedPassword, 'admin'], (err, result) => {
        if (err) {
          console.log('Error inserting admin user: ', err);
        } else {
          console.log('Admin user created');
        }
      });
    }
  });
});

// Middleware
app.use(bodyParser.json());

// Example Endpoint: User Registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'user'], (err, result) => {
    if (err) {
      res.status(500).send('Error registering user');
      return;
    }
    res.status(200).send('User registered successfully');
  });
});

// Example Endpoint: User Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
    if (err || result.length === 0) {
      return res.status(400).send('Invalid credentials');
    }
    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }
    const token = jwt.encode({ id: user.id, role: user.role }, 'your_jwt_secret');
    res.status(200).json({ token });
  });
});

// Example Endpoint: Create VPS Instance (Using Docker)
app.post('/create-instance', (req, res) => {
  const { userId, ram, cpu, os } = req.body;  // Get user input
  
  // Generate a unique container name or ID
  const containerName = \`vps-\${userId}-\${Date.now()}\`;

  // Example Docker command to create a container
  const dockerCommand = \`docker run -d --name \${containerName} --memory=\${ram} --cpus=\${cpu} \${os}\`;

  // Execute Docker command
  exec(dockerCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(\`Error creating VPS: \${error}\`);
      return res.status(500).send('Error creating VPS instance');
    }
    
    console.log(\`VPS Instance Created: \${stdout}\`);
    res.status(200).send('VPS instance created successfully');
  });
});

// Start Server
app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});
