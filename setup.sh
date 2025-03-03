#!/bin/bash

# Update and install necessary packages
echo "Updating and installing dependencies..."
sudo apt update -y
sudo apt install -y docker.io nodejs npm mysql-server git

# Start and enable Docker
echo "Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Clone the LS-Cloud repository (assuming it's in your directory)
echo "Cloning LS-Cloud repository..."
git clone https://github.com/stealhost/ls-cloud.git
cd ls-cloud

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
