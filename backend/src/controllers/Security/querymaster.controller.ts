import { Response } from "express";
import { Op } from "sequelize";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import { QuerySchema } from "../../validation/Security/Security.validation";
import dynamicQuery from "../../models/Security/DynamicQuery_security.model";

export const createquerymaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = QuerySchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const {
      COMPANY_CODE,
      PARAMETER,
      SQL_STRING,
      STRING1,
      STRING2,
      STRING3,
      STRING4,
      ORDER_BY,
      USTRING1,
      USTRING2,
      USTRING3,
      USTRING4,
      USTRING5,
      USTRING6,
    } = req.body;

    const querymasterData = await dynamicQuery.findOne({
      where: {
        [Op.and]: [
          { SQL_STRING: SQL_STRING },
        ],
      },
    });

    if (querymasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.QUERYMASTER.RECORD_ALREADY_EXISTS,
      });
      return;
    }
    const createquerymaster = await dynamicQuery.create({
      COMPANY_CODE,
      PARAMETER,
      SQL_STRING,
      STRING1,
      STRING2,
      STRING3,
      STRING4,
      ORDER_BY,
      USTRING1,
      USTRING2,
      USTRING3,
      USTRING4,
      USTRING5,
      USTRING6,
      created_by: requestUser.loginid,
      updated_by: requestUser.loginid,
    });
    if (!createquerymaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while Industry Sector" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.QUERYMASTER.RECORD_CREATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const updatequerymaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = QuerySchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { SR_NO , COMPANY_CODE , SQL_STRING } = req.body;

    //Check for duplicate records
    const queryDataExists = await dynamicQuery.findOne({
      where: { 
        SQL_STRING,
        SR_NO: {[Op.ne]: SR_NO},
      },
    });

    if (queryDataExists) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: " Query already exists.",
      });
      return;
    }

    const querymasterData = await dynamicQuery.findOne({
      where: {
        [Op.and]: [{ SR_NO: SR_NO }],
      },
    });

    if (!querymasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.QUERYMASTER.RECORD_DOES_NOT_EXISTS,
      });
      return;
    }

     let updateData = { ...req.body, updated_by: requestUser.loginid };
    const createquerymaster = await dynamicQuery.update(updateData,{
        where: { SR_NO }
      }
    );

    if (!createquerymaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating query" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.QUERYMASTER.RECORD_UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
