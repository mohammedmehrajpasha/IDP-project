-- USERS TABLE
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSPECTORS TABLE
CREATE TABLE inspectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  zone_id INT,
  FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- ADMINS TABLE
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  zone_id INT,
  FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- ZONES TABLE
CREATE TABLE zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- RESTAURANTS TABLE
CREATE TABLE restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  image_url TEXT,
  region VARCHAR(100),
  zone_id INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  added_by_inspector_id INT,
  FOREIGN KEY (zone_id) REFERENCES zones(id),
  FOREIGN KEY (added_by_inspector_id) REFERENCES inspectors(id)
);

-- INSPECTION SCHEDULES TABLE
CREATE TABLE inspection_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT,
  inspector_id INT,
  scheduled_date DATE NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (inspector_id) REFERENCES inspectors(id)
);

-- INSPECTION REPORTS TABLE
CREATE TABLE inspection_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT,
  inspector_id INT,
  report_date DATE,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  zone_id INT,
  region VARCHAR(100),
  image_urls JSON,
  hygiene JSON,
  premises JSON,
  food_storage JSON,
  equipment JSON,
  waste_disposal JSON,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (inspector_id) REFERENCES inspectors(id),
  FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- HYGIENE CHECKLIST TABLE
CREATE TABLE hygiene_checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT,
  category VARCHAR(50),
  criteria TEXT,
  checked BOOLEAN,
  FOREIGN KEY (report_id) REFERENCES inspection_reports(id)
);

-- FAVORITES TABLE
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  restaurant_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- COMPLAINTS TABLE
CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  restaurant_id INT,
  complaint TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
