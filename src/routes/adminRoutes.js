const express=require('express');
const router = express.Router();
const db = require('../config/dbConnect');

const { checklistSchema, sectionLabels } = require('../data/inspectionCategories');
const PDFService = require('../services/pdfService');

router.get('/adminLogin', (req, res) => {
  // Pass empty error variable if none exists
  const error = req.query.error || null;
  res.render('adminLogin', { error });
});
// Update the dashboard route to handle success parameter
// Update the dashboard route to handle success parameter
router.get('/admin/dashboard', async (req, res) => {
  const success = req.query.success;
  const adminName = req.session.adminName;
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [inspectors] = await db.query('SELECT * FROM inspectors WHERE zone = ?', [zone]);
    const [restaurants] = await db.query('SELECT * FROM restaurants WHERE zone = ?', [zone]);
    const [reports] = await db.query('SELECT * FROM inspection_reports WHERE status="approved"');

    const stats = {
      totalInspectors: inspectors.length,
      approvedRestaurants: restaurants.filter(r => r.status === 'approved').length,
      pendingRestaurants: restaurants.filter(r => r.status === 'pending').length,
      totalReports: reports.length
    };

    res.render('adminDashboard', {
      adminName,
      zone,
      stats,
      success // Pass success to template
    });

  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard data.' });
  }
});

router.get('/admin/inspectors',async (req, res)=>{
   const zone = req.session.zone;
   if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  if (!zone) {
    return res.status(403).render('error', { message: 'Zone not assigned or session expired.' });
  }
  const [inspectors] = await db.query('Select * from inspectors where zone=?',[zone])
  res.render('manageInspectors',{inspectors,zone})
})

router.get('/admin/inspectors/add', (req, res) => {
  const zone = req.session.zone;
  const success = req.query.success;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  res.render('addInspector', { zone, success });
});

router.get('/admin/inspectors/edit/:id', async (req, res) => {
  const inspectorId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [results] = await db.query('SELECT * FROM inspectors WHERE id = ?', [inspectorId]);
    if (results.length === 0) {
      return res.status(404).render('error', { message: 'Inspector not found' });
    }
    res.render('editInspector', { inspector: results[0] });
  } catch (err) {
    console.error('Error fetching inspector:', err);
    res.status(500).render('error', { message: 'Failed to load inspector data.' });
  }
});

router.get('/admin/restaurants', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  const [restaurants] = await db.query(
    'SELECT * FROM restaurants WHERE zone = ?', [zone]
  );

  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const approvedRestaurants = restaurants.filter(r => r.status === 'approved');
  const deletedRestaurants = restaurants.filter(r => r.status === 'rejected');

  res.render('manageRestaurants', {
    pendingRestaurants,
    approvedRestaurants,
    deletedRestaurants,
    adminName: req.session.adminName,
    zone
  });
});

// Route: GET /admin/restaurants/edit/:id
router.get('/admin/restaurants/edit/:id', async (req, res) => {
  const restaurantId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [rows] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);

    if (rows.length === 0) {
      return res.status(404).render('error', { message: 'Restaurant not found' });
    }

    const restaurant = rows[0];
    res.render('editRestaurant', { restaurant });
  } catch (err) {
    console.error('Error loading restaurant for editing:', err);
    res.status(500).render('error', { message: 'Failed to load restaurant details.' });
  }
});

router.get('/admin/restaurants', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  const [restaurants] = await db.query('SELECT * FROM restaurants WHERE zone = ?', [zone]);
  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const approvedRestaurants = restaurants.filter(r => r.status === 'approved');

  res.render('manageRestaurants', {
    pendingRestaurants,
    approvedRestaurants
  });
});

// router.get('/admin/reports', async (req, res) => {
//   const zone = req.session.zone;

//   try {
//     const [inspections] = await db.query(`
//       SELECT 
//         i.id AS inspection_id,
//         r.name AS restaurant_name,
//         r.license_number,
//         r.region,
//         ins.name AS inspector_name,
//         i.inspection_date,
//         ir.id AS report_id,
//         ir.status AS report_status,
//         ir.submitted_at
//       FROM inspections i
//       JOIN inspection_reports ir ON ir.inspection_id = i.id
//       JOIN restaurants r ON i.restaurant_id = r.id
//       JOIN inspectors ins ON i.inspector_id = ins.id
//       WHERE i.status = 'Completed'
//       AND r.zone = ?
//       ORDER BY ir.submitted_at DESC
//     `, [zone]);

//     res.render('reviewReports', { inspections, zone });

