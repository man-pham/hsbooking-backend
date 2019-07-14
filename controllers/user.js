const User = require('../models/user');
const Rental = require('../models/rental');

const { normalizeErrors } = require('../helpers/mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config/prod');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
//16/03
const moment = require('moment')

exports.getUser = (req, res) => {
  const requestedUserId = req.params.id;
  const user = res.locals.user;
  if (requestedUserId === user.id) {
    User.findById(requestedUserId)
      .select('-revenue -createdAt -password -resetPasswordToken -resetPasswordExpires')
      .populate("searchHistory",'image title address _id')
      .populate('bookmark','title address price rating _id image')
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

exports.changeAvatar = (req, res) => {
  const user = res.locals.user;
  let { _id, email,image, oldImages } = user;
  oldImages.unshift(image)
  const {avatar} = req.body;
  User.findOneAndUpdate({ email }, { oldImages, image: avatar }, { new: true })
  .populate('bookmark','title address price rating _id image')
  .exec((err, user) => {
    if (err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(!user)
      return res.status(401).send({detail:"Khong ton tai nguoi dung"})
    if (user)
      return res.status(200).json(user)
  })
}

exports.oldAvatar = (req, res) => {
  const user = res.locals.user;
  let { oldImages, image, email } = res.locals.user;
  oldImages.remove(req.body.src);
  oldImages.push(user.image);
  image = req.body.src
  User.findOneAndUpdate({ email }, { oldImages, image }, { new: true })
  .populate('bookmark','title address price rating _id image')

    .exec((err, user) => {
    if (err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if (user)
      return res.status(200).json(user)
  })
}

exports.auth = (req, res) => {
  const { email, password } = req.body;

  if (!password || !email) {
    return res.status(422).send({ title: 'Data missing!', detail: 'Provide email and password!' });
  }

  User.findOne({ email }, (err, user) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (!user) {
      return res.status(404).send({ title: 'Người dùng không hợp lệ!', detail: 'Người dùng không tồn tại' });
    }
    if(!user.isVerified)
     return res.status(401).send({ status: 'Error', detail: 'Tài khoản chưa xác thực' });
    if(user.status === 'inactive')
      return res.status(404).send({ title: 'Tài khoản bị vô hiệu!', detail: 'Tài khoản bạn đã bị vô hiệu'  });
    if (user.hasSamePassword(password)) {
      const token = jwt.sign({
        userId: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        role: user.role
      }, config.SECRET, { expiresIn: '12h' });

      return res.json(token);
    } else {
      return res.status(400).send({  title: 'Sai dữ liệu!', detail: 'Mật khẩu hoặc email không chính xác' });
    }
  });
}


exports.register = (req, res) => {
  const url = req.get('origin')
  const { username, email, password, passwordConfirmation } = req.body;
  if (!password || !email) {
    return res.status(400).send({  status: 'Error', detail: 'Điền đầy đủ thông tin!' });
  }
  if (password !== passwordConfirmation) {
    return res.status(400).send({ status: 'Error', detail: 'Mật khẩu xác nhận không hợp lệ!' });
  }
  User.findOne({ email }, (err, existingUser) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }

    if (existingUser) {
      return res.status(422).send({ status: 'Email không hợp lệ!', detail: 'Người dùng với email này đã tồn tại!' });
    }
    User.findOne({ username }, (err, foundUser) => {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
      if (foundUser) {
        return res.status(422).send({  status: 'Tên người dùng không hợp lệ!', detail: 'Người dùng với username này đã tồn tại!' });
      }
      const registerToken = crypto.randomBytes(20).toString('hex');
      const user = new User({
        username,
        email,
        password,
        registerToken
      });
      user.save((err,user) => {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        var smtpTransport = nodemailer.createTransport(/*'SMTP',*/ {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          type: 'OAuth2',
          user: '15520579@gm.uit.edu.vn',
          clientId: '1084231637210-5s064d297c3enbsfhshjdiq74pjdab7a.apps.googleusercontent.com',
          clientSecret: 'N_UDvg3p_N3B8A2tO8eCinLa',
          refreshToken: '1/hYs8fnGIEHiBXMzz9m-VC5CWwAfsGQJb1q5yRTClkao',
          accessToken: 'ya29.Gls7BrzkosyRcDTkCShI7GRG8hQ7aifSM4Cyr9W-BC8vehOrHI5vDW6hhzU-IPPa-uQMgZWq2urxJFnHlJE-01EA4ZNax6seEa_KLdY8xE7IMRBtMybk1PQ-uOUc'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'registerconfirm@uitbooking.com',
        subject: 'Account Verification Token',
        text: 'Please verify your account by clicking the link:\n\n'
          +url+"/confirm/" + registerToken + '\n\n'       
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        if (err){
          console.log(err)
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.status(200).send({ result: { status: 'OK', detail:"Đăng ký thành công"}});
      });
        
      })
    })
  }
  )
}

exports.changePass = (req, res) => {
  const { _id, password, newPassword } = req.body;
  User.findOne({ _id }, (err, user) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (!user) {
      return res.status(422).send({ detail: 'Người dùng không tồn tại' });
    }
    if (user.hasSamePassword(password)) {
      user.password = newPassword;
      user.save((err) => {
        if (err) {
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        }
        return res.json({ 'changed': true });
      })
    }
    else {
      return res.status(422).send({ detail: 'Sai mật khẩu' });
    }
  })
}

exports.resetPassword = (req, res) => {
  async.waterfall([
    (done) => {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
          return res.status(401).send({ detail: 'Token reset mật khẩu không hợp lệ hoặc hết hiệu lực' })
        }
        if (user) {
          if (req.body.newPassword !== req.body.newPasswordConfirmation) {
            return res.status(422).send({ detail: 'Mật khẩu xác nhận không hợp lệ!'});
          }
          user.password = req.body.newPassword;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
        }
        user.save((err) => {
          if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
          }
          return res.json({ 'reset': true });
        });
      });
    },], (err) => {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    });
}

