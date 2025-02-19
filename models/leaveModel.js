const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

const Leave = sequelize.define('Leave', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  leaveType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  document: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  statusApprovedBy: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: User,
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

Leave.belongsTo(User, { foreignKey: 'statusApprovedBy', as: 'approver' });

module.exports = Leave;
