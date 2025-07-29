const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const qs = require('qs'); 
const db = require('../config/dbConnect');

const { checklistSchema, sectionLabels } = require('../data/inspectionCategories');
const PDFService = require('../services/pdfService');
const { storage } = require('../config/cloudinary');
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/inspectorLogin', (req, res) => {
  const error = req.query.error || null;
  res.render('inspectorLogin', { error });
});

router.post('/inspectorLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/inspectorLogin?error=Email and password are required');
  }

  try {
    const [results] = await db.query("SELECT * FROM inspectors WHERE email = ?", [email]);

    if (results.length === 0 || results[0].password !== password) {
      return res.redirect('/inspectorLogin?error=Invalid credentials');
    }

    req.session.zone = results[0].zone;
    req.session.inspectorName = results[0].name;
    req.session.region = results[0].region;
    req.session.ID = results[0].id;
    res.redirect('/inspector/dashboard?success=1');
  } catch (err) {
    console.error("Database error:", err);
    res.redirect('/inspectorLogin?error=Internal server error');
  }
});

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

  try {
    const [allRestaurants] = await db.query(`
      SELECT id, name, contact_person, license_number, email, phone, zone, region, 
             address, status, hygiene_score, created_at, last_inspection_date
      FROM restaurants
      WHERE zone = ? AND region = ?
    `, [zone, region]);

    // Categorize restaurants
    const approved = allRestaurants.filter(r => r.status === 'approved');
    const pending = allRestaurants.filter(r => r.status === 'pending');
    const rejected = allRestaurants.filter(r => r.status === 'rejected');

    res.render('viewRestaurants', {
      approved,
      pending,
      rejected,
      zone,
      region
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: "Error fetching restaurants." });
  }
});

router.get('/inspector/restaurants/edit/:id', async (req, res) => {
  try {
    const [restaurant] = await db.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    
    if (!restaurant) {
      return res.status(404).render('error', { message: "Restaurant not found." });
    }

    res.render('editRestaurantInspector', {
      restaurant: restaurant[0],
      zone: req.session.zone,
      region: req.session.region
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: "Error loading restaurant details." });
  }
});

