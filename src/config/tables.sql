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
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password VARCHAR(255),
    zone VARCHAR(100),
    region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password VARCHAR(255),
    zone VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, phone, password, assigned_region)
VALUES 
('Ananya Sharma', 'ananya.sharma@example.com', '9876543210', 'pass123', 'Delhi Central'),
('Ravi Mehra', 'ravi.mehra@example.com', '9123456780', 'pass123', 'Bangalore North'),
('Pooja Reddy', 'pooja.reddy@example.com', '9988776655', 'pass123', 'Hyderabad South');

INSERT INTO admins (name, email, phone, password, zone)
VALUES 
('Meera Joshi', 'admin@gmail.com', '9876543210', 'pass123', 'Banglore South'),
('Ravi Kumar', 'admin2@gmail.com', '9123456789', 'pass123', 'Banglore Central'),
('Sneha Shah', 'admin3@gmail.com', '9012345678', 'pass123', 'Chennai North');

INSERT INTO inspectors (name, email, phone, password, zone, region)
VALUES 
('Karthik Rao', 'insp@gmail.com', '7890123456', 'pass123', 'Banglore South', 'Kengeri'),
('Anjali Menon', 'insp2@gmail.com', '7890654321', 'pass123', 'Banglore South', 'Pattanagere'),
('Vikram Singh', 'insp3@gmail.com', '8989898989', 'pass123', 'Banglore South', 'Nayandahalli'),
('Neha Verma', 'insp4@gmail.com', '9090909090', 'pass123', 'Banglore Central', 'Indiranagar'),
('Sameer Patil', 'insp5@gmail.com', '8787878787', 'pass123', 'Banglore Central', 'Koramangala'),
('Pooja Reddy', 'insp6@gmail.com', '8980077000', 'pass123', 'Chennai North', 'Red Hills'),
('Aman Bhatt', 'insp7@gmail.com', '8567452301', 'pass123', 'Chennai North', 'Minjur');



