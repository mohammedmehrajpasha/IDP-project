create database fssai;
use fssai;

CREATE TABLE users (
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL PRIMARY KEY,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    assigned_region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inspectors (
    user_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    assigned_region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    user_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    assigned_region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, phone, password, assigned_region)
VALUES 
('Ananya Sharma', 'ananya.sharma@example.com', '9876543210', 'pass123', 'Delhi Central'),
('Ravi Mehra', 'ravi.mehra@example.com', '9123456780', 'pass123', 'Bangalore North'),
('Pooja Reddy', 'pooja.reddy@example.com', '9988776655', 'pass123', 'Hyderabad South');

INSERT INTO inspectors (user_id, name, email, phone, password, assigned_region)
VALUES 
(1, 'Karthik Rao', 'karthik.rao@fssai.gov.in', '9876543211', 'pass123', 'Mumbai East'),
(2, 'Sunita Deshmukh', 'sunita.deshmukh@fssai.gov.in', '9123456790', 'pass123', 'Banglore South'),
(3, 'Naveen Thomas', 'naveen.thomas@fssai.gov.in', '9988776656', 'pass123', 'Chennai South');

INSERT INTO admins (user_id, name, email, phone, password, assigned_region)
VALUES 
(1, 'Deepak Iyer', 'deepak.iyer@fssai.gov.in', '9876543212', 'pass123', 'Banglore South'),
(2, 'Meera Joshi', 'meera.joshi@fssai.gov.in', '9123456791', 'pass123', 'West Zone HQ'),
(3, 'Deepak Iyer', 'admin@gmail.com', '9876543212', 'pass123', 'Banglore South');

