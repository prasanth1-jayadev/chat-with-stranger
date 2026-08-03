import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const createReport = async ({
  reporterId,
  reportedUserId,
  reportedRoomId,
  reportedMessageId,
  type = 'user',
  reason,
  description = '',
  messageSnippet = '',
}) => {
  if (!reporterId) {
    throw new AppError('Reporter ID is required', 400);
  }
  if (!reason) {
    throw new AppError('Report reason is required', 400);
  }

  const isValidObjectId = (id) => id && mongoose.Types.ObjectId.isValid(String(id));

  const validReportedUser = isValidObjectId(reportedUserId) ? reportedUserId : null;
  const validReportedRoom = isValidObjectId(reportedRoomId) ? reportedRoomId : null;
  const validReportedMessage = isValidObjectId(reportedMessageId) ? reportedMessageId : null;

  // If room is ephemeral / stranger socket session
  let strangerSession = '';
  if (type === 'stranger' || (!validReportedRoom && reportedRoomId)) {
    strangerSession = String(reportedRoomId || 'Stranger Session');
  }

  let finalSnippet = messageSnippet;
  if (validReportedMessage && !finalSnippet) {
    try {
      const msg = await Message.findById(validReportedMessage);
      if (msg && msg.content) {
        finalSnippet = msg.content;
      }
    } catch (e) {
      // ignore snippet fetch error
    }
  }

  const report = new Report({
    reporter: reporterId,
    reportedUser: validReportedUser,
    reportedRoom: validReportedRoom,
    reportedMessage: validReportedMessage,
    strangerSession: strangerSession || undefined,
    type,
    reason,
    description,
    messageSnippet: finalSnippet,
  });

  await report.save();
  return report;
};

export const getReports = async ({ page = 1, limit = 10, status = 'all', type = 'all' } = {}) => {
  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  if (type && type !== 'all') {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  const reports = await Report.find(query)
    .populate('reporter', 'username email avatar')
    .populate('reportedUser', 'username email avatar isBanned isAdmin')
    .populate('reportedRoom', 'name isPrivate')
    .populate('resolvedBy', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalReports = await Report.countDocuments(query);
  const pendingCount = await Report.countDocuments({ status: 'pending' });

  return {
    reports,
    totalReports,
    totalPages: Math.ceil(totalReports / limit) || 1,
    currentPage: parseInt(page),
    pendingCount,
  };
};

export const resolveReport = async ({ reportId, adminId, action }) => {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  if (action === 'dismiss') {
    report.status = 'dismissed';
    report.actionTaken = 'dismissed';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
  } else if (action === 'ban_user') {
    if (!report.reportedUser) {
      throw new AppError('No user attached to this report to ban', 400);
    }
    const targetUser = await User.findById(report.reportedUser);
    if (!targetUser) {
      throw new AppError('Target user not found', 404);
    }
    if (targetUser.isAdmin) {
      throw new AppError('Cannot ban an admin user', 403);
    }

    targetUser.isBanned = true;
    await targetUser.save();

    // Terminate live socket session
    try {
      const { getIo } = await import('../socket/socketHandler.js');
      if (getIo()) {
        getIo().emit('user_globally_banned', { userId: targetUser._id.toString() });
      }
    } catch (err) {
      console.error('Failed to emit user_globally_banned:', err);
    }

    report.status = 'resolved';
    report.actionTaken = 'user_banned';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
  } else if (action === 'delete_message') {
    if (report.reportedMessage) {
      const message = await Message.findById(report.reportedMessage);
      if (message) {
        const roomId = message.room?.toString();
        await Message.findByIdAndDelete(report.reportedMessage);

        // Broadcast deletion
        try {
          const { getIo } = await import('../socket/socketHandler.js');
          if (getIo() && roomId) {
            getIo().to(roomId).emit('message_deleted', {
              messageId: report.reportedMessage.toString(),
              roomId,
            });
          }
        } catch (err) {
          console.error('Failed to emit message_deleted:', err);
        }
      }
    }

    report.status = 'resolved';
    report.actionTaken = 'message_deleted';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
  } else if (action === 'resolve') {
    report.status = 'resolved';
    report.actionTaken = 'none';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
  } else {
    throw new AppError('Invalid resolution action', 400);
  }

  await report.save();

  return await Report.findById(reportId)
    .populate('reporter', 'username email avatar')
    .populate('reportedUser', 'username email avatar isBanned isAdmin')
    .populate('reportedRoom', 'name isPrivate')
    .populate('resolvedBy', 'username');
};