//   } catch (err) {
//     console.error('Error loading reports:', err);
//     res.status(500).render('error', { message: 'Failed to load inspection reports.' });
//   }
// });
router.get('/admin/reports', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [all] = await db.query(`
      SELECT 
        ir.id AS report_id,
        ir.status,
        ir.hygiene_score,
        ir.submitted_at,
        r.name AS restaurant_name,
        r.license_number,
        ins.name AS inspector_name
      FROM inspection_reports ir
      JOIN inspections i ON ir.inspection_id = i.id
      JOIN restaurants r ON ir.restaurant_id = r.id
      JOIN inspectors ins ON ir.inspector_id = ins.id
      WHERE r.zone = ?
      ORDER BY ir.submitted_at DESC
    `, [zone]);

    const pending = all.filter(r => r.status === 'pending');
    const approved = all.filter(r => r.status === 'approved');
    const rejected = all.filter(r => r.status === 'rejected');

    res.render('reviewReports', {
      all,
      pending,
      approved,
      rejected
    });

  } catch (err) {
    console.error('Error loading reports:', err);
    res.status(500).render('error', { message: 'Failed to load inspection reports.' });
  }
});

router.get('/admin/reports/:id', async (req, res) => {
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

    res.render('adminViewReport', {
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



router.get('/admin/reports/:id/pdf', async (req, res) => {
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
      'Content-Disposition': `attachment; filename=FSSAI-Report-${reportId}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Failed to generate PDF:', err);
    res.status(500).render('error', { message: 'Failed to generate PDF report' });
  }
});



router.get('/admin/inspections/schedule', async (req, res) => {
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [restaurants] = await db.query(`
      SELECT id, name, license_number, region, last_inspection_date 
      FROM restaurants 
      WHERE zone = ? AND status = 'approved'
    `, [zone]);

    // Assign priority
    restaurants.forEach(r => {
      if (!r.last_inspection_date) {
        r.priority = 'High';
      } else {
        const daysSince = Math.floor((Date.now() - new Date(r.last_inspection_date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 90) r.priority = 'High';
        else if (daysSince > 60) r.priority = 'Medium';
        else r.priority = 'Low';
      }
    });

    const [inspectors] = await db.query(`
      SELECT id, name, region FROM inspectors WHERE zone = ?
    `, [zone]);

    const [scheduled] = await db.query(`
      SELECT 
        i.id, 
        r.name AS restaurant_name, 
        ins.name AS inspector_name, 
        i.inspection_date AS scheduled_date, 
        i.status 
      FROM inspections i
      JOIN restaurants r ON i.restaurant_id = r.id
      JOIN inspectors ins ON i.inspector_id = ins.id
      WHERE r.zone = ? AND i.status ='Scheduled'
      ORDER BY i.inspection_date DESC
    `, [zone]);

    // ✅ Calculate today's date in yyyy-mm-dd format
    const today = new Date().toISOString().split('T')[0];

    res.render('scheduleInspections', {
      restaurants,
      inspectors,
      scheduled,
      today,  // <-- ✅ pass this to the template
      zone
    });

  } catch (err) {
    console.error('Error loading inspections:', err);
    res.status(500).render('error', { message: 'Failed to load inspection scheduling page.' });
  }
});

//POST
router.post('/adminLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/adminLogin?error=Email and password are required');
  }

  try {
    const [results] = await db.query("SELECT * FROM admins WHERE email = ?", [email]);

    if (results.length === 0 || results[0].password !== password) {
      return res.redirect('/adminLogin?error=Invalid credentials');
    }

    req.session.zone = results[0].zone;
    req.session.adminName = results[0].name;
    req.session.adminId=results[0].id;
    res.redirect('/admin/dashboard?success=1'); // This is correct
  } catch (err) {
    console.error("Database error:", err);
    res.redirect('/adminLogin?error=Internal server error');
  }
});

router.post('/admin/inspectors/add', async (req, res) => {
  const { name, email, phone, password, region } = req.body;
  const zone = req.session.zone;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(`
      INSERT INTO inspectors (name, email, phone, password, region, zone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, email, phone, password, region, zone]);

    res.redirect('/admin/inspectors/add?success=1');
  } catch (err) {
    console.error('Error adding inspector:', err);
    res.status(500).render('error', { message: 'Failed to add inspector.' });
  }
});

router.post('/admin/inspectors/delete/:id', async (req, res) => {
  const inspectorId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('DELETE FROM inspectors WHERE id = ?', [inspectorId]);
    res.redirect('/admin/inspectors');
  } catch (err) {
    console.error('Error deleting inspector:', err);
    res.status(500).render('error', { message: 'Failed to delete inspector.' });
  }
});

router.post('/admin/inspectors/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, region } = req.body;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(
      'UPDATE inspectors SET name = ?, email = ?, phone = ?, region = ? WHERE id = ?',
      [name, email, phone, region, id]
    );
    res.redirect('/admin/inspectors');
  } catch (error) {
    console.error('Error updating inspector:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/admin/restaurants/edit/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  const { name, license_number, contact_person, phone, email, address, region, status } = req.body;
  await db.query(
    'UPDATE restaurants SET name=?, license_number=?, contact_person=?, phone=?, email=?, address=?, region=?, status=? WHERE id=?',
    [name, license_number, contact_person, phone, email, address, region, status, req.params.id]
  );
  res.redirect('/admin/restaurants');
});

router.post('/admin/restaurants/delete/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('UPDATE restaurants SET status = "rejected" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/restaurants');
  } catch (err) {
    console.error('Soft delete failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/admin/restaurants/restore/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('UPDATE restaurants SET status = "approved" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/restaurants');
  } catch (err) {
    console.error('Restore failed:', err);
    res.status(500).send('Internal Server Error');
  }
});





