const { Op } = require('sequelize');
const Leave = require('../models/leaveModel');
const User = require('../models/userModel');

const requestLeave = async (req, res) => {
  try {
    const { userId, leaveType, startDate, endDate, reason, document } = req.body;

    if (!userId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({
        message: 'User ID, leave type, start date, and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        message: 'End date must be after start date',
      });
    }

    const existingLeaves = await Leave.findAll({
      where: {
        userId,
        [Op.or]: [
          {
            startDate: {
              [Op.lte]: end, 
            },
            endDate: {
              [Op.gte]: start, 
            },
          },
        ],
      },
    });

    if (existingLeaves.length > 0) {
      return res.status(400).json({
        message: 'Leave request already exists for the specified dates.',
      });
    }
    const newLeave = await Leave.create({
      userId,
      leaveType,
      startDate,
      endDate,
      reason,
      document,
      status: 'Pending',
    });

    res.status(201).json({
      data: newLeave,
      succeeded: true,
      message: 'Leave request submitted successfully',
    });
  } catch (error) {
    console.error('Error requesting leave:', error);
    res.status(500).json({
      message: 'An internal error occurred while requesting leave',
      error: error.message,
    });
  }
};
;
const deleteLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    if (!leaveId) {
      return res.status(400).json({ message: 'Leave ID is required' });
    }
    const leave = await Leave.findByPk(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    await leave.destroy();

    res.status(200).json({
      succeeded: true,
      message: 'Leave request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({
      message: 'An internal error occurred while deleting the leave request',
      error: error.message,
    });
  }
};
const getUserLeaves = async (req, res) => {
  const id = req.params.leaveId; 
  try {
  
    const leave = await Leave.findOne({
      where: { id:id },  
      include: [{
        model: User,
        attributes: ['id', 'name'], 
      }]
    });

    if (!leave) {
      return res.status(404).json({ succeeded: false, message: 'No leaves found for this user' });
    }

    res.status(200).json({
      succeeded: true,
      message: 'Leave fetched successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ succeeded: false, message: 'Error fetching leaves for user', error: error.message });
  }
};

const getAllLeavesByTeamLead = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchValue = req.query.searchValue || '';
    const leaveType = req.query.leaveType || '';
    const status = req.query.status || '';
    const teamLeadId = req.userId;
    const skip = (page - 1) * limit;

    const leaves = await Leave.findAll({
      where: {
        [Op.or]: [
          { reason: { [Op.iLike]: `%${searchValue}%` } },
          { leaveType: { [Op.iLike]: `%${searchValue}%` } },
          { userId: { [Op.iLike]: `%${searchValue}%` } },
        ],
        ...(leaveType ? { leaveType: { [Op.iLike]: `%${leaveType}%` } } : {}),
        ...(status ? { status } : {}),
        userId: {
          [Op.in]: Sequelize.literal(`(
            SELECT id FROM users WHERE teamLeadId = ${teamLeadId}
          )`),
        },
      },
      order: [['id', 'ASC']],
      offset: skip,
      limit: limit,
    });
    const totalLeaveCount = await Leave.count({
      where: {
        [Op.or]: [
          { reason: { [Op.iLike]: `%${searchValue}%` } },
          { leaveType: { [Op.iLike]: `%${searchValue}%` } },
          { userId: { [Op.iLike]: `%${searchValue}%` } },
        ],
        ...(leaveType ? { leaveType: { [Op.iLike]: `%${leaveType}%` } } : {}),
        ...(status ? { status } : {}),
        userId: {
          [Op.in]: Sequelize.literal(`(
            SELECT id FROM users WHERE teamLeadId = ${teamLeadId}
          )`),
        },
      },
    });
    const totalPages = Math.ceil((totalLeaveCount || 0) / limit);

    res.status(200).json({
      data: {
        leaves: leaves,
        totalPages,
        currentPage: page,
        totalCount: totalLeaveCount,
      },
      succeeded: true,
      message: "Leaves retrieved successfully",
    });
  } catch (error) {
    console.error('Error fetching leaves for team lead:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const getAllLeaves = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId || '';
    const status = req.query.status || '';
    const skip = (page - 1) * limit;

    const leaves = await Leave.findAll({
      where: {
        ...(userId ? { userId: userId } : {}),
        ...(status ? { status: status } : {}),
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
      offset: skip,
      limit: limit,
    });

    const totalLeavesCount = await Leave.count({
      where: {
        ...(userId ? { userId: userId } : {}),
        ...(status ? { status: status } : {}),
      },
    });

    const totalPages = Math.ceil((totalLeavesCount || 0) / limit);
    res.status(200).json({
      data: {
        leaves: leaves.map(leave => ({
          ...leave.get(),
          approvedBy: leave.approvedBy,
        })),
        totalPages,
        currentPage: page,
        totalCount: totalLeavesCount,
      },
      succeeded: true,
      message: "Leaves fetched successfully",
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approvedBy = req.userId; 

    const validStatuses = ['Approved', 'Rejected', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const leaveRequest = await Leave.findByPk(id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = status;
    
    if (status === 'Approved' || status === 'Rejected') {
      leaveRequest.approvedBy = approvedBy;
    } else {
      leaveRequest.approvedBy = null; 
    }

    await leaveRequest.save();

    res.status(200).json({
      data: leaveRequest,
      succeeded: true,
      message: `Leave status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const leaveRequest = await Leave.findByPk(id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.status(200).json({
      data: {
        id: leaveRequest.id,
        status: leaveRequest.status,
        userId: leaveRequest.userId, 
        createdAt: leaveRequest.createdAt,
        updatedAt: leaveRequest.updatedAt,
      },
      succeeded: true,
      message: `Leave status retrieved successfully`,
    });
  } catch (error) {
    console.error('Error retrieving leave status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const editLeaveRequest = async (req, res) => {
  try {
    const { leaveType,id, startDate, endDate, reason, document } = req.body;

    if (!id || !leaveType || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Leave ID, leave type, start date, and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({
        message: 'End date must be after start date',
      });
    }

    const leave = await Leave.findByPk(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.leaveType = leaveType;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.reason = reason;
    leave.document = document;

    await leave.save();


    res.status(200).json({
      data: leave,
      succeeded: true,
      message: 'Leave request updated successfully',
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({
      message: 'An internal error occurred while updating the leave request',
      error: error.message,
    });
  }
}
module.exports = {
  requestLeave,
  editLeaveRequest,
  deleteLeaveRequest,
  getAllLeavesByTeamLead,
  getAllLeaves,
  updateLeaveStatus,
  getUserLeaves,
  getUserLeaveStatus

};
