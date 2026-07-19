import { SecLoginModel } from "../../database/relationships";
import { MSPSProjectMasterModel } from "../../database/relationships";
import { MSProjectUserAssignModel } from "../../database/relationships";
import { sequelize } from "../../database/connection";

import { response, Response } from "express";
import { ISearch, RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import constants from "../../helpers/constants";
import { MSPSProjectMasterschema } from "../../validation/Security/Security.validation";

export const createscreenacess = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const { error } = MSPSProjectMasterschema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { user_id, project_code } = req.body;

    const response = await MSProjectUserAssignModel.create({
      user_id,
      project_code,
    });
    if (!response) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: response });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Project successfully assigned to the user.",
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const getUserAssignedProjects = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const user_id_raw = Array.isArray(req.params.user_id)
      ? req.params.user_id[0]
      : req.params.user_id;
    const user_id = user_id_raw ? String(user_id_raw) : undefined;
    const userWithProjects = await SecLoginModel.findByPk(user_id, {
      include: [
        {
          model: MSPSProjectMasterModel,
          as: "assignedProjects",
        },
      ],
    });

    if (!userWithProjects) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const simplifiedData = userWithProjects?.assignedProjects.map(
      (project) => ({
        project_code: project.project_code,
        project_name: project.project_name,
        user_id: userWithProjects.user_id,
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
export const deleteScreenaccess = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  const transaction = await sequelize.transaction(); // Use sequelize instance
  try {
    const { screen_details } = req.body;

    if (screen_details.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one user id and project code to delete",
      });
    }

    await Promise.all(
      screen_details.map(
        async (screen_details: { user_id: string; project_code: string }) => {
          const { user_id, project_code } = screen_details;

          return await MSProjectUserAssignModel.destroy({
            where: {
              user_id,
              project_code,
            },
            transaction,
          });
        }
      )
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Project access was successfully revoked.",
    });
  } catch (error: any) {
    await transaction.rollback();
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
