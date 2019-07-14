const express = require('express');
const User = require('../controllers/user');
const router = express.Router();

router.post('/forgotpass', User.sendMailToken);
router.get('/info/:id', User.authMiddleware, User.getUser);
router.get('/confirm/:id', User.confirmation);
router.post('/login', User.auth);
router.post('/register', User.register);
router.post('/change',User.authMiddleware,  User.changePass);
router.post('/avatar', User.authMiddleware, User.changeAvatar);
router.post('/oldAvatar', User.authMiddleware, User.oldAvatar)
router.post('/updateinfo', User.authMiddleware, User.updateInfo);
router.post('/reset/:token', User.resetPassword);
router.post('/addBookmark', User.authMiddleware,User.addBookmark);
router.post('/removeBookmark', User.authMiddleware,User.removeBookmark);
router.get('/getBookmark', User.authMiddleware, User.getBookmark);
module.exports = router;


