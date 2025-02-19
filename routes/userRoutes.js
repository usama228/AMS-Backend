const express = require('express');
const {
  createUser,
  getAllUsers,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,

  registerUser ,
  getUserById,
  getUsersByTeamLead,
  
} = require('../controllers/userController');
const { extractUserId,isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/register', registerUser);
router.get('/teamUsers/:teamLeadId', getUsersByTeamLead);
router.post('/user', createUser);
router.get('/user',extractUserId, getAllUsers);
router.get('/user/:id', getUserById);
router.put('/user', updateUser);
router.delete('/user/:id', deleteUser);

module.exports = router;