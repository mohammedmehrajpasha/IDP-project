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
      return res.render('userViews/userSignup', { error: 'All fields are required!' });
    }
    
    try {
      // Check if email already exists
      const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.render('userViews/userSignup', { error: 'Email already registered!' });
      }
    
      // Plain password (not recommended in production!)
      await db.query('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', 
        [name, email, phone, password]);
    
      res.redirect('userLogin'); // Redirect to login upon success
      
    } catch (err) {
      console.error(err);
      res.render('userViews/userSignup', { error: 'Signup failed. Please try again!' });
    }
  });
  
router.post('/userLogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('userViews/userLogin', { error: "All fields are required" });
  }

  try {
    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).render('userViews/userLogin', { error: "Invalid ID or password" });
    }

    req.session.Name = results[0].name;
    req.session.email=results[0].email;
    res.redirect('user/dashboard');
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).render('userViews/userLogin', { error: "Internal server error" });
  }
});


router.get('/user/dashboard', async (req, res) => {
  if (!req.session.Name) {
    return res.redirect('/userLogin');
  }

  const user = {
    id: req.session.email,
    name:req.session.Name
  };

  console.log("id"+user.id)
  console.log("name"+user.name)

  try {
    const [restaurantRows] = await db.query("SELECT COUNT(*) AS total FROM restaurants WHERE status = 'approved'");
    const [favoriteRows] = await db.query("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?", [user.id]);
    const [complaintRows] = await db.query("SELECT COUNT(*) AS total FROM complaints WHERE user_id = ?", [user.id]);

    const stats = {
      totalRestaurants: restaurantRows[0].total,
      favoriteCount: favoriteRows[0].total,
      complaintsCount: complaintRows[0].total
    };

    res.render('userViews/userDashboard', { user, stats });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route: /user/search
router.get('/user/search', async (req, res) => {
  const userId = req.session.email;
  const searchQuery = req.query.q || '';
  let restaurants = [];

  if (searchQuery) {
    [restaurants] = await db.query(
      `SELECT r.*, f.user_id IS NOT NULL AS is_favorite
       FROM restaurants r
       LEFT JOIN favorites f ON r.id = f.restaurant_id AND f.user_id = ?
       WHERE r.name LIKE ? AND r.status = 'approved'`,
      [userId, `%${searchQuery}%`]
    );
    return res.json({ restaurants });
  }

  [restaurants] = await db.query(
    `SELECT r.*, f.user_id IS NOT NULL AS is_favorite
     FROM restaurants r
     LEFT JOIN favorites f ON r.id = f.restaurant_id AND f.user_id = ?
     WHERE r.status = 'approved'`,
    [userId]
  );
  res.render('userViews/userSearch', { restaurants });
});

// Add favorite
router.post('/user/favorite/:restaurantId/add', async (req, res) => {
  const userId = req.session.email;
  const restaurantId = req.params.restaurantId;

  try {
    await db.query(
      'INSERT IGNORE INTO favorites (user_id, restaurant_id) VALUES (?, ?)',
      [userId, restaurantId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ success: false });
  }
});

// Remove favorite
router.post('/user/favorite/:restaurantId/remove', async (req, res) => {
  const userId = req.session.email;
  const restaurantId = req.params.restaurantId;

  try {
    await db.query(
      'DELETE FROM favorites WHERE user_id = ? AND restaurant_id = ?',
      [userId, restaurantId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ success: false });
  }
});


router.get('/user/favorites', async (req, res) => {
  const userId = req.session.email;

  try {
    const [favorites] = await db.query(`
      SELECT r.*, MAX(i.last_inspection) AS last_inspection
      FROM restaurants r 
      JOIN favorites f ON r.id = f.restaurant_id
      LEFT JOIN inspections i ON r.id = i.restaurant_id
      WHERE f.user_id = ? AND r.status = 'approved'
      GROUP BY r.id
    `, [userId]);

    res.render('userViews/favorites', { favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).send("Internal Server Error");
  }
});



module.exports = router; 