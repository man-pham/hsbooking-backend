const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rentalSchema = new Schema({
  title: { type: String, required: true, max: [128, 'Too long, max is 128 characters'] },
  city: { type: String, required: true, lowercase: true },
  address: { type: String, required: true, min: [4, 'Too short, min is 4 characters'] },
  category: { type: String, required: true, lowercase: true },
  image: [String],
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  people: { type: Number,  default: 0},
  // bedrooms: Number,
  // shared: Boolean,
  description: { type: String, required: true },
  // dailyRate: Number,
  price : { type: Number, required: true},
  rating : { type:Number, default: 0},
  isWifi: {type: Boolean,  default: false},
  isConditioner : { type: Boolean,  default: false},
  isTv : { type: Boolean,  default: false},
  isWashing: { type: Boolean, default: false},
  isFridge: { type: Boolean, default: false},
  isElevator : { type: Boolean, default: false},
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  status: {type: String, default:'pending'}
},{timestamps: {}});


module.exports = mongoose.model('Rental', rentalSchema);
