import SecLoginModelUSERDIVISION from "../../models/Security/seclogin_usertodivision.model";
import MSHRDIVISIONMasterModel from "../../models/Security/UsertoDivision_security.model";
import MSCOMPANYUSERASSIGNEDModel from "../../models/Security/DivisionUserassign_security.model";
import { sequelize } from "../../database/connection";

import { response, Response } from "express";
import { ISearch, RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import constants from "../../helpers/constants";
import { MSPsDivisionMasterschema } from "../../validation/Security/Security.validation";

export const createusertodivisionaccess = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const { error } = MSPsDivisionMasterschema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { user_id, div_code } = req.body;

    const response = await MSCOMPANYUSERASSIGNEDModel.create({
      user_id,
      div_code,
      divn_code: div_code,
    });
    if (!response) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: response });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Company successfully assigned to the user.",
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const getUserAssigneddivision = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const user_id_raw = Array.isArray(req.params.user_id)
      ? req.params.user_id[0]
      : req.params.user_id;
    const user_id = user_id_raw ? String(user_id_raw) : undefined;
    const userWithdivision = await SecLoginModelUSERDIVISION.findByPk(user_id, {
      include: [
        {
          model: MSHRDIVISIONMasterModel,
          as: "assigneddivisions",
        },
      ],
    });

    if (!userWithdivision) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const simplifiedData = userWithdivision?.assigneddivisions.map(
      (division) => ({
        div_code: division.div_code,
        div_name: division.div_name,
        user_id: userWithdivision.user_id,
      })
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: simplifiedData,
    });
    return;
  } catch (error: unknown) {
    const knownError = error as { message: string };
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: knownError.message,
    });
  }
};

//----------delete screen access----------------
export const deletedivisonaccess = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  const transaction = await sequelize.transaction(); // Use sequelize instance
  try {
    const { screen_details } = req.body;

    if (screen_details.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one user id and div code to delete",
      });
    }

    await Promise.all(
      screen_details.map(
        async (screen_details: { user_id: string; div_code: string }) => {
          const { user_id, div_code } = screen_details;

          return await MSCOMPANYUSERASSIGNEDModel.destroy({
            where: {
              user_id,
              div_code,
            },
            transaction,
          });
        }
      )
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "division access was successfully revoked.",
    });
  } catch (error: any) {
    await transaction.rollback();
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
