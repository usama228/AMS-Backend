const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Avatar = sequelize.define('Avatar', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    originalname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    mimetype: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = Avatar;
