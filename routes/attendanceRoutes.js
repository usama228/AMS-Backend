const express = require('express');
const router = express.Router();
const {
  checkInUser,
  getUserAttendance,
  getEmployeeById,
  getAllCheckedInEmployees,
  editCheckInOutByAdmin,
  editAttendanceByUser,
  deleteAttendanceByAdmin,
  getAttendanceDetailById
} = require('../controllers/attendanceController');
const { isAuthenticated, isAdminOrTeamLead } = require('../middleware/authMiddleware');


router.post('/attendance', isAdminOrTeamLead, checkInUser);
router.put('/attendance', editAttendanceByUser);
router.get('/attendance', getAllCheckedInEmployees);
router.get('/attendance/user/:userId', getUserAttendance);
router.delete('/attendance/:id', isAdminOrTeamLead, deleteAttendanceByAdmin);
router.get('/attendance/:id', getAttendanceDetailById);


module.exports = router;