exports.sendMailToken = (req, res, next) => {
  const url = req.get('origin')
  async.waterfall([
    (done) => {
      crypto.randomBytes(20, (err, buf) => {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    (token, done) => {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (!user) {
          return res.status(422).send({ title: 'Người dùng không hợp lệ!', detail: 'Người dùng không tồn tại'});
        }
        if(user.resetPasswordExpires!=undefined && user.resetPasswordExpires > Date.now())
          return res.status(403).send({detail:'Đã có email gửi tới bạn. Xin hãy kiểm tra lại.'})
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    (token, user, done) => {
      var smtpTransport = nodemailer.createTransport(/*'SMTP',*/ {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          type: 'OAuth2',
          user: '15520579@gm.uit.edu.vn',
          clientId: '1084231637210-5s064d297c3enbsfhshjdiq74pjdab7a.apps.googleusercontent.com',
          clientSecret: 'N_UDvg3p_N3B8A2tO8eCinLa',
          refreshToken: '1/hYs8fnGIEHiBXMzz9m-VC5CWwAfsGQJb1q5yRTClkao',
          accessToken: 'ya29.Gls7BrzkosyRcDTkCShI7GRG8hQ7aifSM4Cyr9W-BC8vehOrHI5vDW6hhzU-IPPa-uQMgZWq2urxJFnHlJE-01EA4ZNax6seEa_KLdY8xE7IMRBtMybk1PQ-uOUc'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@uitbooking.demo.com',
        subject: 'UIT Booking Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n'
          +url+'/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        // req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        res.json({ 'sendSuccess': true });
        done(err, 'done');
      });
    }
  ], (err) => {
    if (err) return next(err);
    return res.status(422).send({ errors: normalizeErrors(err.errors) });
  });
}

exports.authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (token) {
    const user = parseToken(token);

    User.findById(user.userId)
    .populate('bookmark','title address price rating _id image')
    .exec((err, user) => {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      if (user) {
        res.locals.user = user;
        next();
      } else {
        return notAuthorized(res);
      }
    })
  } else {
    return notAuthorized(res);
  }
}
exports.authOrNot = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    const user = parseToken(token);
    User.findById(user.userId, (err, user) => {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      if (user) {
        res.locals.user = user;
        next();
      }
    })
  }
  else next()
}
function parseToken(token) {
  return jwt.verify(token.split(' ')[1], config.SECRET);
}

function notAuthorized(res) {
  return res.status(401).send({  title: 'Không được chứng thực!', detail: 'Bạn cần phải đăng nhập!'});
}

exports.updateInfo = (req, res) => {
  const data = req.body
  const user = res.locals.user;
  const _id = user.id;
  User.findOne({ _id }, (err, user) => {
    if (err) {
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    }
    if (!user) {
      return res.status(422).send({detail: 'Người dùng không tồn tại'});
    }
    User.findOneAndUpdate({ _id }, data,{new: true}, (err, user) => {
      if (err)
        return res.status(422).send({ errors: normalizeErrors(err.errors) });

      if (user)
        {
        return res.json(user)
        }
    })           // returns Query

  })
}

exports.confirmation = (req,res) =>{
  User.findOneAndUpdate({ registerToken: req.params.id }, {isVerified: true, registerToken: undefined}, { new: true }, (err, user)=>{
    if(err)
          return res.status(422).send({ errors: normalizeErrors(err.errors) });    
    if(!user)
      return res.status(404).send({ detail: 'Token không hợp lệ hoặc tài khoản đã được xác nhận' });
    return res.status(200).send({status:"OK",detail:"Đã xác nhận tài khoản thành công"})
  })
}
exports.addBookmark = (req,res) => {
  const rentalId = req.body.rentalId;
    const user= res.locals.user;
    Rental.findById(rentalId)
      .exec(function (err, foundRental) {
      if (err || !foundRental) {
        return res.status(422).send({ detail: 'Could not find Rental!'  });
      }
      if(user){
        const bookmark = user.bookmark;
        if(rentalId)
        bookmark.unshift(rentalId)
        user.bookmark = bookmark;
        user.save((err) => {
          if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
          }})
        return res.status(200).json({"bookmark": user.bookmark});  
      }});
}
exports.removeBookmark = (req,res) => {
  const rentalId = req.body.rentalId;
    const user= res.locals.user;
    Rental.findById(rentalId)
      .exec(function (err, foundRental) {
      if (err || !foundRental) {
        return res.status(422).send({ detail: 'Could not find Rental!'  });
      }
      if(user){
        const bookmark = user.bookmark;
        if(rentalId)
        bookmark.remove(rentalId)
        user.bookmark = bookmark;
        user.save((err) => {
          if (err) {
            return res.status(422).send({ errors: normalizeErrors(err.errors) });
          }})
        
        return res.status(200).json({"bookmark": user.bookmark});  
      }});
}
exports.getBookmark = (req, res) => {
  const userId = res.locals.user;
  User.findById(userId)
  .sort({createdAt: -1})
  .populate('bookmark','title address price rating _id image')
  .exec((err,user) => {
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(user){
      return res.status(200).json({"bookmark": user.bookmark})}
    if(!user)
      return res.status(404).json({detail:"Không tìm thấy"})
  })
}
// exports.addSearchHistory = (req, res) => {
//   const key = req.body.key
//   const user = res.locals.user;  const _id = user.id

//   const searchHistory = user.searchHistory;
//   for (var i = 0; i < searchHistory.length; i++) {
//     if (searchHistory[i] === key) {
//       searchHistory.splice(i, 1);
//     }
//   }
//   if(key!=null)
//     searchHistory.unshift(key)
//   User.findByIdAndUpdate({_id}, {searchHistory},{ new: true }, (err,user)=>{
//     if(err)
//     return res.status(422).send({ errors: normalizeErrors(err.errors) });
//     if(!user)
//       return res.status(422).send({ errors:{ title: 'Người dùng không hợp lệ!', detail: 'Người dùng không tồn tại' }});
//   })

// }
