const express = require('express');
const router = express.Router();

const AdminCtrl = require('../controllers/admin-user');
const BookingCtrl = require('../controllers/admin-booking');
const RentalCtrl = require('../controllers/admin-rental');
const BlogCtrl = require('../controllers/blog')

router.post('/login', AdminCtrl.auth );
router.get('/getUsers', AdminCtrl.isAdmin,AdminCtrl.getAllUser);
router.post('/deactivate', AdminCtrl.isAdmin,AdminCtrl.deactivateUser);
router.post('/activate', AdminCtrl.isAdmin, AdminCtrl.activateUser)

router.get('/getRentals', AdminCtrl.isAdmin,RentalCtrl.getRentals);
router.get('/getPendingRentals', AdminCtrl.isAdmin, RentalCtrl.getPendingRentals);
router.get('/getForbidRentals', AdminCtrl.isAdmin, RentalCtrl.getForbidRentals);
router.post('/approveRental', AdminCtrl.isAdmin, RentalCtrl.approveRental);
router.post('/forbidRental', AdminCtrl.isAdmin, RentalCtrl.forbidRental);
router.get('/getNumbers', AdminCtrl.isAdmin, AdminCtrl.getNumbers);

router.get('/getPendingBlogs', AdminCtrl.isAdmin, BlogCtrl.getPedingBlogs);
router.post('/approveBlog', AdminCtrl.isAdmin, BlogCtrl.approveBlog);
module.exports = router;
