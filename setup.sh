#!/bin/bash

# Update and install necessary packages
echo "Updating and installing dependencies..."
sudo apt update -y
sudo apt install -y containerd docker.io nodejs npm mysql-server git

# Start and enable Docker
echo "Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Start MySQL service
echo "Starting MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Check if MySQL is running
if ! systemctl is-active --quiet mysql; then
    echo "MySQL failed to start. Please check MySQL logs."
    exit 1
fi

# Clone the LS-Cloud repository
echo "Cloning LS-Cloud repository..."
git clone https://github.com/stealhost/ls-cloud.git
cd ls-cloud

# Create package.json for backend if it does not exist
if [ ! -f backend/package.json ]; then
    echo "Creating package.json for backend..."
    cat <<EOF > backend/package.json
{
  "name": "ls-cloud-backend",
  "version": "1.0.0",
  "description": "Backend for LS-Cloud",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "mysql": "^2.18.1",
    "dockerode": "^3.2.0"
  },
  "author": "",
  "license": "ISC"
}
EOF
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd backend
npm install

# Set up MySQL database
echo "Setting up MySQL database..."
mysql -u root -p <<EOF
CREATE DATABASE ls_cloud_db;
USE ls_cloud_db;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
);
EOF

# Run the backend server
echo "Starting backend server..."
cd ..
nohup node backend/server.js &

# Finished
echo "LS-Cloud setup is complete! You can access it at http://your-vps-ip:3000"