router.get('/admin/inspections',async (req, res)=>{

  res.render('manageInspection')
})

// Schedule a new inspection for a restaurant
router.get('/admin/restaurants/schedule/:id', async (req, res) => {
  const restaurantId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    // First, fetch restaurant details to find:
    // 1️⃣ Inspector (created_by) 
    // 2️⃣ Last Inspection Date
    const [rows] = await db.query(`
      SELECT created_by, last_inspection_date FROM restaurants WHERE id = ?
    `, [restaurantId]);

    if (rows.length === 0) {
      return res.status(404).send('Restaurant not found');
    }
    const inspectorId = rows[0].created_by;
    const lastInspection = rows[0].last_inspection_date;

    // Next, insert into inspections table with the fetched info
    await db.query(`
      INSERT INTO inspections (restaurant_id, inspector_id, status, last_inspection)
      VALUES (?, ?, ?, ?)
    `, [restaurantId, inspectorId, 'Scheduled', lastInspection]);

    res.redirect('/admin/restaurants/view?success=1'); // Redirect back to restaurants view or wherever you want
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



router.get('/admin/restaurants/view', async (req, res) => {
  const zone = req.session.zone;
  const { success } = req.query;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    const [approvedRestaurants] = await db.query(`
      SELECT * FROM restaurants r
      WHERE r.status = 'approved'
        AND r.zone = ?
        AND r.id NOT IN (
          SELECT i.restaurant_id FROM inspections i WHERE i.status IN ('Scheduled', 'Completed')
        )
    `, [zone]);

    res.render('restaurantsView', { approvedRestaurants ,success  });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/admin/reports/approve/:id', async (req, res) => {
  const reportId = req.params.id;
  const adminId = req.session.adminId;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  try {
    // Get restaurant_id, hygiene_score, inspection_id
    const [[report]] = await db.query(`
      SELECT ir.restaurant_id, ir.hygiene_score, i.last_inspection
      FROM inspection_reports ir
      JOIN inspections i ON ir.inspection_id = i.id
      WHERE ir.id = ?
    `, [reportId]);

    if (!report) {
      return res.status(404).render('error', { message: 'Report not found.' });
    }

    // Update inspection_reports status
    await db.query(`
  UPDATE inspection_reports 
  SET status = 'approved', approved_by = ? 
  WHERE id = ?
`, [adminId, reportId]);


    // Update restaurants table with new score & date
    await db.query(`
      UPDATE restaurants 
      SET hygiene_score = ?, last_inspection_date = ?, insp_rep_id = ?
      WHERE id = ?
    `, [report.hygiene_score, report.last_inspection, reportId, report.restaurant_id]);

    res.redirect('/admin/reports');
  } catch (err) {
    console.error('Error approving report:', err);
    res.status(500).render('error', { message: 'Failed to approve report.' });
  }
});

router.post('/admin/reports/reject/:id', async (req, res) => {
  const reportId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(`UPDATE inspection_reports SET status = 'rejected' WHERE id = ?`, [reportId]);
    res.redirect('/admin/reports');
  } catch (err) {
    console.error('Error rejecting report:', err);
    res.status(500).render('error', { message: 'Failed to reject report.' });
  }
});


router.post('/admin/inspections/schedule', async (req, res) => {
  const { restaurant_id, inspector_id, inspection_date } = req.body;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query(`
      INSERT INTO inspections (restaurant_id, inspector_id, inspection_date, status)
      VALUES (?, ?, ?, 'Scheduled')
    `, [restaurant_id, inspector_id, inspection_date]);

    res.redirect('/admin/inspections/schedule');
  } catch (err) {
    console.error('Error scheduling inspection:', err);
    res.status(500).render('error', { message: 'Failed to schedule inspection.' });
  }
});

router.post('/admin/inspections/delete/:id', async (req, res) => {
  const inspectionId = req.params.id;
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}

  try {
    await db.query('DELETE FROM inspections WHERE id = ?', [inspectionId]);
    res.redirect('/admin/inspections/schedule');
  } catch (err) {
    console.error('Error deleting inspection:', err);
    res.status(500).send('Internal Server Error');
  }
});
router.post('/admin/restaurants/approve/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  await db.query('UPDATE restaurants SET status = "approved" WHERE id = ?', [req.params.id]);
  res.redirect('/admin/restaurants');
});


router.post('/admin/restaurants/reject/:id', async (req, res) => {
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  await db.query('UPDATE restaurants SET status = "rejected" WHERE id = ?', [req.params.id]);
  res.redirect('/admin/restaurants');
});
router.get('/admin/restaurants/approvals',async (req, res)=>{
  if (!req.session.adminName || !req.session.zone) {
  return res.redirect('/adminLogin');
}
  const [pendingRestaurants] = await db.query('SELECT * FROM restaurants where status=?',['pending']);
  res.render('restaurantsApproval',{pendingRestaurants})
})




module.exports = router;