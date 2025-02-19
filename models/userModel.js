const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcrypt');


const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  teamLeadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cnic: {
    type: DataTypes.STRING(15), 
    allowNull: true,
    unique: true,
    validate: {
      is: {
        args: [/^\d{5}-\d{7}-\d{1}$|^\d{13}$/], 
        msg: 'CNIC must be in the format XXXXX-XXXXXXX-X or XXXXXXXXXXXXXX',
      },
      customCnicValidation(value) {
        if (value && !/^\d{5}-\d{7}-\d{1}$|^\d{13}$/.test(value)) {
          throw new Error('Invalid CNIC format. It must be XXXXX-XXXXXXX-X or XXXXXXXXXXXXXX.');
        }
      },
    },
  },
  cnic_front: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cnic_back: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
    unique: true,
    validate: {
      is: {
        args: [/^(03\d{9}|\+92\d{10})$/],
        msg: 'Phone number must be in the format "+92 300 0000000" or "0300 0000000".',
      },
    },
  },
  userType: {
    type: DataTypes.ENUM('admin', 'employee', 'teamlead'), 
    allowNull: false,
    defaultValue: 'employee',
  },
  joiningDate: {
    type: DataTypes.DATE, 
    allowNull: true, 
  },
  terminatedDate: {
    type: DataTypes.DATE, 
    allowNull: true, 
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  }, isTeamLead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isTerminated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});


User.prototype.checkPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

User.prototype.isAdmin = function () {
  return this.userType === 'admin';
};

User.prototype.isEmployee = function () {
  return this.userType === 'employee';
};


User.createUser = async (userData) => {
  try {
    const user = await User.create(userData);
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

User.getAllUsers = async () => {
  return await User.findAll();
};

User.getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");
  return user;
};

User.updateUser = async (id, userData) => {
  const user = await User.findByPk(id);
  if (user) {
    await user.update(userData);
    return user;
  }
  throw new Error("User not found");
};

User.deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (user) {
    await user.destroy();
    return true;
  }
  throw new Error("User not found");
};

User.getUsersByRole = async (role) => {
  return await User.findAll({
    where: {
      userType: role,
    },
  });
};

User.emailExists = async (email) => {
  const user = await User.findOne({ where: { email } });
  return !!user;
};


module.exports = User;
