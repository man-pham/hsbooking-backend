const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User'},
  rental: { type: Schema.Types.ObjectId, ref: 'Rental'},
  rating: {type: Number, default: 1},
  comment: {type: String}
},{timestamps: {}});

module.exports = mongoose.model('Comment', commentSchema );
