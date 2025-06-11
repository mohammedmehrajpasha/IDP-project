const path = require('path');
const express = require('express');
const app = express();
const db = require('./src/config/dbConnect');

const session = require('express-session');

app.use(session({
  secret: 'kldsfjbvkaelugivdbsbvhi',
  resave: false,
  saveUninitialized: true
}));



const cors = require('cors');
require('dotenv').config();

app.use(cors())


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'view'));
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.get('/', (req, res) => res.render('home1'));
app.get('/adminLogin',(req,res)=>{
  res.render('adminLogin');
})
app.get('/admin/dashboard',(req,res)=>{
  const adminName = req.session.adminName || "Admin"
  res.render('adminDashboard',{ adminName })
})
app.get('/admin/inspectors',async (req, res)=>{
   const zone = req.session.zone;

  if (!zone) {
    return res.status(403).render('error', { message: 'Zone not assigned or session expired.' });
  }
  const [inspectors] = await db.query('Select * from inspectors where zone=?',[zone])
  res.render('manageInspectors',{inspectors,zone})
})
app.get('/admin/restaurants',(req, res)=>{
  const name = 'restaurants'
  res.render('manageInspectors',{name})
})
app.get('/admin/reports',(req, res)=>{
  name = 'reports'
  res.render('manageInspectors',{name})
})
app.get('/admin/settings',(req, res)=>{
  const name = 'settings';
  res.render('manageInspectors',{name})
})
app.get('/admin/inspectors/add', (req, res) => {
  if (!req.session.zone) {
    return res.status(403).render('error', { message: 'Session expired' });
  }
  res.render('addInspector');
})

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});
app.get('/admin/inspectors/edit/:id', async (req, res) => {
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
app.post('/adminLogin',async (req, res)=>{
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

app.post('/admin/inspectors/add', async (req, res) => {
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

app.post('/admin/inspectors/delete/:id', async (req, res) => {
  const inspectorId = req.params.id;

  try {
    await db.query('DELETE FROM inspectors WHERE id = ?', [inspectorId]);
    res.redirect('/admin/inspectors');
  } catch (err) {
    console.error('Error deleting inspector:', err);
    res.status(500).render('error', { message: 'Failed to delete inspector.' });
  }
});
app.post('/admin/inspectors/edit/:id', async (req, res) => {
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




  
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something broke!' });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});