const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const Avatar = require('../models/avatarModel');

const getBaseUrl = (req, avatarUrl) => {
    const newPath = avatarUrl.replace('public/images', '');
    console.log(process.env.PORT,"ssss",req.protocol,"ss",req.hostname,'reqr',req.file)
    return `${req.protocol}://${req.hostname}:${process.env.PORT_NAME}/${newPath}`;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/Images'); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({ storage }).single('avatar'); 

const uploadAvatar = (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        next(); 
    });
};

const addImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const img = await Avatar.create({
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: getBaseUrl(req, req.file.path)
            // path: `http://localhost:5000/images/${req.file.filename}` 
        });

        res.status(200).json({
            data: img,
            succeeded: true
        });
    } catch (error) {
        console.error('Error while adding image:', error);
        res.status(500).json({ message: "An internal error occurred", error: error.message });
    }
});


module.exports = {
    addImage,
    upload,
    uploadAvatar,
};
