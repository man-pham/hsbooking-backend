const Payment = require('../models/payment');
const Booking = require('../models/booking');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const Rental = require('../models/rental');
const User = require('../models/user');
const Comment = require('../models/comment');
const Contact = require('../models/contact');

const _ = require('lodash')
const { normalizeErrors } = require('../helpers/mongoose');

exports.postComment = (req,res) => {
  const user = res.locals.user._id;
  const rental = req.body.rentalId;
  
  const comment = req.body.comment;
  const rating = req.body.rating;
  const cmt =  new Comment ({user,rental,comment,rating});
  Comment.find({rental:rental, user:user},(err,cmts)=>{
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(cmts.length > 0){
      return res.status(403).send({ detail: 'Bạn không thể đánh giá nữa' } );
    }
    if(cmts.length === 0)
      {
        Comment.create(cmt, (err, cmt) => {
        if(err)
          return res.status(422).send({ errors: normalizeErrors(err.errors) });
        if(cmt)
        {
          Comment
            .aggregate([{$match: {rental:ObjectId(rental)}},
                        {
              $group: {_id: rental,avgRating: {$avg: "$rating"}}
            }
                       ])
            .exec((err,result) => 
                  Rental.findByIdAndUpdate({_id:rental},{rating:result[0].avgRating},{new:true},(err,rental)=>{
            if(err) throw err;
          })
                 );
          return res.status(200).json(cmt);
        }
  })
      }
  })
  
}
exports.getComment = (req,res) =>{
  const limit = req.body.limit;
  const page = req.body.page;
  const rentalId = req.body.rentalId;
  Rental.findById(rentalId)
  .exec((err, rental) =>{
    // if(err)
    //   return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(err | !rental)
      return res.status(404).send({detail:"Không tồn tại nơi này"})
    Comment.find({rental:rentalId})
  .sort('-createdAt')
  .populate('user','username image _id')
  .skip(limit*(page - 1))
  .limit(limit)
  .exec((err, comment)=>{
    if(err)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(comment)
      return res.status(200).json(comment);
  })
  })
}
exports.removeOneComment = (req, res) =>{
  const user = res.locals.user;
  const cmtId = req.params.id;
  Comment.findById(cmtId)
  .exec((err, cmt) => {
    if(err || ! cmt)
      return res.status(404).send({detail:"Không tồn tại đánh giá"})
    if(cmt)
    {
      cmt.remove(err =>{
        return res.status(422).send({ errors: normalizeErrors(err.errors) });        
      })
      return res.status(200).send({detail:'Xóa đánh giá thành công'})
    }
  })
}
exports.createContact = (req, res) => {
  const { name, email, message} = req.body;
  const contact = new Contact({name, email, message})
  Contact.create(contact, (err,ctc) => {
    if(err ||!ctc)
      return res.status(422).send({ errors: normalizeErrors(err.errors) });
    if(ctc)
      return res.status(200).send({detail:'Cam on su gop y cua ban!'})
  })
}