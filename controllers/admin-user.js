const User = require('../models/user');
const Rental = require('../models/rental');
const Booking = require('../models/booking');
const Comment = require('../models/comment');
const Payment = require('../models/payment');

const { normalizeErrors } = require('../helpers/mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config/prod');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
//16/03
//26/03



exports.getUser = (req, res) => {
  const requestedUserId = req.params.id;
  const user = res.locals.user;
  if (requestedUserId === user.id) {
    User.findById(requestedUserId)
      .select('-revenue -createdAt -password -resetPasswordToken -resetPasswordExpires')
      .populate("searchHistory",'image title address _id')
      .exec((err, foundUser) => {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json(foundUser);
      })
  }
  // else
  //   return res.status(422).send({ errors: normalizeErrors(err.errors) });
}
exports.getAllUser = (req, res) => {
    User.find()
      .populate("searchHistory",'image title address _id')
      .populate('rentals bookings')
      .exec((err, foundUser) => {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.status(200).json(foundUser);
      })
  
}

exports.deactivateUser = (req, res) => {
  const userId = req.body.userId;
  const user = res.locals.user;
  if(user._id === userId)
      return res.status(400).send({detail: 'Không thể vô hiệu hóa admin' });
  User.findByIdAndUpdate({_id:userId},{status:'inactive'},{new: true},(err,user) =>{
      if(err)
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
      if(user)
        return res.status(200).json(user)
    })
  
}
exports.activateUser = (req, res) => {
  const userId = req.body.userId;
  const user = res.locals.user;
  if(user._id === userId)
      return res.status(400).send({ detail: 'Không thể vô hiệu hóa admin' });
  User.findByIdAndUpdate({_id:userId},{status:'active'},{new: true},(err,user) =>{
      if(err)
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
      if(user)
        return res.status(200).json(user)
    })
  
}


exports.auth = (req, res) => {
  const { email, password } = req.body;

  if (!password || !email) {
    return res.status(422).send({ detail: 'Provide email and password!' });
  }

  User.findOne({ email }, (err, user) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (!user) {
      return res.status(404).send({ detail: 'Người dùng không tồn tại' } );
    }
    if (user.role === 'admin')
    {
      if (user.hasSamePassword(password)) {
        const token = jwt.sign({
          userId: user.id,
          username: user.username,
          email: user.email,
          image: user.image,
          role: user.role
        }, config.SECRET, { expiresIn: '12h' });
      return res.status(200).json(token);
    } else {
      return res.status(400).send({ title: 'Sai dữ liệu!', detail: 'Mật khẩu hoặc email không chính xác' });
    }
    } else return res.status(403).send({detail: 'Bạn không có quyền truy cập' });
  });
}





exports.isAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (token) {
    const user = parseToken(token);

    User.findById(user.userId, (err, user) => {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      if (user && user.role==='admin'){
        res.locals.user = user;
        next();
      } else {
        return res.status(401).send({ title: 'Không được chứng thực!', detail: 'Bạn không phải admin!' });

      }
    })
  } else {
    return notAuthorized(res);
  }
}

function parseToken(token) {
  return jwt.verify(token.split(' ')[1], config.SECRET);
}

function notAuthorized(res) {
  return res.status(401).send({ title: 'Không được chứng thực!', detail: 'Bạn cần phải đăng nhập!'  });
}

exports.updateInfo = (req, res) => {
  const data = req.body
  const user = res.locals.user;
  const _id = user.id
  User.findOne({ _id }, (err, user) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (!user) {
      return res.status(422).send({ title: 'Người dùng không hợp lệ!', detail: 'Người dùng không tồn tại'  });
    }
    User.findOneAndUpdate({ _id }, data, (err, user) => {
      if (err)
        return res.status(422).send({ errors: normalizeErrors(err.errors) });

      if (user)
        return res.json(user)
    })           // returns Query

  })
}

exports.getNumbers = (req, res) => {
  const result = {}
  const countPromises = [

  User.countDocuments({}).exec().then(count => result.user = count),
  Rental.countDocuments({}).exec().then(count => result.rental = count),
  Booking.countDocuments({}).exec().then(count => result.booking = count),
  Payment.countDocuments({}).exec().then(count => result.payment = count),
  Comment.countDocuments({}).exec().then(count => result.comment = count)
]
return Promise.all(countPromises).then(() => res.json(result))
}

