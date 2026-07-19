import { SecLogin } from "../../database/relationships";
import { MsRole } from "../../database/relationships";
import { MsPsUserRoleMapping } from "../../database/relationships";
import { sequelize } from "../../database/connection"; // Import sequelize instance

import { response, Response } from "express";
import { ISearch, RequestWithUser } from "../../interfaces/common.interface";
import constants from "../../helpers/constants";
import { MsPsUserRoleMappingSchema } from "../../validation/Security/Security.validation";
// import MsPsUserRoleMapping from "../../models/Security/userrolemapping_roleaccess";
// import MsRole from "../../models/Security/role_roleaccess.model";

export const createrollaccess = async (req: RequestWithUser, res: Response) => {
  try {
    const { error } = MsPsUserRoleMappingSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }

    const { user_id, user_role, company_code } = req.body;

    const response = await MsPsUserRoleMapping.create({
      user_id,
      user_role,
      company_code,
      user_Code: user_id,
      user_name: user_id,
      user_dt: new Date(), // Assigning system date
    });
    if (!response) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: response });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Role has been successfully assigned.",
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const getUserAssignedRoll = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const user_id_raw = Array.isArray(req.params.user_id)
      ? req.params.user_id[0]
      : req.params.user_id;
    const user_id = user_id_raw ? String(user_id_raw) : undefined;
    const userWithroles = await SecLogin.findByPk(user_id, {
      include: [
        {
          model: MsRole,
          as: "assignedroles",
        },
      ],
    });

    if (!userWithroles) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const simplifiedData = userWithroles?.assignedroles.map((role) => ({
      user_role: role.user_role,
      role_name: role.role_name,
      user_id: userWithroles.user_id,
    }));

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
export const deleterollaccess = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  const transaction = await sequelize.transaction();
  try {
    const { screen_details } = req.body;

    if (screen_details.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one user Code and user role to delete",
      });
    }

    await Promise.all(
      screen_details.map(
        async (screen_details: { user_id: string; user_role: string }) => {
          const { user_id, user_role } = screen_details;

          return await MsPsUserRoleMapping.destroy({
            where: {
              user_id,
              user_role,
            },
            transaction,
          });
        }
      )
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Roll access was successfully revoked.",
    });
  } catch (error: any) {
    await transaction.rollback();
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
