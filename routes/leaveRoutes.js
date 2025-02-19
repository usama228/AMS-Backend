const express = require('express');
const { 
  requestLeave, 
  editLeaveRequest,
  deleteLeaveRequest,
  getAllLeavesByTeamLead,
  getAllLeaves,
  updateLeaveStatus,
  getUserLeaves,
  getUserLeaveStatus
  



} = require('../controllers/leaveController'); 
const router = express.Router();
router.post('/leave', requestLeave);
router.put('/leave', editLeaveRequest);
router.delete('/leaves/:leaveId', deleteLeaveRequest);
router.get('/leaves/team', getAllLeavesByTeamLead);
router.get('/leaves', getAllLeaves);
router.put('/leave/:id/status', updateLeaveStatus);
router.get('/leave/:leaveId', getUserLeaves);
router.get('/leave/:id/status', getUserLeaveStatus);



module.exports = router;
