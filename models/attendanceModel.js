const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

class Attendance extends Model {
  get day() {
    return this.date ? new Date(this.date).toLocaleString('en-US', { weekday: 'long' }) : null;
  }
  getTotalWorkTime() {
    if (this.checkOut && this.checkIn) {
      const checkInTime = new Date(this.checkIn).getTime();
      const checkOutTime = new Date(this.checkOut).getTime();
      const totalWorkTime = Math.floor((checkOutTime - checkInTime) / 60000);
      return totalWorkTime;
    }
    return 0;
  }

  calculateWorkingHours() {
    const totalWorkTime = this.getTotalWorkTime();
    const adjustedWorkTime = totalWorkTime - this.breakTime; 
    this.workingHours = adjustedWorkTime > 0 ? (adjustedWorkTime / 60).toFixed(2) : 0; 
  }
}

Attendance.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  breakTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0, 
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  workingHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  succeeded: {  
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  sequelize,
  modelName: 'Attendance',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  },
});


User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

Attendance.addHook('beforeSave', (attendance) => {
  attendance.calculateWorkingHours(); 
});

module.exports = Attendance;
