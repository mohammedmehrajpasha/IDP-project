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

CREATE TABLE restaurants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  contact_person VARCHAR(100),
  license_number VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(15),
  zone VARCHAR(100),
  region VARCHAR(100),
  address TEXT,
  status ENUM('pending', 'approved','rejected') DEFAULT 'pending',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_inspection_date DATE DEFAULT NULL,
  hygiene_score DECIMAL(2,1) CHECK (hygiene_score BETWEEN 1.0 AND 5.0)
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
  status ENUM('Scheduled', 'Not-Scheduled', 'Completed') NOT NULL DEFAULT 'Not-Scheduled',
  inspection_date DATE DEFAULT NULL, -- The scheduled date
  last_inspection DATE DEFAULT NULL, -- The date the inspection was actually completed
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES inspectors(id) ON DELETE CASCADE
);

INSERT INTO inspections (restaurant_id, inspector_id, status, last_inspection, inspection_date) VALUES
(1, 1, 'Completed', '2025-06-10', '2025-06-12'),
(2, 1, 'Not-Scheduled', '2025-06-05', NULL),
(3, 1, 'Scheduled', '2025-05-30', '2025-06-14'),
(4, 1, 'Not-Scheduled', '2025-05-20', NULL),
(8, 2, 'Scheduled', '2025-06-11', '2025-06-15');

CREATE TABLE inspection_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inspection_id INT NOT NULL,
  inspector_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  report_json JSON,
  notes TEXT,
  image_paths JSON, -- e.g. ["D:/images/image1.jpg", "D:/images/image2.jpg"]
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  hygiene_score DECIMAL(2,1) CHECK (hygiene_score BETWEEN 1.0 AND 5.0),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES inspectors(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);


INSERT INTO inspection_reports (inspection_id, inspector_id, restaurant_id, report_json, submitted_at, status)
VALUES 
(16, 1, 1, 
  JSON_OBJECT(
    'personalHygiene', JSON_OBJECT(
      'nailsTrimmed', true,
      'cleanUniform', true,
      'handWashing', true
    ),
    'premisesCleanliness', JSON_OBJECT(
      'floorsClean', true,
      'noPests', true,
      'wallsClean', false
    ),
    'foodStorage', JSON_OBJECT(
      'temperatureControl', true,
      'segregationRawCooked', true
    ),
    'equipment', JSON_OBJECT(
      'equipmentCleaned', true,
      'noRust', false
    ),
    'wasteManagement', JSON_OBJECT(
      'binsCovered', true,
      'dailyDisposal', true
    )
  ),
  NOW(), 'approved'
),
(17, 1, 9, 
  JSON_OBJECT(
    'personalHygiene', JSON_OBJECT(
      'nailsTrimmed', false,
      'cleanUniform', false,
      'handWashing', true
    ),
    'premisesCleanliness', JSON_OBJECT(
      'floorsClean', true,
      'noPests', false,
      'wallsClean', false
    ),
    'foodStorage', JSON_OBJECT(
      'temperatureControl', false,
      'segregationRawCooked', true
    ),
    'equipment', JSON_OBJECT(
      'equipmentCleaned', false,
      'noRust', false
    ),
    'wasteManagement', JSON_OBJECT(
      'binsCovered', false,
      'dailyDisposal', false
    )
  ),
  NOW(), 'rejected'
),
(18, 1, 7, 
  JSON_OBJECT(
    'personalHygiene', JSON_OBJECT(
      'nailsTrimmed', true,
      'cleanUniform', true,
      'handWashing', true
    ),
    'premisesCleanliness', JSON_OBJECT(
      'floorsClean', true,
      'noPests', true,
      'wallsClean', true
    ),
    'foodStorage', JSON_OBJECT(
      'temperatureControl', true,
      'segregationRawCooked', true
    ),
    'equipment', JSON_OBJECT(
      'equipmentCleaned', true,
      'noRust', true
    ),
    'wasteManagement', JSON_OBJECT(
      'binsCovered', true,
      'dailyDisposal', true
    )
  ),
  NOW(), 'pending'
);

CREATE TABLE users (
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL PRIMARY KEY,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL
);




CREATE TABLE favorites (
user_id VARCHAR(255),
restaurant_id INT,
PRIMARY KEY (user_id, restaurant_id),
FOREIGN KEY (user_id) REFERENCES users(email),
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);


CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id varchar(255),
  restaurant_id INT,
  message TEXT,
  status ENUM('pending', 'in_review', 'resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(email),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
