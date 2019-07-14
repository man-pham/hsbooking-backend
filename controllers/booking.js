const Booking = require('../models/booking');
const Rental = require('../models/rental');
const Payment = require('../models/payment');
const User = require('../models/user');
const { normalizeErrors } = require('../helpers/mongoose');
const moment = require('moment');

const config = require('../config');
exports.createBooking = (req, res) => {
  var error = false;
  var { startAt, endAt, guests, id, price/*rental, paymentToken*/ } = req.body;
  const user = res.locals.user;
  startAt = moment(startAt,'DD/MM/YYYY').format('MM/DD/YYYY');
  endAt = moment(endAt,'DD/MM/YYYY').format('MM/DD/YYYY');
  var d1 = new Date(startAt)//"now"
  var d2 = new Date(endAt)// some date
  var timeDiff = (d2.getTime() - d1.getTime());
  if(timeDiff <= 0)
    return res.status(422).send({ title: 'Thời gian không hợp lệ!', detail: 'Thời gian đặt phòng không hợp lệ'});
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const totalPrice = price * days;
  const booking = new Booking({ startAt, endAt, totalPrice, guests, days });
  Rental.findById(id)
    .populate('bookings')
    .populate('user')
    .exec(async function (err, foundRental) {
      const user = res.locals.user;
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (foundRental.user != null) {
        if (foundRental.user.id === user._id) {
          return res.status(422).send({ title: 'Người dùng không hợp lệ!', detail: 'Không thể đặt phòng cho địa điểm bạn tạo!'  });
        }
      }
      // const wait =  User.findById(user._id)
      //   .populate('bookings')
      //   .exec(async function (err, foundUser){
      //     if (!isValidUserBook(booking,foundUser)) 
      //       error = true;
      //   });
      //   Promise.all


      if (isValidBooking(booking, foundRental)) {
        booking.user = user;
        booking.rental = foundRental;
        booking.owner = foundRental.user;
        foundRental.bookings.push(booking);
        // const { payment, err } = await createPayment(booking, foundRental.user, paymentToken);

        // if (payment) {

        // booking.payment = payment;
        booking.save(function (err) {
          if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
          }

          foundRental.save()
          User.update({ _id: user._id }, { $push: { bookings: booking } }, function () { });
          Booking
            .where({ user })
            .sort({createdAt: -1})
            .populate('owner', 'image username _id')
            .populate('rental')
            .exec(function (err, foundBookings) {
              if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
              }
              return res.json(foundBookings);
            });
        });
        // } else {

        //   return res.status(422).send({ errors: [{ title: 'Payment Error', detail: err }] });
        // }
      } else {
        return res.status(422).send({ title: 'Đặt phòng không hợp lệ!', detail: 'Ngày bạn chọn đã được đặt!' });
      }
    })
}
exports.deleteBooking = function (req, res) {
  const user = res.locals.user;
  Booking
    .findById(req.params.id)
    .populate('user', '_id')
    .exec(function (err, foundBooking) {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (user.id !== foundBooking.user.id) {
        return res.status(403).send({ title: 'Invalid User!', detail: 'Bạn không có quyền xóa!' });
      }

      foundBooking.remove(function (err) {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        Booking
          .where({ user })
          .sort({createdAt: -1})
          .populate('owner')
          .populate('rental')
          .exec(function (err, foundBookings) {
            if (err) {
              return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }
            return res.json(foundBookings);
          });
      });
    });

}
exports.getUserBookings = function (req, res) {
  const user = res.locals.user;
  Booking
    .where({ user })
    .sort({createdAt: -1})
    .populate('owner', 'image username _id')
    .populate('rental')
    .exec(function (err, foundBookings) {

      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      return res.json(foundBookings);
    });
}
exports.getBookingsById = (req, res) => {
  const user = res.locals.user;
  const bookingId = req.params.id;

  Booking
    .findById(bookingId )
    .populate('owner', 'image username _id')
    .populate('rental')
    .exec(function (err, foundBookings) {
      if (err) {
        console.log(err)
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (!foundBookings)
        return res.status(422).send({title: 'Invalid Booking!', detail: 'Hóa đơn không tồn tại!' });
      if (foundBookings) {
        return res.json(foundBookings);
      }
    });
}
exports.getCustomerBookings = (req,res) => {
  const user= res.locals.user;
  Booking.find({'owner':user._id})
  .populate('rental','_id title address ')
  .populate('user','image username _id')
  .exec((err, foundBookings) => {
    if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (!foundBookings)
        return res.status(422).send({title: 'Invalid Booking!', detail: 'Hóa đơn không tồn tại!' });
      if (foundBookings) {
        return res.json(foundBookings);
      }
  })
}
// exports.getOldBookings = (req, res) => {
//   const user = res.locals.user;
//   Booking
//     .where({ user })
//     .where(+moment(endAt) < +moment())
//     .populate('rental')
//     .exec(function (err, foundBookings) {
//       if (err) {
//         return res.status(422).send({ errors: normalizeErrors(err.errors) });
//       }
//       return res.json(foundBookings);
//     });
// }
function isValidBooking(proposedBooking, rental) {
  let isValid = true;

  if (rental.bookings && rental.bookings.length > 0) {
    isValid = rental.bookings.every(function (booking) {
      const proposedStart = moment(proposedBooking.startAt);
      const proposedEnd = moment(proposedBooking.endAt);

      const actualStart = moment(booking.startAt);
      const actualEnd = moment(booking.endAt);

      return ((actualStart < proposedStart && actualEnd < proposedStart) || (proposedEnd < actualEnd && proposedEnd < actualStart));
    });
  }

  return isValid;
}
function isValidUserBook(proposedBooking, user) {
  let isValid = true;
  if (user.bookings && user.bookings.length > 0) {

    isValid = user.bookings.every(function (booking) {
      const proposedStart = moment(proposedBooking.startAt);
      const proposedEnd = moment(proposedBooking.endAt);

      const actualStart = moment(booking.startAt);
      const actualEnd = moment(booking.endAt);

      return ((actualStart < proposedStart && actualEnd < proposedStart) || (proposedEnd < actualEnd && proposedEnd < actualStart));
    });
  }
  return isValid;
}