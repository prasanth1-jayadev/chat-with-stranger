import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import AppError from '../utils/AppError.js';

export const REPORT_QUARANTINE_THRESHOLD = 3;

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

  // =========================================================================
  // 🛡️ AUTO-QUARANTINE & AUTO-MUTE THRESHOLD (Triggers at 3+ pending reports)
  // =========================================================================

  // 1. Auto-Quarantine Room if 3+ pending reports
  if (validReportedRoom) {
    const pendingRoomCount = await Report.countDocuments({
      reportedRoom: validReportedRoom,
      status: 'pending',
    });

    if (pendingRoomCount >= REPORT_QUARANTINE_THRESHOLD) {
      await Room.findByIdAndUpdate(validReportedRoom, {
        isQuarantined: true,
        quarantineReason: `Auto-quarantined due to ${pendingRoomCount} community reports pending admin moderation`,
        quarantinedAt: new Date(),
      });

      try {
        const { getIo } = await import('../socket/socketHandler.js');
        if (getIo()) {
          getIo().emit('room_quarantined', {
            roomId: validReportedRoom.toString(),
            reason: 'Room has been temporarily quarantined for moderation review.',
          });
        }
      } catch (err) {
        console.error('Failed to emit room_quarantined:', err);
      }
    }
  }

  // 2. Auto-Mute User if 3+ pending reports
  if (validReportedUser) {
    const pendingUserCount = await Report.countDocuments({
      reportedUser: validReportedUser,
      status: 'pending',
    });

    if (pendingUserCount >= REPORT_QUARANTINE_THRESHOLD) {
      const muteExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours temporary mute
      await User.findByIdAndUpdate(validReportedUser, {
        isMuted: true,
        mutedUntil: muteExpiry,
        muteReason: `Auto-muted due to ${pendingUserCount} community reports pending admin moderation`,
      });

      try {
        const { getIo } = await import('../socket/socketHandler.js');
        if (getIo()) {
          getIo().emit('user_muted', {
            userId: validReportedUser.toString(),
            mutedUntil: muteExpiry,
            reason: 'Your account messaging has been temporarily restricted due to multiple community reports.',
          });
        }
      } catch (err) {
        console.error('Failed to emit user_muted:', err);
      }
    }
  }

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
    .populate('reportedUser', 'username email avatar isBanned isMuted mutedUntil isAdmin')
    .populate('reportedRoom', 'name isPrivate isQuarantined quarantineReason')
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

  if (action === 'dismiss' || action === 'resolve') {
    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
    report.actionTaken = action === 'dismiss' ? 'dismissed' : 'none';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();

    // Check if we should restore/un-quarantine room
    if (report.reportedRoom) {
      const remainingRoomReports = await Report.countDocuments({
        reportedRoom: report.reportedRoom,
        status: 'pending',
        _id: { $ne: reportId },
      });

      if (remainingRoomReports < REPORT_QUARANTINE_THRESHOLD) {
        await Room.findByIdAndUpdate(report.reportedRoom, {
          isQuarantined: false,
          quarantineReason: '',
        });

        try {
          const { getIo } = await import('../socket/socketHandler.js');
          if (getIo()) {
            getIo().emit('room_unquarantined', {
              roomId: report.reportedRoom.toString(),
            });
          }
        } catch (err) {
          console.error('Failed to emit room_unquarantined:', err);
        }
      }
    }

    // Check if we should restore/un-mute user
    if (report.reportedUser) {
      const remainingUserReports = await Report.countDocuments({
        reportedUser: report.reportedUser,
        status: 'pending',
        _id: { $ne: reportId },
      });

      if (remainingUserReports < REPORT_QUARANTINE_THRESHOLD) {
        await User.findByIdAndUpdate(report.reportedUser, {
          isMuted: false,
          mutedUntil: null,
          muteReason: '',
        });

        try {
          const { getIo } = await import('../socket/socketHandler.js');
          if (getIo()) {
            getIo().emit('user_unmuted', {
              userId: report.reportedUser.toString(),
            });
          }
        } catch (err) {
          console.error('Failed to emit user_unmuted:', err);
        }
      }
    }
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
    targetUser.isMuted = false;
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
  } else if (action === 'delete_room') {
    if (!report.reportedRoom) {
      throw new AppError('No room attached to this report to delete', 400);
    }
    const targetRoomId = report.reportedRoom.toString();
    await Room.findByIdAndDelete(targetRoomId);
    await Message.deleteMany({ room: targetRoomId });

    try {
      const { getIo } = await import('../socket/socketHandler.js');
      if (getIo()) {
        getIo().emit('room_deleted', { roomId: targetRoomId });
      }
    } catch (err) {
      console.error('Failed to emit room_deleted:', err);
    }

    report.status = 'resolved';
    report.actionTaken = 'room_deleted';
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
  } else {
    throw new AppError('Invalid resolution action', 400);
  }

  await report.save();

  return await Report.findById(reportId)
    .populate('reporter', 'username email avatar')
    .populate('reportedUser', 'username email avatar isBanned isMuted mutedUntil isAdmin')
    .populate('reportedRoom', 'name isPrivate isQuarantined quarantineReason')
    .populate('resolvedBy', 'username');
};
