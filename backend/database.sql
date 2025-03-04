CREATE DATABASE ls_cloud;
USE ls_cloud;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'owner') DEFAULT 'user'
);

CREATE TABLE vps_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    os VARCHAR(50),
    ram INT DEFAULT 2048,
    cpu INT DEFAULT 1,
    storage INT DEFAULT 20,
    ip_address VARCHAR(15),
    port INT DEFAULT 22,
    status ENUM('running', 'stopped') DEFAULT 'stopped',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
