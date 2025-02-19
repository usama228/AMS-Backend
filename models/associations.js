const { Sequelize } = require('sequelize'); 
const sequelize = require('../config/db'); 
const User = require('./userModel'); 
const Leave = require('./leaveModel'); 
User.hasMany(Leave, { foreignKey: 'userId' }); 
Leave.belongsTo(User, { foreignKey: 'userId' }); 
console.log(User instanceof Sequelize.Model);
console.log(Leave instanceof Sequelize.Model);

module.exports = { User, Leave };
