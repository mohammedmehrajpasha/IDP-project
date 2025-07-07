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


const adminRoutes = require("./src/routes/adminRoutes");
app.use(adminRoutes);

const inspectorRoutes = require("./src/routes/inspectorRoutes");
app.use(inspectorRoutes);


const userRoutes = require("./src/routes/userRoutes");
app.use(userRoutes);

// Routes
app.get('/', (req, res) => res.render('home1'));



app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

app.get('/getGeoLocation', (req, res) => res.render('geoLocation'));
app.locals.formatLabel = function(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};
app.use('/uploads', express.static('D:/images'));



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