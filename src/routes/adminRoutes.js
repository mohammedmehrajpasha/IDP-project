const express=require('express');
const router = express.Router();
const db = require('../config/dbConnect');

router.get('/adminLogin',(req,res)=>{
  res.render('adminLogin');
})
router.get('/admin/dashboard', async (req, res) => {
  const adminName = req.session.adminName;
  const zone = req.session.zone;

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
    layout: 'layout',
    path: req.path,
    adminName,
    zone,
    stats
  });
});

router.get('/admin/inspectors',async (req, res)=>{
   const zone = req.session.zone;

  if (!zone) {
    return res.status(403).render('error', { message: 'Zone not assigned or session expired.' });
  }
  const [inspectors] = await db.query('Select * from inspectors where zone=?',[zone])
  res.render('manageInspectors',{inspectors,zone})
})

router.get('/admin/settings',(req, res)=>{
  const name = 'settings';
  res.render('manageInspectors',{name})
})

router.get('/admin/inspectors/add', (req, res) => {
  if (!req.session.zone) {
    return res.status(403).render('error', { message: 'Session expired' });
  }
  const { success } = req.query;
  res.render('addInspector',{success});
})

router.get('/admin/inspectors/edit/:id', async (req, res) => {
  const inspectorId = req.params.id;

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

  try {
    const [inspections] = await db.query(`
      SELECT 
  i.id AS inspection_id,
  r.name AS restaurant_name,
  r.license_number,
  ins.name AS inspector_name,
  i.inspection_date,
  ir.id AS report_id,
  ir.status AS report_status
FROM inspections i
JOIN inspection_reports ir ON ir.inspection_id = i.id
JOIN restaurants r ON i.restaurant_id = r.id
JOIN inspectors ins ON i.inspector_id = ins.id
-- REMOVE THE FILTERS FOR TESTING
ORDER BY ir.submitted_at DESC
    `, [zone]);

    res.render('reviewReports', { inspections, zone });

  } catch (err) {
    console.error('Error loading reports:', err);
    res.status(500).render('error', { message: 'Failed to load inspection reports.' });
  }
});

router.get('/admin/reports/:id', async (req, res) => {
  const [report] = await db.query('SELECT * FROM inspection_reports WHERE report_id = ?', [req.params.id]);
  if (!report || report.length === 0) return res.status(404).send("Not found");

  res.render('viewReport', { report: report[0] });
});

router.get('/admin/inspections/schedule', async (req, res) => {
  const zone = req.session.zone;

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
      WHERE r.zone = ? AND i.status IN ('Scheduled', 'Completed')
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







router.post('/adminLogin',async (req, res)=>{
  console.log(req.body);
  const {email, password} = req.body;
  if (!email || !password) {
    return res.status(400).render('error', { message: "All fields are required" });
  }

  try{
    const [results] = await db.query("SELECT * FROM admins WHERE email = ?", [email]);
    
    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).render('error', { message: "Invalid ID or password" });
    }
    req.session.zone = results[0].zone;
    req.session.adminName = results[0].name;
    res.redirect('admin/dashboard')
  }
  catch(err){
    console.error("Database error:", err);
    res.status(500).render('error', { message: "Internal server error" });
  }
})

router.post('/admin/inspectors/add', async (req, res) => {
  const { name, email, phone, region, password } = req.body;
  const zone = req.session.zone;

  try {
    await db.query(
      'INSERT INTO inspectors (name, email, phone, region, zone, password) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, region, zone, password]
    );
    res.render('addInspector', { success: true, adminName: req.session.adminName, zone });
  } catch (err) {
    console.error('Failed to add inspector:', err);
    res.status(500).send('Internal server error');
  }
});

router.post('/admin/inspectors/delete/:id', async (req, res) => {
  const inspectorId = req.params.id;

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
  const { name, license_number, contact_person, phone, email, address, region, status } = req.body;
  await db.query(
    'UPDATE restaurants SET name=?, license_number=?, contact_person=?, phone=?, email=?, address=?, region=?, status=? WHERE id=?',
    [name, license_number, contact_person, phone, email, address, region, status, req.params.id]
  );
  res.redirect('/admin/restaurants');
});

router.post('/admin/restaurants/delete/:id', async (req, res) => {
  try {
    await db.query('UPDATE restaurants SET status = "rejected" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/restaurants');
  } catch (err) {
    console.error('Soft delete failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/admin/restaurants/restore/:id', async (req, res) => {
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
  await db.query('UPDATE inspection_reports SET status = "approved", reviewed_at = NOW() WHERE report_id = ?', [req.params.id]);
  res.redirect('/admin/reports');
});

router.post('/admin/reports/reject/:id', async (req, res) => {
  await db.query('UPDATE inspection_reports SET status = "rejected", reviewed_at = NOW() WHERE report_id = ?', [req.params.id]);
  res.redirect('/admin/reports');
});

router.post('/admin/inspections/schedule', async (req, res) => {
  const { restaurant_id, inspector_id, inspection_date } = req.body;

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

  try {
    await db.query('DELETE FROM inspections WHERE id = ?', [inspectionId]);
    res.redirect('/admin/inspections/schedule');
  } catch (err) {
    console.error('Error deleting inspection:', err);
    res.status(500).send('Internal Server Error');
  }
});
router.post('/admin/restaurants/approve/:id', async (req, res) => {
  await db.query('UPDATE restaurants SET status = "approved" WHERE id = ?', [req.params.id]);
  res.redirect('/admin/restaurants');
});


router.post('/admin/restaurants/reject/:id', async (req, res) => {
  await db.query('UPDATE restaurants SET status = "rejected" WHERE id = ?', [req.params.id]);
  res.redirect('/admin/restaurants');
});
router.get('/admin/restaurants/approvals',async (req, res)=>{
  const [pendingRestaurants] = await db.query('SELECT * FROM restaurants where status=?',['pending']);
  res.render('restaurantsApproval',{pendingRestaurants})
})




module.exports = router;