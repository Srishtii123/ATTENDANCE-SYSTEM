import { Response } from "express";
import { Op } from "sequelize";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import { companySchema } from "../../validation/Security/Security.validation";
import company from "../../models/Security/company_security.model";

export const createcompanymaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = companySchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const {
      company_code,
      company_name,
      address1,
      address2,
      address3,
      city,
      country,
    } = req.body;

    const companymasterData = await company.findOne({
      where: {
        [Op.and]: [
          { company_code: company_code },
          { company_name: company_name },
          { address1: address1 },
          { address2: address2 },
          { address3: address3 },
          { city: city },
          { country: country },
        ],
      },
    });

    if (companymasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.COMPANY_SEC.COMPANY_ALREADY_EXISTS,
      });
      return;
    }
    const createcompanymaster = await company.create({
      company_code,
      company_name,
      address1,
      address2,
      address3,
      city,
      country,
      created_by: requestUser.loginid,
      updated_by: requestUser.loginid,
    });
    if (!createcompanymaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while Industry Sector" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.COMPANY_SEC.COMPANY_CREATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const updatecompanyemaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = companySchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { company_code } = req.body;

    const companymasterData = await company.findOne({
      where: {
        [Op.and]: [{ company_code: company_code }],
      },
    });

    if (!companymasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.COMPANY_SEC.COMPANY_DOES_NOT_EXISTS,
      });
      return;
    }
    const createcompanymaster = await company.update(
      {
        company_code,
        created_by: requestUser.loginid,
        updated_by: requestUser.loginid,

        ...req.body,
      },
      {
        where: {
          [Op.and]: [{ company_code: company_code }],
        },
      }
    );
    if (!createcompanymaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating company" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.COMPANY_SEC.COMPANY_UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
