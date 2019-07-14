const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  startAt: { type: Date, required: 'Cần có ngày bắt đầu'},
  endAt: { type: Date, required: 'Cần có ngày trả phòng'},
  totalPrice: Number,
  days: Number,
  guests: Number,
  owner: { type: Schema.Types.ObjectId, ref: 'User'},
  user: { type: Schema.Types.ObjectId, ref: 'User'},
  rental: { type: Schema.Types.ObjectId, ref: 'Rental'},
  payment: { type: Schema.Types.ObjectId, ref: 'Payment'},
  status: { type: String, default: 'pending'}
},{timestamps: {}});

module.exports = mongoose.model('Booking', bookingSchema );
