const Payment = require('../models/payment');
const Booking = require('../models/booking');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const Rental = require('../models/rental');
const User = require('../models/user');
const Comment = require('../models/comment')

const { normalizeErrors } = require('../helpers/mongoose');

exports.getRentals = (req, res) => {
    Rental
        .find()
        .populate('bookings')
        .populate('user')
        .exec(function (err, foundRentals) {

            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            return res.json(foundRentals);
        });
}
exports.getPendingRentals = (req, res) => {
    Rental
        .find({ $or:[ {'status':undefined}, {'status':'pending'}]})
        .sort({createdAt: -1})
        .populate('user','image username')
        .exec((err, foundRentals) => {
            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }
            return res.status(200).json(foundRentals);
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
                return res.status(422).send({ errors: { title: 'Invalid User!', detail: 'You are not rental owner!' }});
            }

            if (foundRental.bookings.length > 0) {
                return res.status(422).send({ errors: { title: 'Active Bookings!', detail: 'Không thể xóa nơi ở này' } });
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
        .find({})
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

exports.approveRental = (req,res) => {
  const rental = req.body.rentalId;
  Rental.findByIdAndUpdate(rental,{'status':'approved'},{new: true},(err,rental)=>{
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(rental){
      Rental.find({ $or:[ {'status':undefined}, {'status':'pending'}]})
      .sort({createdAt: -1})
      .populate('user','image username _id')
      .exec((err,rentals)=>{
        if(err)
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if(rentals)
          return res.status(200).json(rentals)
      })
    }
    if(!rental)
      return res.status(401).send({detail: `Không tồn tại hoặc đã được duyệt` });
  })
}

exports.forbidRental = (req, res) => {
    const rental = req.body.rentalId;
    Rental.findByIdAndUpdate(rental,{'status':'forbid'},{new: true},(err,rental)=>{
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(rental){
      Rental.find({ $or:[ {'status':undefined}, {'status':'pending'}]})
      .sort({createdAt: -1})
      .populate('user','image username _id')
      .exec((err,rentals)=>{
        if(err)
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if(rentals)
          return res.status(200).json(rentals)
      })
    }
    if(!rental)
      return res.status(401).send({detail: `Không tồn tại hoặc đã được duyệt` });
  })
}
exports.getForbidRentals = (req,res) => {
  Rental
        .find({'status':'forbid'})
        .sort({createdAt: -1})
        .populate('user','image username')
        .exec((err, foundRentals) => {
            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }
            return res.status(200).json(foundRentals);
        });
}