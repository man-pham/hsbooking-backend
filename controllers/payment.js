const Payment = require('../models/payment');
const Booking = require('../models/booking');

const Rental = require('../models/rental');
const User = require('../models/user');

const { normalizeErrors } = require('../helpers/mongoose');



exports.getPendingPayments = function (req, res) {

    const user = res.locals.user;

    Payment
        .where({ toUser: user })
        .populate({
            path: 'booking',
            populate: { path: 'rental' }
        })
        .populate('fromUser')
        .exec(function (err, foundPayments) {
            if (err) {
                return res.status(422).send({ errors: normalizeErrors(err.errors) });
            }

            return res.json(foundPayments);
        })
}
exports.createPayment = (req, res) => {
    const user = res.locals.user;
    const { toUser, booking, totalPrice, payerID, paymentID, paymentToken } = req.body;
    const fromUser = user._id;
    Booking.findByIdAndUpdate({ _id: booking }, { status: 'paid' })
      .populate('rental')
      .populate('owner','_id image username message')
      .exec((err, foundBooking) => {
        if (err)
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if (!foundBooking)
            return res.status(403).send({ title: 'Không tìm thấy', detail: 'Đặt phòng không tồn tại!'});
        if (foundBooking) {
            const payment = new Payment({ fromUser, toUser, booking, totalPrice, payerID, paymentID, paymentToken })
            Payment.create(payment, (err, newPayment) => {
                if (err)
                    return res.status(422).send({ errors: normalizeErrors(err.errors) });
                if (newPayment)
                {
                  foundBooking.payment = newPayment._id;
                  foundBooking.status = "Paid";
                  foundBooking.save(err => {
                    if(err)
                      return res.status(422).send({ errors: normalizeErrors(err.errors) });                      
                    return res.status(200).json(foundBooking);
                  })
                }
                    // Booking.find({ user: fromUser }, (err, foundBooking) => {
                    //     if (err)
                    //         return res.status(422).send({ errors: normalizeErrors(err.errors) });
                    //     if(foundBooking)
                    //         return res.json(foundBooking);
                    // })
            })
        }
    })

}



















