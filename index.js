const path = require('path');
const express = require('express');
const app = express();
const db = require('./src/config/dbConnect');

const session = require('express-session');

app.use(session({
  secret: 'kldsfjbvkaelugivdbsbvhi',      // 🔒 change this to a strong secret
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
app.get('/admin/inspectors',(req, res)=>{
  const name = 'inspectors';
  res.render('manageInspectors',{name})
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
app.get('/logout',(req,res)=>{
  res.render('home1')
})


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
    req.session.adminName = results[0].name;
    res.redirect('admin/dashboard')
  }
  catch(err){
    console.error("Database error:", err);
    res.status(500).render('error', { message: "Internal server error" });
  }
})

  
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