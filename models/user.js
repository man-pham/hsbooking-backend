const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const userSchema = new Schema({
  username: {
    type: String,
    min: [4, 'Yêu cầu nhập nhiều hơn 4 ký tự'],
    max: [32, 'Yêu cầu tối đa 32 ký tự']
  },
  email: {
    type: String,
    min: [4, 'Yêu cầu nhập nhiều hơn 4 ký tự'],
    max: [32, 'Yêu cầu tối đa 32 ký tự'],
    unique: true,
    lowercase: true,
    required: 'Yêu cầu email',
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
  },
  password: {
    type: String,
    min: [4, 'Yêu cầu nhập nhiều hơn 4 ký tự'],
    max: [32, 'Yêu cầu tối đa 32 ký tự'],
    required: 'Yêu cầu mật khẩu'
  },
  phone: {
    type: String,
    default: ''
    // min: [9, 'Yêu cầu ít nhất 9 số' ],
    // max: [10, 'Yêu cầu tối đa 10 số'],
    // required: true 
  },
  fullname : {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: Date.now
    // required: true
  },

  gender : {type: String, default: undefined},
  address: {type: String, default:''},
  description: {type: String, default:''},
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String, default:undefined},
  resetPasswordExpires: { type: String, default:undefined},
  image: { type: String, default: 'https://res.cloudinary.com/hsuit/image/upload/q_auto:low/v1553620808/default.png'},
  oldImages : [{type:String}],
  revenue: Number,
  rentals: [{type: Schema.Types.ObjectId, ref: 'Rental'}],
  bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  message: {type: String, default:''},
  identityCard: {type: String, default:''},
  isVerified: { type: Boolean, default: false },
  registerToken : {type: String, default: undefined},
  searchHistory: [{type: Schema.Types.ObjectId, ref: 'Rental'}],
  role: {type: String, default: 'user'},
  status: {type: String, default: 'active'},
  bookmark: [{type: Schema.Types.ObjectId, ref: 'Rental'}]
},{timestamps: {}});

userSchema.methods.hasSamePassword = function(requestedPassword) {

  return bcrypt.compareSync(requestedPassword, this.password);
}


userSchema.pre('save', function(next) {
  const user = this;
  if(user.password.length < 15)
  {
  bcrypt.genSalt(10, async function(err, salt) {
    await bcrypt.hash(user.password, salt)
      .then(hash =>  {
        user.password = hash;
        next();
    });
  });
  }
  else next();
});

module.exports = mongoose.model('User', userSchema );

