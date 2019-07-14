const express = require('express');
const router = express.Router();

const UserCtrl = require('../controllers/user');
const CommentCtrl = require('../controllers/comment');
router.post("/post", UserCtrl.authMiddleware, CommentCtrl.postComment)
router.post("/get", CommentCtrl.getComment);
router.delete("/:id", CommentCtrl.removeOneComment);
router.post('/createContact',CommentCtrl.createContact);
module.exports = router;


