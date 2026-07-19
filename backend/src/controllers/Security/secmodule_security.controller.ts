import { Response } from "express";
import { Op } from "sequelize";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import secmodule from "../../models/Security/secmodule_security.model";
import { secmoduleSchema } from "../../validation/Security/Security.validation";

export const createsecmodulemaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = secmoduleSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const {
      company_code,
      app_code,
      level1,
      level2,
      level3,
      position,
      url_path,
      icon,
    } = req.body;

    const secmodulemasterData = await secmodule.findOne({
      where: {
        [Op.and]: [
          { company_code: company_code },
          { app_code: app_code },
          { level1: level1 },
          { level2: level2 },
          { level3: level3 },
          { url_path: url_path },
          { icon: icon},
        ],
      },
    });

    if (secmodulemasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.SECMODULE_SEC.SECMODULE_ALREADY_EXISTS,
      });
      return;
    }
    const createsecmoduelmaster = await secmodule.create({
      company_code,
      app_code,
      level1,
      level2,
      level3,
      position,
      url_path,
      icon,
      created_by: requestUser.loginid,
      updated_by: requestUser.loginid,
    });
    if (!createsecmoduelmaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while Industry Sector" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.SECMODULE_SEC.SECMODULE_CREATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const updatesecmodulemaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = secmoduleSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { serial_no, company_code } = req.body;

    const secmodulemasterData = await secmodule.findOne({
      where: {
        [Op.and]: [{ company_code: company_code }, { serial_no: serial_no }],
      },
    });

    if (!secmodulemasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.SECMODULE_SEC.SECMODULE_DOES_NOT_EXISTS,
      });
      return;
    }
    const createsecmodulemaster = await secmodule.update(
      {
        company_code,
        created_by: requestUser.loginid,
        updated_by: requestUser.loginid,

        ...req.body,
      },
      {
        where: {
          [Op.and]: [{ company_code: company_code }, { serial_no: serial_no }],
        },
      }
    );
    if (!createsecmodulemaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating company" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.SECMODULE_SEC.SECMODULE_UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
