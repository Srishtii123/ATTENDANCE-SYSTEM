import { Response } from "express";
import { Op } from "sequelize";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import { MsReportMasterSchema } from "../../validation/Security/Security.validation";
import reportmaster from "../../models/Security/ReportModule_security.model";

export const createreportmaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = MsReportMasterSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { reportid, reportname, module, company_code } = req.body;

    const reportExists = await reportmaster.findOne({
      where: { reportid, reportname, module },
    });

    console.log("reportExists", reportExists);
    if (reportExists) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Report already exists.",
      });
      return;
    }

    const reportData = await reportmaster.findOne({
      where: {
        [Op.and]: [
          { reportid: reportid },
          { reportname: reportname },
          { module: module },
          { company_code: company_code },
        ],
      },
    });

    if (reportData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.report_sec.REPORT_ALREADY_EXISTS,
      });
      return;
    }

    const createreportmaster = await reportmaster.create({
      reportid,
      reportname,
      module,
      company_code: req.body.company_code,
      created_by: requestUser.loginid,
      updated_by: requestUser.loginid,
      ...req.body,
    });
    if (!createreportmaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while creating use" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.report_sec.REPORT_CREATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const modifyreportmaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;
    const { report_no } = req.body;

    if (!report_no) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "report number required.",
      });
      return;
    }

    // Find the report master record
    const report = await reportmaster.findOne({
      where: { report_no },
    });

    if (!report) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Report master not found.",
      });
      return;
    }

    const updatableFields = ["reportname", "module", "reportid"];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (report as any)[field] = req.body[field];
      }
    });
    (report as any).updated_by = requestUser.loginid;
    await report.save();

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Report master updated successfully.",
    });
  } catch (error: any) {
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to update report master.",
    });
  }
};

export const getReportMaster = async (req: RequestWithUser, res: Response) => {
  try {
    const { reportname, report_no } = req.query;
    if (!reportname || !report_no) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Both reportname and report_no are required.",
      });
      return;
    }
    const report = await reportmaster.findOne({
      where: {
        reportname: reportname as string,
        report_no: Number(report_no),
      },
    });
    if (!report) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Report not found.",
      });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: report,
    });
  } catch (error: unknown) {
    const knownError = error as { message: string };
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: knownError.message,
    });
  }
};
