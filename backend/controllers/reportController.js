import * as reportService from '../services/reportService.js';

export const createReport = async (req, res, next) => {
  try {
    const reporterId = req.userId || req.user?.id || req.user?._id;
    const {
      reportedUserId,
      reportedRoomId,
      reportedMessageId,
      type,
      reason,
      description,
      messageSnippet,
    } = req.body;

    const report = await reportService.createReport({
      reporterId,
      reportedUserId,
      reportedRoomId,
      reportedMessageId,
      type,
      reason,
      description,
      messageSnippet,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our moderation team will review it.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { page, limit, status, type } = req.query;
    const data = await reportService.getReports({ page, limit, status, type });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const adminId = req.userId || req.user?.id || req.user?._id;
    const { action } = req.body;

    const report = await reportService.resolveReport({ reportId, adminId, action });

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};