router.post('/inspector/restaurants/edit/:id', async (req, res) => {
  
  const { name, license_number, contact_person, phone, email, address, region, status } = req.body;
  await db.query(
    'UPDATE restaurants SET name=?, license_number=?, contact_person=?, phone=?, email=?, address=?, region=?, status=? WHERE id=?',
    [name, license_number, contact_person, phone, email, address, region, status, req.params.id]
  );
  res.redirect('/inspector/restaurants');
});

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
    const hygieneScore = restaurant.hygiene_score;

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
  const formData = qs.parse(req.body);
  const checklist = formData.checklist;
  const { notes, latitude, longitude } = formData;
  const inspectionId = req.params.id;
  const inspectorId = req.session.ID;
  const restaurantId = req.session.restaurant_id;

  // Get Cloudinary image URLs instead of local paths
  const images = req.files.map(file => file.path); // file.path contains Cloudinary URL

  // Calculate hygiene score (your existing code)
  let totalChecked = 0;
  let totalItems = 0;

  for (const category in checklist) {
    for (const item in checklist[category]) {
      totalItems++;
      if (checklist[category][item] === 'on') {
        totalChecked++;
      }
    }
  }

  const hygieneScore = parseFloat(((totalChecked / 20) * 5).toFixed(2));

  try {
    await db.query(`
      INSERT INTO inspection_reports (
        inspection_id,
        inspector_id,
        restaurant_id,
        report_json,
        notes,
        image_paths,
        latitude,
        longitude,
        hygiene_score
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inspectionId,
      inspectorId,
      restaurantId,
      JSON.stringify(checklist),
      notes,
      JSON.stringify(images), // Now stores Cloudinary URLs
      latitude || null,
      longitude || null,
      hygieneScore
    ]);

    await db.query(
      `UPDATE inspections SET status = 'Completed', last_inspection = NOW() WHERE id = ?`,
      [inspectionId]
    );

    res.redirect('/inspector/inspections/scheduled');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving report.');
  }
});


router.get('/inspector/pastInspections', async (req, res) => {
  const zone = req.session.zone;
  const inspectorName = req.session.inspectorName;

  try {
    const [rows] = await db.query(`
      SELECT ir.id, ir.hygiene_score AS hygieneScore, ir.status, ir.submitted_at,
             r.name AS restaurant_name, r.license_number
      FROM inspection_reports ir
      JOIN restaurants r ON ir.restaurant_id = r.id
      WHERE r.zone = ?
      ORDER BY ir.submitted_at DESC
    `, [zone]);

    const pendingReports = rows.filter(r => r.status === 'pending');
    const approvedReports = rows.filter(r => r.status === 'approved');
    const rejectedReports = rows.filter(r => r.status === 'rejected');

    res.render('pastInspections', {
      pendingReports,
      approvedReports,
      rejectedReports,
      inspectorName
    });

  } catch (err) {
    console.error('Failed to load past inspections:', err);
    res.status(500).send('Error loading reports');
  }
});


// Route: /inspector/view-report/:id
router.get('/inspector/view-report/:id', async (req, res) => {
  const reportId = req.params.id;

  try {
    const [[report]] = await db.query(`
  SELECT ir.*, r.name AS restaurant_name, r.license_number, r.phone, r.email, r.address,
         r.zone AS restaurant_zone, r.region AS restaurant_region,
         i.name AS inspector_name,
         a.name AS admin_name
  FROM inspection_reports ir
  JOIN restaurants r ON ir.restaurant_id = r.id
  JOIN inspectors i ON ir.inspector_id = i.id
  LEFT JOIN admins a ON ir.approved_by = a.id
  WHERE ir.id = ?
`, [reportId]);


    if (!report) {
      return res.status(404).render('error', { message: 'Report not found' });
    }

    // Parse JSON
    const reportData = typeof report.report_json === 'string' ? JSON.parse(report.report_json) : report.report_json;
    let imageUrls = [];

    if (Array.isArray(report.image_paths)) {
      imageUrls = report.image_paths;
    } else if (typeof report.image_paths === 'string') {
      try {
        imageUrls = JSON.parse(report.image_paths);
      } catch (err) {
        console.error('Failed to parse image paths', err.message);
      }
    }

    const hygieneScore = report.hygiene_score;
    const scoreColor = hygieneScore >= 4 ? 'green' : hygieneScore >= 3 ? 'orange' : 'red';

    res.render('viewReport', {
      report: {
        ...report,
        report_data: reportData,
        image_urls: imageUrls
      },
      restaurant: {
        name: report.restaurant_name,
        license_number: report.license_number,
        phone: report.phone,
        email: report.email,
        address: report.address,
        region: report.restaurant_region,
        zone: report.restaurant_zone
      },
      inspector: {
        name: report.inspector_name
      },
      adminName: report.admin_name,
      checklistSchema,
      sectionLabels,
      hygieneScore,
      scoreColor
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Server Error' });
  }
});




router.get('/inspector/view-report/:id/pdf', async (req, res) => {
  const reportId = req.params.id;

  try {
    const [[report]] = await db.query(`
  SELECT ir.*, r.name AS restaurant_name, r.license_number, r.phone, r.email, r.address,
         r.zone AS restaurant_zone, r.region AS restaurant_region,
         i.name AS inspector_name,
         a.name AS admin_name
  FROM inspection_reports ir
  JOIN restaurants r ON ir.restaurant_id = r.id
  JOIN inspectors i ON ir.inspector_id = i.id
  LEFT JOIN admins a ON ir.approved_by = a.id
  WHERE ir.id = ?
`, [reportId]);


    if (!report) return res.status(404).render('error', { message: 'Report not found' });

    // Parse JSON fields
    let reportData = {};
    try {
      reportData = typeof report.report_json === 'string' ? JSON.parse(report.report_json) : report.report_json;
    } catch (e) {
      console.error('Failed to parse report_json:', e);
      reportData = {};
    }

    let imageUrls = [];
    if (Array.isArray(report.image_paths)) {
      imageUrls = report.image_paths;
    } else if (typeof report.image_paths === 'string') {
      try {
        imageUrls = JSON.parse(report.image_paths);
      } catch (err) {
        console.error('Failed to parse image_paths:', err.message);
      }
    }

    const pdfBuffer = await PDFService.generateInspectionReportPDF({
  report: {
    ...report,
    report_data: reportData,
    image_urls: imageUrls
  },
  restaurant: {
    name: report.restaurant_name,
    license_number: report.license_number,
    phone: report.phone,
    email: report.email,
    address: report.address,
    zone: report.restaurant_zone,
    region: report.restaurant_region
  },
  inspector: {
    name: report.inspector_name
  },
  admin: {
    name: report.admin_name || null
  }
});


    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=FHIR-${reportId}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Failed to generate PDF:', err);
    res.status(500).render('error', { message: 'Failed to generate PDF report' });
  }
});


router.get('/inspector/complaints', async (req, res) => {
  try {
    const inspectorZone = req.session.zone;
    const inspectorRegion = req.session.region;

    const [pending] = await db.query(`
      SELECT c.*, u.name AS user_name, r.name AS restaurant_name
      FROM complaints c
      JOIN users u ON c.user_id = u.email
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.status = 'pending' AND r.zone = ? AND r.region = ?
      ORDER BY c.created_at DESC
    `, [inspectorZone, inspectorRegion]);

    const [resolved] = await db.query(`
      SELECT c.*, u.name AS user_name, r.name AS restaurant_name
      FROM complaints c
      JOIN users u ON c.user_id = u.email
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.status = 'resolved' AND r.zone = ? AND r.region = ?
      ORDER BY c.updated_at DESC
    `, [inspectorZone, inspectorRegion]);

    res.render('inspViewComplaints', { pending, resolved });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).send('Server error');
  }
});


router.get('/inspector/complaints/:id', async (req, res) => {
  const complaintId = req.params.id;
  const inspectorZone = req.session.zone;
  const inspectorRegion = req.session.region;

  try {
    const [[complaint]] = await db.query(`
      SELECT c.*, u.name AS user_name, r.name AS restaurant_name, r.zone, r.region
      FROM complaints c
      JOIN users u ON c.user_id = u.email
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ? AND r.zone = ? AND r.region = ?
    `, [complaintId, inspectorZone, inspectorRegion]);

    if (!complaint) return res.status(404).send('Complaint not found or unauthorized');

    res.render('detailedComplaint', { complaint });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading complaint details');
  }
});





router.post('/inspector/complaints/resolve/:id', async (req, res) => {
  const complaintId = req.params.id;
  const { resolution } = req.body;

  try {
    await db.query(`
      UPDATE complaints 
      SET status = 'resolved', resolution_taken = ?, updated_at = NOW()
      WHERE id = ?
    `, [resolution, complaintId]);

    res.redirect('/inspector/complaints');
  } catch (err) {
    console.error('Error resolving complaint:', err);
    res.status(500).send('Failed to resolve complaint');
  }
});









// const inspectionCategories = require('../data/inspectionCategories');
// router.get('/inspections/start/:id', async (req, res) => {
//   const inspectionId = req.params.id;

//   try {
//     // Get inspection and restaurant info
//     const [[inspection]] = await db.query(
//       `SELECT i.*, r.name, r.license_number, r.phone, r.address
//        FROM inspections i
//        JOIN restaurants r ON i.restaurant_id = r.id
//        WHERE i.id = ?`, [inspectionId]);

//     if (!inspection) {
//       return res.status(404).render('error', { message: 'Inspection not found' });
//     }

//     res.render('startInspection', {
//       inspection,
//       restaurant: inspection,
//       categories: inspectionCategories
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).render('error', { message: 'Internal Server Error' });
//   }
// });


  
//Post

//   router.post('/inspections/start/:id', async (req, res) => {
//     const inspectionId = req.params.id;
//     const inspectorId = req.session.ID; // assumes you have a login with a session
//     const formData = req.body;
  
//     try {
//       // Get restaurant ID from inspection
//       const [[inspection]] = await db.query(
//         `SELECT * FROM inspections WHERE id = ?`,
//         [inspectionId]
//       );
  
//       if (!inspection) {
//         return res.status(404).render('error', { message: 'Invalid inspection ID' });
//       }
  
//       // Build JSON from checkbox data
//       const report = {};
  
//       for (const category in formData) {
//         if (category !== 'notes') { // exclude notes from report
//           report[category] = {};
  
//           for (const item in formData[category]) {
//             report[category][item] = true;
//           }
//         }
//       }
//       const notes = formData.notes || '';
//       // Insert into inspection_reports with notes
//       await db.query(
//         ` INSERT INTO inspection_reports 
//           (inspection_id, inspector_id, restaurant_id, report_json, notes) 
//           VALUES (?, ?, ?, ?, ?)`,
//         [inspectionId, inspectorId, inspection.restaurant_id, JSON.stringify(report), notes]
//       );
  
//       // Update inspection's status to Completed
//       await db.query(
//         `UPDATE inspections SET status = 'Completed' WHERE id = ?`,
//         [inspectionId]
//       );
  
      
// return res.render('success', { message: 'Inspection successfully submitted!' });

//     } catch (err) {
//       console.error(err);
//       res.status(500).render('error', { message: 'Failed to submit inspection' });
//     }
//   });
  

module.exports = router; 