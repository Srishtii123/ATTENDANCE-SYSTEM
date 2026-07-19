import { Response } from "express";
import { Op } from "sequelize";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import bcrypt from "bcrypt";
import secmaster from "../../models/Security/seclogin_security.model";
import { secmasterSchema } from "../../validation/Security/Security.validation";

export const createsecmaster = async (req: RequestWithUser, res: Response) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = secmasterSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const {
      username,
      contact_no,
      email_id,
      userpass,
      company_code,
      active_flag,
    } = req.body;

    const emailExists = await secmaster.findOne({
      where: { email_id, company_code },
    });

    console.log("emailExists", emailExists);
    if (emailExists) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Email already exists.",
      });
      return;
    }

    const secmasterData = await secmaster.findOne({
      where: {
        [Op.and]: [
          { company_code: company_code },
          { contact_no: contact_no },
          { email_id: email_id },
          { username: username },
        ],
      },
    });

    if (secmasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.SECMASTER_WMS.SECMASTER_ALREADY_EXISTS,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(userpass, 12);

    const createrolemaster = await secmaster.create({
      company_code,
      contact_no,
      email_id,
      username,
      userpass: hashedPassword,
      loginid: username,
      user_id: username,
      user_code: username,
      active_flag,
      created_by: requestUser.loginid,
      updated_by: requestUser.loginid,
    });
    if (!createrolemaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while creating use" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.SECMASTER_WMS.SECMASTER_CREATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const updatesecmaster = async (req: RequestWithUser, res: Response) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = secmasterSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { id, company_code, userpass, email_id } = req.body;

    // Check for duplicate email (excluding the current record)
    const emailExists = await secmaster.findOne({
      where: {
        email_id,
        company_code,
        id: { [Op.ne]: id }, // Exclude the current record
      },
    });
    if (emailExists) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Email already exists.",
      });
      return;
    }

    const secmasterData = await secmaster.findOne({
      where: {
        [Op.and]: [{ company_code: company_code }, { id: id }],
      },
    });

    if (!secmasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.SECMASTER_WMS.SECMASTER_DOES_NOT_EXISTS,
      });
      return;
    }

    //Hash the password if a new password is provided
    let updateData = { ...req.body, updated_by: requestUser.loginid };
    if (userpass) {
      updateData.userpass = await bcrypt.hash(userpass, 12);
    }

    const updateSecmaster = await secmaster.update(updateData, {
      where: { [Op.and]: [{ company_code: company_code }, { id: id }] },
    });

    if (!updateSecmaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating user" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.SECMASTER_WMS.SECMASTER_UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const deletesecmaster = async (req: RequestWithUser, res: Response) => {
  try {
    const rolemastercode = req.body;

    if (!req.body.length) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.SECMASTER_WMS.SELECT_AT_LEAST_ONE_SECMASTER,
      });
      return;
    }
    const RolemasterDeleteResponse = await secmaster.destroy({
      where: {
        id: rolemastercode,
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
      message: constants.MESSAGES.SECMASTER_WMS.SECMASTER_DELETED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
