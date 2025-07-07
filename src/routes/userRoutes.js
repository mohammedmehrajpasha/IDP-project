const express = require('express');
const router = express.Router();
const db = require('../config/dbConnect');
const upload = require('../config/multer');
const fs = require('fs');

const { checklistSchema, sectionLabels } = require('../data/inspectionCategories');

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


router.get('/user/complaints', async (req, res) => {
  try {
    const userId = req.session.email;

    // Fetch all restaurants (optional for dropdown etc.)
    const [restaurants] = await db.query(
      "SELECT id, name, zone FROM restaurants WHERE status = 'approved'"
    );

    // Fetch user's complaints with restaurant name
    const [complaintsRaw] = await db.query(`
      SELECT c.*, r.name AS restaurant_name 
      FROM complaints c
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);

    // ✅ Parse the 'images' field (stored as JSON string in DB)
    const complaints = complaintsRaw.map(c => ({
      ...c,
      images: c.images ? JSON.parse(c.images) : []  // safely parse
    }));

    res.render('userViews/complaints', { complaints, restaurants });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).send("Server error");
  }
});



router.get('/user/complaint/:id', async (req, res) => {
  try {
    const userId = req.session.email;
    const restaurantId = req.params.id;

    const [[restaurant]] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
    if (!restaurant) return res.status(404).render('error', { message: 'Restaurant not found.' });

    res.render('userViews/fileComplaint', { restaurantId, restaurant });

  } catch (err) {
    console.error("Error fetching restaurant for complaint:", err);
    res.status(500).send("Server error");
  }
});







router.post('/user/complaint/:id', upload.array('images', 5), async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const { subject, description, anonymous } = req.body;
    const userId = req.session.email;

    const imagePaths = req.files.map(file => file.filename); // store filenames only

    await db.query(
      `INSERT INTO complaints 
      (user_id, restaurant_id, subject, message, is_anonymous, images) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        restaurantId,
        subject,
        description,                 // ✅ saved as `message` in table
        anonymous ? 1 : 0,          // ✅ matches `is_anonymous`
        JSON.stringify(imagePaths)  // ✅ saves array as string
      ]
    );

    res.redirect('/user/complaints');
  } catch (err) {
    console.error('Error filing complaint:', err);
    res.status(500).send('Error filing complaint.');
  }
});



// GET /user/restaurant/:id
router.get('/user/restaurant/:id', async (req, res) => {
  const restaurantId = req.params.id;

  try {
    // Fetch restaurant
    const [[restaurant]] = await db.query('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
    if (!restaurant) return res.status(404).render('error', { message: 'Restaurant not found.' });

    let report = null;
    let inspector = null;
    let scoreColor = '';
    let reportData = {};
    let imageUrls = [];

    if (restaurant.insp_rep_id) {
      const [[r]] = await db.query(`
        SELECT ir.*, ins.name AS inspector_name
        FROM inspection_reports ir
        JOIN inspectors ins ON ins.id = ir.inspector_id
        WHERE ir.id = ?
      `, [restaurant.insp_rep_id]);

      if (r) {
        // Parse JSON fields
        try {
          reportData = typeof r.report_json === 'string' ? JSON.parse(r.report_json) : r.report_json;
        } catch (e) {
          console.error('Invalid JSON in report_json:', e.message);
        }

        try {
          imageUrls = typeof r.image_paths === 'string' ? JSON.parse(r.image_paths) : r.image_paths || [];
        } catch (e) {
          console.error('Invalid JSON in image_paths:', e.message);
        }

        const hygieneScore = parseFloat(r.hygiene_score);
        scoreColor = hygieneScore >= 4 ? 'green' : hygieneScore >= 3 ? 'orange' : 'red';

        report = {
          ...r,
          hygiene_score: hygieneScore,
          report_data: reportData,
          image_urls: imageUrls
        };

        inspector = {
          name: r.inspector_name
        };
      }
    }

    res.render('userViews/viewRestaurant', {
      restaurant,
      report,
      inspector,
      scoreColor,
      checklistSchema,
      sectionLabels
    });

  } catch (err) {
    console.error('Failed to load restaurant details:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

module.exports = router;



module.exports = router;


