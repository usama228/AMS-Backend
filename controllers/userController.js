const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const MAX_LENGTH_NAME = 500;
const MAX_LENGTH_EMAIL = 500;
const validateInputLengths = (name, email) => {
  const errors = [];
  if (name && name.length > MAX_LENGTH_NAME) {
    errors.push({ message: 'Name is too long' });
  }
  if (email && email.length > MAX_LENGTH_EMAIL) {
    errors.push({ message: 'Email is too long' });
  }
  return errors;
};
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { name, email } = req.body;
  const lengthErrors = validateInputLengths(name, email);
  if (lengthErrors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors: lengthErrors });
  }
  next();
};
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};
const generateToken = (id, userType, isTeamLead) => {
  return jwt.sign(
    { id, userType, isTeamLead },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(400);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400);
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = user.toJSON();

    const token = generateToken(user.id, user.userType, user.isTeamLead);
    if (user.status !== 'active') {
      res.status(500).json({
        message: 'User is In Active Contact with Admin',
        succeeded: false,
      });
    }
    if (user.isTerminated === true) {
      res.status(500).json({
        message: 'User is Terminated, Contact with Admin',
        succeeded: false,
      });
    }
    res.status(200).json({
      message: 'Login successful',
      succeeded: true,
      user: { ...userWithoutPassword, token: token },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500);
    throw new Error('Server error');
  }
});

const createUser = asyncHandler(
  async (req, res) => {
    try {
      const {
        name, email, avatar, userType,
        cnic, cnic_front, cnic_back, phone, joiningDate,
        terminatedDate, status, isTeamLead, isTerminated, teamLeadId
      } = req.body;


      if (!name || !email || !userType || !cnic || !joiningDate || !status) {
        res.status(400).json({ message: "Please fill all required fields" });
      }

      const password = 'check_in_123';
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
      }
      const existingCnic = await User.findOne({ where: { cnic } });
      if (existingCnic) {
        res.status(400).json({ message: "Cnic already exists" });

      }
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        res.status(400).json({ message: "Phone already exists" });

      }
      const newUser = await User.create({
        name, email, avatar, userType,
        cnic, cnic_front, cnic_back, phone, password: password,
        joiningDate, terminatedDate, status, isTeamLead, isTerminated, teamLeadId
      });
      if (newUser) {
        res.status(200).json({
          data: {
            newUser
          },
          succeeded: true,
          message: "User created successfully"
        });
      } else {
        res.status(400);
        throw new Error("Invalid user data");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "An internal error occurred" });
    }
  })

const registerUser = asyncHandler(
  async (req, res) => {
    const { name, email, password, avatar, userType } = req.body;

    if (!name || !email || !password) {
      res.status(400)
      throw new Error("Please fill all required fields");
    }

    if (password.length < 8) {
      res.status(400)
      throw new Error("Password must be up to 8 characters");
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400)
      throw new Error("User already exists");
    }
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      password: password,
      avatar,
      userType
    });

    if (newUser) {
      res.status(200).json({
        data: {
          name,
          email,
          avatar,
          userType
        },
        succeeded: true,
        message: "User registered successfully"
      });
    } else {
      res.status(400)
      throw new Error("Invalid user data");
    }
  }
);

const getAllUsers = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchValue = req.query.searchValue || '';
    const userType = req.query.userType || '';
    const isTeamLead = req.query.isTeamLead || '';
    const status = req.query.status || 'active';
    const skip = (page - 1) * limit;


    const users = await User.findAll({
      where: {
        ...(userType ? { userType } : { userType: { [Op.ne]: 'admin' } }),
        ...(isTeamLead ? { isTeamLead: isTeamLead } : {}),
        ...(status ? { status: status } : {}),
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchValue}%` } },
        ]
      },
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
      offset: skip,
      limit: limit,
    });
    const totalUserCount = await User.count({
      where: {
        ...(userType ? { userType } : { userType: { [Op.ne]: 'admin' } }),
        ...(isTeamLead ? { isTeamLead: isTeamLead } : {}),
        ...(status ? { status: status } : {}),
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchValue}%` } },
        ]
      },
    })
    const totalPages = Math.ceil((totalUserCount || 0) / limit)
    res.status(200).json({
      data: {
        users: users,
        totalPages,
        currentPage: page,
        totalCount: totalUserCount
      },
      succeeded: true,
      message: "User created successfully"
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUsersByTeamLead = async (req, res) => {
  try {
    const { teamLeadId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchValue = req.query.searchValue || '';
    const status = req.query.status || 'active';
    const skip = (page - 1) * limit;
    if (!teamLeadId) {
      throw new Error('Team Lead ID is required.');
    }
    const users = await User.findAll({
      where: {
        teamLeadId: teamLeadId,
        status,

        name: { [Op.iLike]: `%${searchValue}%` },
      },
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
      offset: skip,
      limit,
    });

    const totalUserCount = await User.count({
      where: {
        teamLeadId: teamLeadId,
        status,

        name: { [Op.iLike]: `%${searchValue}%` },
      },
    });
    const totalPages = Math.ceil(totalUserCount / limit);
    res.status(200).json({
      data: {
        users,
        totalPages,
        currentPage: page,
        totalCount: totalUserCount,
      },
      succeeded: true,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching users by team lead:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const logoutUser = (req, res) => {

  res.status(200).json({ message: 'Logout successful' });
};
const updateUser = asyncHandler(
  async (req, res) => {
    try {

      const { teamLeadId, id, name, email, password, avatar, userType, cnic, cnic_front, cnic_back, phone, joiningDate, terminatedDate, status, isTeamLead, isTerminated } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }
      if (isTerminated === true) {
        status = 'inactive'
      }
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) {
        user.password = await hashPassword(password);
      }
      if (avatar) user.avatar = avatar;
      if (userType) user.userType = userType;
      if (cnic) user.cnic = cnic;
      if (cnic_front) user.cnic_front = cnic_front;
      if (cnic_back) user.cnic_back = cnic_back;
      if (phone) user.phone = phone;
      if (joiningDate) user.joiningDate = joiningDate;
      if (terminatedDate) user.terminatedDate = terminatedDate;
      if (status) user.status = status;
      if (teamLeadId) user.teamLeadId = teamLeadId;
      if (isTeamLead !== undefined) user.isTeamLead = isTeamLead;
      if (isTerminated !== undefined) user.isTerminated = isTerminated;
      await user.save();
      res.status(200).json({
        data: user,
        succeeded: true,
        message: "User updated successfully"
      });

    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "An internal error occurred" });
    }
  }
);
const getUserById = asyncHandler(
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }


      res.status(200).json({
        data: user,
        succeeded: true,
        message: "User fetched successfully"
      });

    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "An internal error occurred" });
    }
  }
);


const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.status(200).json({
      data: user,
      succeeded: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createUser, registerUser, getAllUsers, loginUser, logoutUser, updateUser, deleteUser, handleValidationErrors, getUserById, getUsersByTeamLead };   