const express = require('express');
const router = express.Router();
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




  router.get('/inspector/dashboard',(req,res)=>{
    const inspectorName = req.session.inspectorName || "Inspector"
    res.render('inspectorDashboard',{ inspectorName })
  })



  router.get('/inspector/restaurants', async (req, res) => {
    const inspectorZone = req.session.zone;
    const inspectorName = req.session.inspectorName || "Inspector";
  
    try {
      const [restaurants] = await db.query(
        `SELECT id, name, license_number, region, last_inspection_date 
         FROM restaurants 
         WHERE zone = ?`,
        [inspectorZone]
      );
  
      res.render('regionRestaurants', {
        inspectorName,
        restaurants
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: "Error fetching restaurants." });
    }
  });



  router.get('/inspector/restaurants/add', (req, res) => {
    const { zone, region } = req.session;
    const { success } = req.query;
  
    if (!zone || !region) {
      return res.status(403).render('error', { message: 'Unauthorized access. Session expired or not found.' });
    }
  
    res.render('addRestaurant', { zone, region, success });
  });

  router.post('/inspector/restaurants/add', async (req, res) => {
    const { name, license_number, email, phone, address } = req.body;
    const zone = req.session.zone;
    const region = req.session.region;
    const created_by = req.session.ID;
  
    try {
      await db.query(
        `INSERT INTO restaurants 
         (name, license_number, email, phone, zone, region, address, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, license_number, email, phone, zone, region, address, created_by]
      );
  
      // Redirect with a success flag
      res.redirect('/inspector/restaurants/add?success=1');
    } catch (err) {
      console.error('Error adding restaurant:', err);
      res.status(500).render('error', { message: 'Failed to add restaurant.' });
    }
  });



  // Assuming you have Express and a database connection (like mysql)

router.get('/inspections/scheduled', async (req, res) => {
  const inspectorId = req.session.ID; // or however you track the currently logged in Inspector
  console.log(inspectorId);

  try {
      const [rows] = await db.query(`
          SELECT r.name, r.license_number, r.phone, r.address, i.last_inspection
          FROM inspections i
          JOIN restaurants r ON i.restaurant_id = r.id
          WHERE i.inspector_id = ? AND i.status = 'Scheduled'
      `, [inspectorId]);

      res.render('inspectionScheduled', { scheduledInspections: rows });

  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});


router.get('/inspections/start/:id', (req, res) => {
  const inspectionId = req.params.id;
  // Handle starting the inspection here, 
  // e.g., render a form for entering observation details.
  res.render('startInspection', { inspectionId });
});


  


  router.get('/admin/inspectors',async (req, res)=>{
     const zone = req.session.zone;
  
    if (!zone) {
      return res.status(403).render('error', { message: 'Zone not assigned or session expired.' });
    }
    const [inspectors] = await db.query('Select * from inspectors where zone=?',[zone])
    res.render('manageInspectors',{inspectors,zone})
  })

  router.get('/admin/restaurants',(req, res)=>{
    const name = 'restaurants'
    res.render('manageInspectors',{name})
  })

  router.get('/admin/reports',(req, res)=>{
    name = 'reports'
    res.render('manageInspectors',{name})
  })

  router.get('/admin/settings',(req, res)=>{
    const name = 'settings';
    res.render('manageInspectors',{name})
  })

  router.get('/admin/inspectors/add', (req, res) => {
    if (!req.session.zone) {
      return res.status(403).render('error', { message: 'Session expired' });
    }
    res.render('addInspector');
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
  

  
//Admin Login

  
  router.post('/admin/inspectors/add', async (req, res) => {
    const { name, email, phone, region, password } = req.body;
    const zone = req.session.zone;
  
    try {
      await db.query(
        'INSERT INTO inspectors (name, email, phone, password, zone, region) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, password, zone, region]
      );
      res.redirect('/admin/inspectors');
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Failed to add inspector.' });
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
    const inspectorId = req.params.id;
    const { name, email, phone, region } = req.body;
  
    try {
      await db.query(
        'UPDATE inspectors SET name = ?, email = ?, phone = ?, region = ? WHERE id = ?',
        [name, email, phone, region, inspectorId]
      );
      res.redirect('/admin/inspectors');
    } catch (err) {
      console.error('Error updating inspector:', err);
      res.status(500).render('error', { message: 'Failed to update inspector.' });
    }
  });


module.exports = router; 