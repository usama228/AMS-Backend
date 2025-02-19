const express = require("express");
const router = express.Router();
const { addImage, uploadAvatar } = require("../controllers/avatarController");
router.post('/avatar', uploadAvatar, addImage);

module.exports = router;
