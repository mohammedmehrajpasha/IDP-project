const express=require('express');
const router = express.Router();
const db = require('../config/dbConnect');

router.get('/adminLogin',(req,res)=>{
  res.render('adminLogin');
})
router.get('/admin/dashboard',(req,res)=>{
  const adminName = req.session.adminName || "Admin"
  res.render('adminDashboard',{ adminName })
})
router.get('/admin/inspectors',async (req, res)=>{
   const zone = req.session.zone;

  if (!zone) {
    return res.status(403).render('error', { message: 'Zone not assigned or session expired.' });
  }
  const [inspectors] = await db.query('Select * from inspectors where zone=?',[zone])
  res.render('manageInspectors',{inspectors,zone})
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
router.get('/admin/restaurants',async (req, res)=>{
  
  res.render('manageRestaurants')
})
router.get('/admin/restaurants/view',async (req, res)=>{
    const [approvedRestaurants] = await db.query('SELECT * FROM restaurants where status= ?',['approved']);
    res.render('restaurantsView',{approvedRestaurants});
})
router.get('/admin/restaurants/approvals',async (req, res)=>{
  const [pendingRestaurants] = await db.query('SELECT * FROM restaurants where status=?',['pending']);
  res.render('restaurantsApproval',{pendingRestaurants})
})
router.get('/admin/restaurants/configure',async (req, res)=>{
    const [approvedRestaurants] = await db.query('SELECT * FROM restaurants where status= ?',['approved']);
    res.render('configureRestaurants',{approvedRestaurants});
})

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