const Payment = require('../models/payment');
const Booking = require('../models/booking');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const Rental = require('../models/rental');
const User = require('../models/user');
const Comment = require('../models/comment')

const { normalizeErrors } = require('../helpers/mongoose');

exports.getUserRentals = (req, res) => {
	const user = res.locals.user;

	Rental
		.where({ user })
		.sort({ createdAt: -1 })
		.populate('bookings')
		.exec(function (err, foundRentals) {

			if (err) {
				return res.status(422).send({ errors: normalizeErrors(err.errors) });
			}

			return res.json(foundRentals);
		});
}

exports.verifyUser = (req, res) => {
	const user = res.locals.user;

	Rental
		.findById(req.params.id)
		.populate('user')
		.exec(function (err, foundRental) {
			if (err) {
				return res.status(422).send({ errors: normalizeErrors(err.errors) });
			}

			if (foundRental.user.id !== user.id) {
				return res.status(422).send({ errors: { title: 'Invalid User!', detail: 'You are not rental owner!' } });
			}


			return res.json({ status: 'verified' });
		});
}

exports.addSearchHistory = (req, res) => {
	const rentalId = req.params.id;
	const user = res.locals.user;
	Rental.findById(rentalId)
		.populate('user', 'username _id image message')
		.populate('bookings', 'startAt endAt -_id')
		.exec(function (err, foundRental) {

			if (err || !foundRental) {
				return res.status(422).send({ title: 'Rental Error!', detail: 'Không tồn tại nơi ở!' });
			}
			if (user) {
				const searchHistory = user.searchHistory;
				for (var i = 0; i < searchHistory.length; i++) {
					if (String(searchHistory[i]._id) === rentalId) {
						searchHistory.splice(i, 1);
					}
				}
				if (rentalId)
					searchHistory.unshift(rentalId)
				user.searchHistory = searchHistory;
				user.save((err) => {
					if (err) {
						return res.status(422).send({ errors: normalizeErrors(err.errors) });
					}
				})
			}
			return res.json(foundRental);
		});
}
exports.createRental = (req, res) => {
	// const dUri = new Datauri();
	Rental.findOne({ title: req.body.title }, (err, foundRental) => {
		if (err)
			return res.status(422).send({ errors: normalizeErrors(err.errors) });
		if (foundRental)
			return res.status(422).send({ title: 'Rentals Found!', detail: `Tên nhà ở đã có người sử dụng` });
		const { title, city, address, category, bedrooms, bathrooms, description, price, people, isTv, isWifi,
			isElevator, isWashing, isFridge, isConditioner, image } = req.body;

		// Promise.all(change)
		//     .then(() => {
		const rental = new Rental({
			title, city, address, category, bedrooms, bathrooms,
			description, price, people, isTv, isWifi, isElevator, isWashing, isFridge,
			isConditioner, image
		});
		const user = res.locals.user._id;
		rental.user = user;
		Rental.create(rental, function (err, newRental) {
			if (err) {
				console.log(err)
				return res.status(422).send({ errors: normalizeErrors(err.errors) });
			}
			User.update({ _id: user }, { $push: { rentals: newRental } }, function () { });
			return res.json(newRental);
		});
		// })
		// .catch((err) => { return res.status(422).send({ errors: normalizeErrors(err.errors) }); })
	});
}
exports.deleteRental = (req, res) => {
	const user = res.locals.user;
	Rental
		.findById(req.params.id)
		.populate('user', '_id')
		.populate({
			path: 'bookings',
			select: 'startAt',
			match: { startAt: { $gt: new Date() } }
		})
		.exec(function (err, foundRental) {

			if (err) {
				return res.status(422).send({ errors: normalizeErrors(err.errors) });
			}

			if (user.id !== foundRental.user.id) {
				return res.status(422).send({ title: 'Invalid User!', detail: 'Bạn không phải là chủ nhà' });
			}

			if (foundRental.bookings.length > 0) {
				return res.status(422).send({ title: 'Active Bookings!', detail: 'Không thể xóa nơi ở này' });
			}

			foundRental.remove(function (err) {
				if (err) {
					return res.status(422).send({ errors: normalizeErrors(err.errors) });
				}
				Rental.find({}).then((rental) => res.json(rental))
				// return res.json({ 'status': 'deleted' });
			});
		});
}
exports.getTopRentals = (req, res) => {
	Rental
		.find({ status: 'approved' })
		.sort({ rating: -1 })
		.limit(10)
		.select('_id image title address rating price')
		.exec(function (err, foundRental) {
			if (err) {
				return res.status(422).send({ errors: normalizeErrors(err.errors) });
			}
			return res.json(foundRental);
		});
}
exports.updateRental = (req, res) => {
	const user = res.locals.user
	Rental.findById(req.params.id, (err, foundRental) => {
		if (err)
			return res.status(422).send({ errors: normalizeErrors(err.errors) });
		if (!foundRental)
			return res.status(404).send({ title: 'No Rentals Found!', detail: `Không tồn tại nơi ở này` });
		if (String(foundRental.user) !== String(user._id)) {
			return res.status(422).send({ title: 'Không có quyền!', detail: `Bạn không có quyền chỉnh sửa` });
		}
		const { title, city, address, category, bedrooms, bathrooms, description, price, people, isTv, isWifi,
			isElevator, isWashing, isFridge, isConditioner, image } = req.body;

		const data = {
			title, city, address, category, bedrooms, bathrooms,
			description, price, people, isTv, isWifi,
			isElevator, isWashing, isFridge, isConditioner, image
		}
		Rental.findByIdAndUpdate({ _id: req.body._id }, data, { new: true }, (err, rental) => {
			res.json(rental)
		})

	})
}
