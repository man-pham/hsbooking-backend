const express = require('express');
const router = express.Router();

const UserCtrl = require('../controllers/user');
const BookingCtrl = require('../controllers/booking');

router.post('/book', UserCtrl.authMiddleware, BookingCtrl.createBooking);
router.delete('/:id',UserCtrl.authMiddleware, BookingCtrl.deleteBooking);
router.get('/booking/:id',UserCtrl.authMiddleware, BookingCtrl.getBookingsById);
router.get('/manage', UserCtrl.authMiddleware, BookingCtrl.getUserBookings);
router.get('/getCustomerBookings', UserCtrl.authMiddleware, BookingCtrl.getCustomerBookings);
module.exports = router;


