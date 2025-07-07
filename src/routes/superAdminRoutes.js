// routes/superAdmin.js
const express = require('express');
const router = express.Router();
const db = require('../config/dbConnect');

const SUPERADMIN_CREDENTIALS = {
  username: 'superadmin',
  password: 'super123' // hardcoded for now
};

router.get('/', (req, res) => {
  res.render('superadmin/login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === SUPERADMIN_CREDENTIALS.username &&
    password === SUPERADMIN_CREDENTIALS.password
  ) {
    req.session.superAdmin = true;
    res.redirect('/superadmin/dashboard');
  } else {
    res.render('superAdmin/login', { error: 'Invalid credentials' });
  }
});

router.get('/superadminDashboard', async (req, res) => {
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');

  const [[stats]] = await db.query(`SELECT COUNT(*) AS totalAdmins FROM admins`);
  res.render('superAdmin/dashboard', { stats });
});

router.get('/admins', async (req, res) => {
  if (!req.session.superAdmin) return res.redirect('/superadmin/login');
  const [admins] = await db.query(`SELECT * FROM admins`);
  res.render('superAdmin/manageAdmins', { admins });
});

router.post('/admins/add', async (req, res) => {
  const { name, email, zone, password } = req.body;
  await db.query(`INSERT INTO admins (name, email, zone, password) VALUES (?, ?, ?, ?)`,
    [name, email, zone, password]);
  res.redirect('/superadmin/admins');
});

router.post('/admins/edit/:id', async (req, res) => {
  const { name, email, zone } = req.body;
  const id = req.params.id;
  await db.query(`UPDATE admins SET name = ?, email = ?, zone = ? WHERE id = ?`,
    [name, email, zone, id]);
  res.redirect('/superadmin/admins');
});

router.post('/admins/delete/:id', async (req, res) => {
  const id = req.params.id;
  await db.query(`DELETE FROM admins WHERE id = ?`, [id]);
  res.redirect('/superadmin/admins');
});

module.exports = router;