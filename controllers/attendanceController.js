const { Op } = require('sequelize');
const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');
const { ERROR_LIST, getMonday } = require('../middleware/authMiddleware');

const checkInUser = async (req, res) => {
  try {
    const { userId, notes, checkIn, breakTime = 0, checkOut } = req.body;
    if (!userId || !checkIn) {
      return res.status(400).json({ message: 'User ID and check-in time are required' });
    }
    const userType = req.userType;
    const isTeamLead = req.isTeamLead;
    const checkInDate = new Date(checkIn).toISOString().split('T')[0];

    if (userType !== 'admin' && isTeamLead === false) {
      const today = new Date().toISOString().split('T')[0];
      const mondayDate = getMonday(today).toISOString().split('T')[0];
      if (checkInDate < mondayDate) {
        return res.status(400).json({ message: 'you cannot mark the attendance of previous dates please contact admin' });
      }
    }
    const existingAttendance = await Attendance.findOne({
      where: { userId, date: checkInDate },
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'User already checked in today' });
    }

    let workingHours = 0;
    if (checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const diffTime = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      workingHours = diffTime - breakTime / 60;
      if (workingHours < 0) workingHours = 0;
    }
    const attendance = await Attendance.create({
      userId,
      date: checkInDate,
      checkIn,
      breakTime,
      notes,
      checkOut,
      workingHours,
    });

    res.status(201).json({
      data: attendance,
      succeeded: true,
      message: 'Check-in successful',
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    return res.status(500).json({ message: 'An internal error occurred', error: error.message });
  }
};

const getAttendanceDetailById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const attendanceRecords = await Attendance.findByPk(id);


    if (!attendanceRecords) {
      return res.status(404).json({ message: ERROR_LIST.NOT_FOUND });
    }
    res.status(200).json({
      data: attendanceRecords,
      succeeded: true,
      message: ERROR_LIST.GET_SUCCESSFULLY,
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
}
const getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const attendanceRecords = await Attendance.findAll({
      where: { userId },
    });
    res.status(200).json({
      data: attendanceRecords,
      succeeded: true,
      message: ERROR_LIST.GET_SUCCESSFULLY,
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
}
const deleteAttendanceByAdmin = async (req, res) => {
  try {
    const { userId, isTeamLead, userType } = req;
    const { id } = req.params;
    if (userType !== 'admin' && isTeamLead === false) {
      return res.status(403).json({ message: 'Access denied. You Have not such right to perform action.' });
    }


    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json({ message: 'No Record found' });
    }

    await attendance.destroy();
    res.status(200).json({
      data: attendance,
      succeeded: true,
      message: "Record deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const editAttendanceByUser = async (req, res) => {
  try {
    const { id, userId, checkIn, checkOut, breakTime, notes } = req.body;

    if (!id || !checkIn) {
      return res.status(400).json({ message: 'User ID and check-in time are required' });
    }
    
    const checkInDate = new Date(checkIn).toISOString().split('T')[0];
    const userType = req.userType;
    const isTeamLead = req.isTeamLead;
    if (userType !== 'admin' && isTeamLead === false) {
      const today = new Date().toISOString().split('T')[0];
      const mondayDate = getMonday(today).toISOString().split('T')[0];
      if (checkInDate < mondayDate) {
        return res.status(400).json({ message: 'you cannot mark the attendance of previous dates please contact admin ' });
      }
    }

    const attendanceRecord = await Attendance.findOne({
      where: {
        id
      },
    });

    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (checkIn) {
      attendanceRecord.checkIn = new Date(checkIn);
    }
    if (checkOut) {
      attendanceRecord.checkOut = new Date(checkOut);
    }
    attendanceRecord.breakTime = breakTime !== undefined ? breakTime : attendanceRecord.breakTime;
    attendanceRecord.notes = notes || attendanceRecord.notes;
    if (attendanceRecord.checkIn && attendanceRecord.checkOut) {
      const diffTime = (attendanceRecord.checkOut - attendanceRecord.checkIn) / (1000 * 60 * 60);
      attendanceRecord.workingHours = diffTime - (attendanceRecord.breakTime / 60);
      if (attendanceRecord.workingHours < 0) {
        attendanceRecord.workingHours = 0;
      }
    }

    await attendanceRecord.save();
    return res.status(200).json({
      data: attendanceRecord,
      succeeded: true,
      message: 'Attendance record updated successfully',
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    return res.status(500).json({ message: 'An internal error occurred', error: error.message });
  }
};


const getAllCheckedInEmployees = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const checkedInRecords = await Attendance.findAll({
      where: {
        checkIn: {
          [Op.ne]: null
        },
        date: today, 
      },
      attributes: ['id', 'checkIn', 'checkOut', 'notes', 'breakTime', 'workingHours', 'date'],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'userType'],
        },
      ],
    });

    if (!checkedInRecords.length) {
      return res.status(404).json({ message: 'No checked-in records found for any users' });
    }

    return res.status(200).json({
      data: checkedInRecords,
      succeeded: true,
      message: 'Checked-in records retrieved successfully for all users',
    });
  } catch (error) {
    console.error('Error retrieving checked-in records:', error);
    return res.status(500).json({ message: 'An internal error occurred', error: error.message });
  }
};



const editCheckInOutByAdmin = async (req, res) => {
  try {
    const { attendanceId, checkIn, checkOut, notes } = req.body;
    const userId = req.user.id;
    const requestingUser = await User.findByPk(userId);
    if (!requestingUser || !['admin', 'teamlead'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Only admin or team lead users can edit check-ins and check-outs' });
    }
    const attendanceRecord = await Attendance.findByPk(attendanceId);
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    attendanceRecord.checkIn = checkIn ? new Date(checkIn) : attendanceRecord.checkIn;
    attendanceRecord.checkOut = checkOut ? new Date(checkOut) : attendanceRecord.checkOut;
    attendanceRecord.notes = notes || attendanceRecord.notes;
    attendanceRecord.calculateWorkingHours();
    await attendanceRecord.save();
    return res.status(200).json({
      data: attendanceRecord,
      succeeded: true,
      message: 'Check-in and check-out times updated successfully',
    });
  } catch (error) {
    console.error('Error updating check-in and check-out times:', error);
    return res.status(500).json({ message: 'An internal error occurred', error: error.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({
      data: employee,
      succeeded: true,
      message: 'Employee details retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    return res.status(500).json({ message: 'Error fetching employee details', error: error.message });
  }
};
module.exports = {
  checkInUser,
  getAttendanceDetailById,
  getUserAttendance,
  editAttendanceByUser,
  getEmployeeById,
  deleteAttendanceByAdmin,
  getAllCheckedInEmployees,
  editCheckInOutByAdmin,

};
