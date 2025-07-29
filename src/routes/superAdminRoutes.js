// routes/superAdmin.js
const express = require('express');
const router = express.Router();
const db = require('../config/dbConnect');

const SUPERADMIN_CREDENTIALS = {
  username: 'superadmin@gmail.com',
  password: 'pass123' // hardcoded for now
};


router.get('/superadmin/login', (req, res) => {
  res.render('superadmin/login');
});

router.post('/superadmin/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === SUPERADMIN_CREDENTIALS.username &&
    password === SUPERADMIN_CREDENTIALS.password
  ) {
    req.session.superAdmin = true;
    res.redirect('/superadmin/dashboard?success=1');
  } else {
    res.render('superadmin/login', { error: 'Invalid credentials' });
  }
});

router.get('/superadmin/dashboard', async (req, res) => {
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');

  const [[stats]] = await db.query(`SELECT COUNT(*) AS totalAdmins FROM admins`);
  res.render('superadmin/dashboard', { stats });
});

router.get('/superadmins/admins', async (req, res) => {
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');
  const [admins] = await db.query(`SELECT * FROM admins`);
  res.render('superadmin/manageAdmins', { admins });
});

router.get('/superadmin/admins/add', (req, res) => {
  const success = req.query.success;
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');
  res.render('superadmin/addAdmins', {  success });
});

router.post('/superadmin/admins/add', async (req, res) => {
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');
  const { name, email,phone, zone, password } = req.body;
  await db.query(`INSERT INTO admins (name, email,phone, zone, password) VALUES (?, ?,?, ?, ?)`,
    [name, email, phone,zone, password]);
  res.redirect('/superadmins/admins');
});


router.get('/superadmin/admins/edit/:id', async (req, res) => {
  const adminId = req.params.id;
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');

  try {
    const [results] = await db.query('SELECT * FROM admins WHERE id = ?', [adminId]);
    if (results.length === 0) {
      return res.status(404).render('error', { message: 'Admin not found' });
    }
    res.render('superadmin/editAdmin', { admin: results[0] });
  } catch (err) {
    console.error('Error fetching inspector:', err);
    res.status(500).render('error', { message: 'Failed to load inspector data.' });
  }
});

router.post('/superadmin/admins/edit/:id', async (req, res) => {
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');
  const { name, email,phone, zone } = req.body;
  const id = req.params.id;
  await db.query(`UPDATE admins SET name = ?, email = ?,phone=?, zone = ? WHERE id = ?`,
    [name, email,phone, zone, id]);
  res.redirect('/superadmins/admins');
});

router.post('/superadmin/admins/delete/:id', async (req, res) => {
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');
  const id = req.params.id;
  await db.query(`DELETE FROM admins WHERE id = ?`, [id]);
  res.redirect('/superadmins/admins');
});



module.exports = router;