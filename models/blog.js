const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema({
  image : {type: String, default:''},
  title: {type: String},
  viewCount: {type: Number, default: 0},
  content: {type: String},
  author: { type: Schema.Types.ObjectId, ref: 'User'},
  status: { type: String, default: 'pending'}
},{timestamps: {}});

module.exports = mongoose.model('Blog', blogSchema );
