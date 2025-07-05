const express = require('express');
const router = express.Router();
const db = require('../config/dbConnect');

router.get('/userLogin',(req,res)=>{
    res.render('userViews/userLogin');
  })


router.get('/userSignup',(req,res)=>{
    res.render('userViews/userSignup');
  })

  router.post('/userSignup', async (req, res) => {
    const { name, email, phone, password } = req.body;
  
    if (!name || !email || !phone || !password) {
      return res.render('userSignup', { error: 'All fields are required!' });
    }
    
    try {
      // Check if email already exists
      const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.render('userSignup', { error: 'Email already registered!' });
      }
    
      // Plain password (not recommended in production!)
      await db.query('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', 
        [name, email, phone, password]);
    
      res.redirect('/userLogin'); // Redirect to login upon success
      
    } catch (err) {
      console.error(err);
      res.render('userSignup', { error: 'Signup failed. Please try again!' });
    }
  });
  
router.post('/userLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('userLogin', { error: "All fields are required" });
  }

  try {
    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).render('userLogin', { error: "Invalid ID or password" });
    }

    req.session.Name = results[0].name;
    req.session.email=results[0].email;
    res.redirect('user/dashboard');
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).render('userLogin', { error: "Internal server error" });
  }
});



module.exports = router; 