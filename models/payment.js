const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  fromUser: { type: Schema.Types.ObjectId, ref: 'User'},
  toUser: { type: Schema.Types.ObjectId, ref: 'User'},
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  totalPrice: Number,
  payerID : {type: String},
  paymentID: {type: String},
  paymentToken: {type: String},
},{timestamps: {}});

module.exports = mongoose.model('Payment', paymentSchema );
