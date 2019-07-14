const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const config = require('./config');
const Rental = require('./models/rental');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Serve the Parse API on the /parse URL prefix
const rentalRoutes = require('./routes/rentals'),
      userRoutes = require('./routes/users'),
      bookingRoutes = require('./routes/bookings'),
      paymentRoutes = require('./routes/payments'),
      commentRoutes = require('./routes/comments'),
      adminRoutes = require('./routes/admin'),
      blogRoutes = require('./routes/blog');
      var connectWithRetry = function() {
        return mongoose.connect(process.env.DATABASE_URL, function(err) {
          if (err) {
            console.log('Kết nối tới database thất bại - Đang thử lại');
            setTimeout(connectWithRetry, 1000);
          }
        });
      };
      connectWithRetry();
const app = express();

app.use('/uploads', express.static('uploads'));
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
app.get('/', (req, res) => res.send('Hello World!') ); 
app.use('/api/v1/rentals', rentalRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/blog', blogRoutes);

if (process.env.NODE_ENV === 'production') {
  const appPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(appPath));

  app.get('*', function(req, res) {
    res.sendFile(path.resolve(appPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

app.listen(PORT , function() {
  console.log('Hello UIT!');
});
