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

CREATE TABLE inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT,
  inspector_id INT,
  inspection_date DATE,
  hygiene_score INT CHECK (hygiene_score BETWEEN 1 AND 5),
  comments TEXT,
  images TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE restaurants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  license_number VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(15),
  zone VARCHAR(100),
  region VARCHAR(100),
  address TEXT,
  status ENUM('pending', 'approved','rejected') DEFAULT 'pending',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_inspection_date DATE DEFAULT NULL
);


INSERT INTO restaurants (id, name, license_number, email, phone, zone, region, address, status, created_by)
VALUES
(1, 'Spice Hub', 'LIC12345', 'spicehub@gmail.com', '9876543210', 'Bangalore South', 'Kengeri', '12, Kengeri Main Rd', 'approved', 101),
(2, 'Green Leaf', 'LIC67890', 'greenleaf@gmail.com', '9123456789', 'Bangalore South', 'Pattanagere', '78, JP Nagar', 'approved', 102),
(3, 'Tandoori Treat', 'LIC11122', 'treat@gmail.com', '9988776655', 'Bangalore Central', 'Indiranagar', '45, CMH Road', 'pending', 104),
(4, 'Chennai Flavours', 'LIC33344', 'cf@gmail.com', '9080706050', 'Chennai North', 'Red Hills', '56, Red Hills Rd', 'approved', 106),
(7, 'Spice Hub111', 'LIC12346', 'spicehub@gmail.com', '9876543210', 'Banglore South', 'Kengeri', '12, Kengeri Main Rd', 'approved', 101),
(8, 'Spice Hub112', 'LIC12346', 'spicehub@gmail.com', '9876543210', 'Banglore South', 'Kengeri', '12, Kengeri Main Rd', 'approved', 101),
(9, 'Spice Hub113', 'LIC12346', 'spicehub@gmail.com', '9876543210', 'Banglore South', 'Kengeri', '12, Kengeri Main Rd', 'approved', 101),
(10, 'Spice Hub114', 'LIC12346', 'spicehub@gmail.com', '9876543210', 'Banglore South', 'Kengeri', '12, Kengeri Main Rd', 'approved', 101);

CREATE TABLE inspections (
    id INT NOT NULL AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    inspector_id INT NOT NULL,
    status ENUM('Scheduled', 'Not-Scheduled','Completed') NOT NULL,
    last_inspection DATE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
);

 INSERT INTO inspections (restaurant_id, inspector_id, status, last_inspection) VALUES
 (1, 1, 'Scheduled', '2025-06-10'),
 (2, 1, 'Not-Scheduled', '2025-06-05'),
 (3, 1, 'Scheduled', '2025-05-30'),
 (4, 1, 'Not-Scheduled', '2025-05-20'),
 (8, 1, 'Scheduled', '2025-06-11');

CREATE TABLE inspection_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inspection_id INT,
  inspector_id INT,
  restaurant_id INT,
  report_json JSON NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  FOREIGN KEY (inspection_id) REFERENCES inspections(id),
  FOREIGN KEY (inspector_id) REFERENCES inspectors(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

drop table users;

CREATE TABLE users (
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL PRIMARY KEY,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL
);
