import { Response } from "express";
import { Op } from "sequelize";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import rolemaster from "../../models/Security/rolemaster_security.model";
import { rolemasterSchema } from "../../validation/Security/Security.validation";

export const createrolemaster = async (req: RequestWithUser, res: Response) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = rolemasterSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { role_id, role_desc, remarks, company_code } = req.body;

    const rolemasterData = await rolemaster.findOne({
      where: {
        [Op.and]: [{ company_code: company_code }, { role_desc: role_desc }],
      },
    });

    if (rolemasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.ROLEMASTER_WMS.ROLEMASTER_ALREADY_EXISTS,
      });
      return;
    }
    const createrolemaster = await rolemaster.create({
      role_desc,
      remarks,
      company_code,
      created_by: requestUser.loginid,
      updated_by: requestUser.loginid,
    });
    if (!createrolemaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while Industry Sector" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message:
        constants.MESSAGES.ROLEMASTER_WMS.ROLEMASTER_CREATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const updaterolemaster = async (req: RequestWithUser, res: Response) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = rolemasterSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { role_id, company_code } = req.body;

    const rolemasterData = await rolemaster.findOne({
      where: {
        [Op.and]: [{ company_code: company_code }, { role_id: role_id }],
      },
    });

    if (!rolemasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.ROLEMASTER_WMS.ROLEMASTER_DOES_NOT_EXISTS,
      });
      return;
    }
    const createrolemaster = await rolemaster.update(
      {
        company_code,
        created_by: requestUser.loginid,
        updated_by: requestUser.loginid,

        ...req.body,
      },
      {
        where: {
          [Op.and]: [{ company_code: company_code }, { role_id: role_id }],
        },
      }
    );
    if (!createrolemaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating company" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message:
        constants.MESSAGES.ROLEMASTER_WMS.ROLEMASTER_UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const deleterolemaster = async (req: RequestWithUser, res: Response) => {
  try {
    const rolemastercode = req.body;

    if (!req.body.length) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message:
          constants.MESSAGES.ROLEMASTER_WMS.SELECT_AT_LEAST_ONE_ROLEMASTER,
      });
      return;
    }
    const RolemasterDeleteResponse = await rolemaster.destroy({
      where: {
        role_id: rolemastercode,
      },
    });
    if (RolemasterDeleteResponse === 0) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: RolemasterDeleteResponse,
      });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message:
        constants.MESSAGES.ROLEMASTER_WMS.ROLEMASTER_DELETED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
