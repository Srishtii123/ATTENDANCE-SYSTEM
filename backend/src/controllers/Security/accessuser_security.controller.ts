import { Op } from "sequelize";
import { sequelize } from "../../database/connection";

import { response, Response } from "express";
import { ISearch, RequestWithUser } from "../../interfaces/common.interface";
import constants from "../../helpers/constants";
import { secrolefunctionaccessuserschema } from "../../validation/Security/Security.validation";
import accessroleappaccess from "../../models/Security/AccesstorollSecroleapp_security.model";
import { IUser } from "../../interfaces/user.interface";
import {
  accesssecmoduledata,
  accesssecoperation,
} from "../../database/relationships";
import accessusersecroleaccess from "../../models/Security/AccesstouserseSecroleFunctionUser.model";

export const getSecRollFunctionAccessUser = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const { loginid, serial_no_or_role_id } = req.query;

    console.log(req.query);

    const ValidappAccess = await accessusersecroleaccess.findOne({
      where: {
        loginid,
        serial_no_or_role_id,
        company_code: req.user.company_code,
      },
    });

    if (!ValidappAccess) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "No access found for the given user and screen.",
      });
      return;
    }

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: ValidappAccess,
    });
    return;
  } catch (error: unknown) {
    const knownError = error as { message: string };
    res
      .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: knownError.message });
  }
};

export const createSecRollFunctionAccessUser = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const { error } = secrolefunctionaccessuserschema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    console.log("console", req.body);

    const {
      loginid,
      serial_no_or_role_id,
      snew,
      smodify,
      sdelete,
      ssave,
      ssearch,
      ssaveas,
      supload,
      sundo,
      sprint,
      sprintsetup,
      shelp,
      company_code,
    } = req.body;

    const response = await accessusersecroleaccess.create({
      loginid,
      serial_no_or_role_id,
      snew,
      smodify,
      sdelete,
      ssave,
      ssearch,
      ssaveas,
      supload,
      sundo,
      sprint,
      sprintsetup,
      shelp,
      company_code,
    });
    if (!response) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: response });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Functionality has been successfully assigned to User.",
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const getOperationalMaster = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const serial_no_raw = Array.isArray(req.params.serial_no)
      ? req.params.serial_no[0]
      : req.params.serial_no;
    const serial_no = serial_no_raw ? Number(serial_no_raw) : undefined;
    const moduleData = await accesssecmoduledata.findByPk(serial_no, {
      include: [
        {
          model: accesssecoperation,
          as: "assignoperation",
        },
      ],
    });

    if (!moduleData) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Module data not found",
      });
      return;
    }

    const simplifiedData = moduleData?.assignoperation.map(
      (operation: any) => ({
        serial_no: operation.serial_no,
        snew: operation.snew,
        smodify: operation.smodify,
        sdelete: operation.sdelete,
        ssave: operation.ssave,
        ssearch: operation.ssearch,
        ssaveas: operation.ssaveas,
        supload: operation.supload,
        sundo: operation.sundo,
        sprint: operation.sprint,
        sprintsetup: operation.sprintsetup,
        shelp: operation.shelp,
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

export const updateSecRoleFunctionAccessUser = async (
  req: RequestWithUser,
  res: Response
) => {
  const transaction = await sequelize.transaction(); // Use sequelize instance
  try {
    const { error } = secrolefunctionaccessuserschema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { loginid, serial_no_or_role_id, company_code } = req.body;

    const accessroleappaccessData = await accessusersecroleaccess.findOne({
      where: {
        [Op.and]: [
          { company_code: company_code },
          { serial_no_or_role_id: serial_no_or_role_id },
          { loginid: loginid },
        ],
      },
      transaction,
    });

    if (!accessroleappaccessData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Functionality of role Successfully Updated",
      });
      return;
    }
    const createaccessuserappaccess = await accessusersecroleaccess.update(
      {
        company_code,
        ...req.body,
      },
      {
        where: {
          [Op.and]: [
            { company_code: company_code },
            { serial_no_or_role_id: serial_no_or_role_id },
            { loginid: loginid },
          ],
        },
        transaction,
      }
    );
    if (!createaccessuserappaccess) {
      await transaction.rollback();
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating company" });
      return;
    }
    await transaction.commit();
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "User Access UPDATED SUCCESSFULLY",
    });
    return;
  } catch (error: any) {
    await transaction.rollback();
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

//----------delete screen access----------------
export const deleteSecRollFunctionAccessUser = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  const transaction = await sequelize.transaction(); // Use sequelize instance
  try {
    const { screen_details } = req.body;

    if (screen_details.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one Serial No and LoginId to delete",
      });
    }

    await Promise.all(
      screen_details.map(
        async (screen_details: {
          serial_no_or_role_id: number;
          loginid: string;
        }) => {
          const { serial_no_or_role_id, loginid } = screen_details;

          return await accessusersecroleaccess.destroy({
            where: {
              serial_no_or_role_id,
              loginid,
            },
            transaction,
          });
        }
      )
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "User access was successfully revoked.",
    });
  } catch (error: any) {
    await transaction.rollback();
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
