const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/dbConnect');

router.get('/inspectorLogin',(req,res)=>{
    res.render('inspectorLogin');
  })

router.post('/inspectorLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('inspectorLogin', { error: "All fields are required" });
  }

  try {
    const [results] = await db.query("SELECT * FROM inspectors WHERE email = ?", [email]);

    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).render('inspectorLogin', { error: "Invalid ID or password" });
    }

    req.session.zone = results[0].zone;
    req.session.inspectorName = results[0].name;
    req.session.region=results[0].region;
    req.session.ID=results[0].id;
    res.redirect('inspector/dashboard');
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).render('inspectorLogin', { error: "Internal server error" });
  }
});

  router.get('/inspector/dashboard', async (req, res) => {
  const inspectorId = req.session.ID;
  const inspectorName = req.session.inspectorName || 'Inspector';
  const zone = req.session.zone;
  const region = req.session.region;

  if (!inspectorId || !zone || !region) {
    return res.redirect('/inspectorLogin'); // Or show error
  }

  try {
    // Stats for inspector
    const [[approvedRestaurants]] = await db.query(
      `SELECT COUNT(*) AS count FROM restaurants WHERE zone = ? AND region = ? AND status = 'approved'`,
      [zone, region]
    );

    const [[pendingRestaurants]] = await db.query(
      `SELECT COUNT(*) AS count FROM restaurants WHERE zone = ? AND region = ? AND status = 'pending'`,
      [zone, region]
    );

    const [[scheduledInspections]] = await db.query(
      `SELECT COUNT(*) AS count FROM inspections WHERE inspector_id = ? AND status = 'Scheduled'`,
      [inspectorId]
    );

    const [[completedThisMonth]] = await db.query(
      `SELECT COUNT(*) AS count FROM inspections WHERE inspector_id = ? AND status = 'Completed' AND MONTH(last_inspection) = MONTH(CURDATE()) AND YEAR(last_inspection) = YEAR(CURDATE())`,
      [inspectorId]
    );

    const stats = {
      approvedRestaurants: approvedRestaurants.count,
      pendingRestaurants: pendingRestaurants.count,
      scheduledInspections: scheduledInspections.count,
      completedInspections: completedThisMonth.count
    };

    // Today’s scheduled inspections
    const [todaysInspections] = await db.query(
      `SELECT i.id, i.inspection_date AS scheduled_date, r.name AS restaurant_name, r.address
       FROM inspections i
       JOIN restaurants r ON i.restaurant_id = r.id
       WHERE i.inspector_id = ?
         AND i.status = 'Scheduled'
         AND i.inspection_date = CURDATE()`,
      [inspectorId]
    );

    res.render('inspectorDashboard', {
      inspectorName,
      zone,
      region,
      stats,
      todaysInspections
    });

  } catch (err) {
    console.error('Error loading inspector dashboard:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard data.' });
  }
});


  router.get('/inspector/inspections/scheduled', async (req, res) => {
  const inspectorId = req.session.ID; // Or however you store logged-in user
  if (!inspectorId) return res.redirect('/inspectorLogin');

  try {
    const [rows] = await db.query(`
      SELECT i.*, r.name, r.license_number, r.address, r.contact_person
      FROM inspections i
      JOIN restaurants r ON i.restaurant_id = r.id
      WHERE i.inspector_id = ? AND i.status = 'Scheduled'
      ORDER BY i.inspection_date ASC
    `, [inspectorId]);

    res.render('scheduledInspections', { inspections: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



  // GET route
router.get('/inspector/restaurants/add', (req, res) => {
  const { zone, region, inspectorName } = req.session;
  const success = req.query.success;

  if (!zone || !region) {
    return res.status(403).render('error', { message: 'Unauthorized access. Session expired or not found.' });
  }

  res.render('addRestaurant', { zone, region, inspectorName, success });
});

// POST route
router.post('/inspector/restaurants/add', async (req, res) => {
  const { name, license_number, contact_person, phone, email, address } = req.body;
  const { zone, region, ID } = req.session;

  try {
    await db.query(`
      INSERT INTO restaurants 
      (name, license_number, contact_person, phone, email, address, zone, region, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, license_number, contact_person, phone, email, address, zone, region, ID]);

    res.redirect('/inspector/restaurants/add?success=1');
  } catch (err) {
    console.error('Error adding restaurant:', err);
    res.status(500).render('error', { message: 'Failed to add restaurant.' });
  }
});

  
  // routes/inspector.js

router.get('/inspector/restaurants', async (req, res) => {
  const zone = req.session.zone;
  const region = req.session.region;
  const inspectorName = req.session.inspectorName || "Inspector";

  try {
    const [restaurants] = await db.query(`
      SELECT id, name, contact_person, license_number, email, phone, zone, region, address, status, hygiene_score, created_at, last_inspection_date
      FROM restaurants
      WHERE zone = ? AND region = ? AND status = 'approved'
    `, [zone, region]);

    res.render('viewRestaurants', {
      restaurants,
      inspectorName,
      zone,
      region
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: "Error fetching restaurants." });
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'D:/images');
    },
    filename: function (req, file, cb) {
      const unique = Date.now() + '-' + file.originalname;
      cb(null, unique);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});


// Checklist schema
const checklistSchema = {
  personalHygiene: {
    handsClean: 'Staff hands are clean and washed regularly',
    uniformClean: 'Staff uniforms are clean and appropriate',
    hairCovered: 'Hair is properly covered during food handling',
    noJewelry: 'No jewelry worn during food preparation'
  },
  premisesCleanliness: {
    floorsClean: 'Floors are clean and well-maintained',
    wallsClean: 'Walls are clean and free from stains',
    ceilingsClean: 'Ceilings are clean and well-maintained',
    tablesClean: 'Tables and surfaces are properly sanitized'
  },
  foodStorage: {
    temperatureControlled: 'Food stored at appropriate temperatures',
    separateRawCooked: 'Raw and cooked foods stored separately',
    properLabeling: 'Food items are properly labeled with dates',
    noExpiredItems: 'No expired food items found'
  },
  equipment: {
    cleanUtensils: 'Utensils are clean and properly stored',
    workingRefrigeration: 'Refrigeration equipment working properly',
    properSanitization: 'Equipment is properly sanitized',
    maintenanceUpToDate: 'Equipment maintenance is up to date'
  },
  wasteManagement: {
    properDisposal: 'Waste is disposed of properly',
    coveredBins: 'Waste bins are covered and clean',
    regularCollection: 'Regular waste collection schedule followed',
    pestControl: 'Effective pest control measures in place'
  }
};

// Labels for rendering titles in EJS
const sectionLabels = {
  personalHygiene: 'Personal Hygiene',
  premisesCleanliness: 'Premises Cleanliness',
  foodStorage: 'Food Storage',
  equipment: 'Equipment & Utensils',
  wasteManagement: 'Waste Management'
};

// GET route to render the inspection form
router.get('/inspection/start/:id', async (req, res) => {
  const inspectionId = req.params.id;

  try {
    // Fetch the inspection by ID
    const [inspectionResult] = await db.query(
      'SELECT * FROM inspections WHERE id = ?',
      [inspectionId]
    );

    if (inspectionResult.length === 0) {
      return res.status(404).send('Inspection not found');
    }

    const inspection = inspectionResult[0];

    // Fetch the associated restaurant
    const [restaurantResult] = await db.query(
      'SELECT * FROM restaurants WHERE id = ?',
      [inspection.restaurant_id]
    );

    if (restaurantResult.length === 0) {
      return res.status(404).send('Restaurant not found');
    }

    const restaurant = restaurantResult[0];

    // ✅ Set the restaurant ID in session for use in POST route
    req.session.restaurant_id = restaurant.id;

    // ✅ Optional: Also ensure inspector ID is set in session if not already
    if (!req.session.ID && inspection.inspector_id) {
      req.session.ID = inspection.inspector_id;
    }

    // Initial hygiene score is 0.0
    const hygieneScore = 0.0;

    // Badge color logic
    const scoreBadge =
      hygieneScore >= 4.0 ? 'green'
      : hygieneScore >= 3.0 ? 'orange'
      : 'red';

    // Render the inspection page
    res.render('startInspection', {
      inspection,
      restaurant,
      checklistSchema,
      sectionLabels,
      hygieneScore,
      scoreBadge
    });

  } catch (err) {
    console.error('Error in GET /inspection/start/:id:', err);
    res.status(500).send('Error fetching inspection data');
  }
});



router.post('/inspection/submit/:id', upload.array('images'), async (req, res) => {
  const { checklist, notes, latitude, longitude } = req.body;
  const inspectionId = req.params.id;
  const inspectorId = req.session.ID; // assuming login
  const restaurantId = req.session.restaurant_id;

  const images = req.files.map(f => f.filename);

  try {
    await db.query(`
      INSERT INTO inspection_reports (inspection_id, inspector_id, restaurant_id, report_json, notes, image_paths, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inspectionId,
      inspectorId,
      restaurantId,
      JSON.stringify(checklist),
      notes,
      JSON.stringify(images),
      latitude || null,
      longitude || null
    ]);

    // Update inspection status
    await db.query(`UPDATE inspections SET status = 'Completed', last_inspection = NOW() WHERE id = ?`, [inspectionId]);

    res.redirect('/inspector/inspections/scheduled');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving report.');
  }
});


// router.get('/inspections/start/:id', (req, res) => {
//   const inspectionId = req.params.id;

//   res.render('startInspection', { inspectionId });
// });


const inspectionCategories = require('../data/inspectionCategories');
router.get('/inspections/start/:id', async (req, res) => {
  const inspectionId = req.params.id;

  try {
    // Get inspection and restaurant info
    const [[inspection]] = await db.query(
      `SELECT i.*, r.name, r.license_number, r.phone, r.address
       FROM inspections i
       JOIN restaurants r ON i.restaurant_id = r.id
       WHERE i.id = ?`, [inspectionId]);

    if (!inspection) {
      return res.status(404).render('error', { message: 'Inspection not found' });
    }

    res.render('startInspection', {
      inspection,
      restaurant: inspection,
      categories: inspectionCategories
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
});


  
//Post

  router.post('/inspections/start/:id', async (req, res) => {
    const inspectionId = req.params.id;
    const inspectorId = req.session.ID; // assumes you have a login with a session
    const formData = req.body;
  
    try {
      // Get restaurant ID from inspection
      const [[inspection]] = await db.query(
        `SELECT * FROM inspections WHERE id = ?`,
        [inspectionId]
      );
  
      if (!inspection) {
        return res.status(404).render('error', { message: 'Invalid inspection ID' });
      }
  
      // Build JSON from checkbox data
      const report = {};
  
      for (const category in formData) {
        if (category !== 'notes') { // exclude notes from report
          report[category] = {};
  
          for (const item in formData[category]) {
            report[category][item] = true;
          }
        }
      }
      const notes = formData.notes || '';
      // Insert into inspection_reports with notes
      await db.query(
        ` INSERT INTO inspection_reports 
          (inspection_id, inspector_id, restaurant_id, report_json, notes) 
          VALUES (?, ?, ?, ?, ?)`,
        [inspectionId, inspectorId, inspection.restaurant_id, JSON.stringify(report), notes]
      );
  
      // Update inspection's status to Completed
      await db.query(
        `UPDATE inspections SET status = 'Completed' WHERE id = ?`,
        [inspectionId]
      );
  
      
return res.render('success', { message: 'Inspection successfully submitted!' });

    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Failed to submit inspection' });
    }
  });
  

module.exports = router; 