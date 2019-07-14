const express = require('express');
const router = express.Router();
const Rental = require('../models/rental');
const { normalizeErrors } = require('../helpers/mongoose');
const UserCtrl = require('../controllers/user');
const RentalCtrl = require('../controllers/rental')

router.get('/secret', UserCtrl.authMiddleware, function (req, res) {
	res.json({ "secret": true });
});

router.get('/manage', UserCtrl.authMiddleware, RentalCtrl.getUserRentals);

router.get('/:id/verify-user', UserCtrl.authMiddleware, RentalCtrl.verifyUser);

router.get('/:id', UserCtrl.authOrNot, RentalCtrl.addSearchHistory);

router.get('/search/top', RentalCtrl.getTopRentals);

router.patch('/:id', UserCtrl.authMiddleware, function (req, res) {
	const rentalData = req.body;
	const user = res.locals.user;
	Rental
		.findById(req.params.id)
		.populate('booking', 'startAt endAt')
		.populate('user')
		.exec(function (err, foundRental) {

			if (err) {
				return res.status(422).send({ errors: normalizeErrors(err.errors) });
			}

			if (foundRental.user.id !== user.id) {
				return res.status(422).send({ title: 'Invalid User!', detail: 'You are not rental owner!' });
			}

			foundRental.set(rentalData);
			foundRental.save(function (err) {
				if (err) {
					return res.status(422).send({ errors: normalizeErrors(err.errors) });
				}
				return res.status(200).send(foundRental);
			});
		});
});

router.delete('/:id', UserCtrl.authMiddleware, RentalCtrl.deleteRental);

router.post('/create', UserCtrl.authMiddleware, RentalCtrl.createRental)
router.get('', (req, res) => {
	const city = req.query.city;
	const query = city ? { city: city.toLowerCase() } : {};
	Rental.find(query)
		.where({ status: 'approved' })
		.sort({ createdAt: -1 })
		.populate('user', 'image _id username')
		.select('-bookings')
		.exec((err, foundRentals) => {
			if (err) {
				return res.status(422).send({ errors: normalizeErrors(err.errors) });
			}
			if (city && foundRentals.length === 0) {
				return res.status(422).send({ title: 'No Rentals Found!', detail: `There are no rentals for city ${city}` });
			}
			return res.json(foundRentals);
		});
});
router.post('/update/:id', UserCtrl.authMiddleware, RentalCtrl.updateRental)
module.exports = router;


