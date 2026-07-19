import { Op } from "sequelize";
import { response, Response } from "express";
import { ISearch, RequestWithUser } from "../../interfaces/common.interface";
import { sequelize } from "../../database/connection";
import constants from "../../helpers/constants";
import { SecRoleAppAccessschema } from "../../validation/Security/Security.validation";
import accessroleappaccess from "../../models/Security/AccesstorollSecroleapp_security.model";
import { IUser } from "../../interfaces/user.interface";
import {
  accesssecmoduledata,
  accesssecoperation,
} from "../../database/relationships";
import company from "../../models/Security/company_security.model";

export const getSecRollAppAccess = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const { role_id, serial_no } = req.query;

    console.log(req.query);

    const ValidappAccess = await accessroleappaccess.findOne({
      where: {
        role_id,
        serial_no,
        company_code: req.user.company_code,
      },
    });

    if (!ValidappAccess) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "No access found for the given role and screen.",
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

export const createSecRollAppAccess = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const { error } = SecRoleAppAccessschema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    console.log("console", req.body);

    const {
      role_id,
      serial_no,
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

    const response = await accessroleappaccess.create({
      role_id,
      serial_no,
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
      message: "Functionality has been successfully assigned to Role.",
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

export const updateSecRollAppAccess = async (
  req: RequestWithUser,
  res: Response
) => {
  const transaction = await sequelize.transaction(); // Use sequelize instance
  try {
    const { error } = SecRoleAppAccessschema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { role_id, serial_no, company_code } = req.body;

    const accessroleappaccessData = await accessroleappaccess.findOne({
      where: {
        [Op.and]: [
          { company_code: company_code },
          { serial_no: serial_no },
          { role_id: role_id },
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
    const createaccessroleappaccess = await accessroleappaccess.update(
      {
        company_code,
        ...req.body,
      },
      {
        where: {
          [Op.and]: [
            { company_code: company_code },
            { serial_no: serial_no },
            { role_id: role_id },
          ],
        },
        transaction,
      }
    );
    if (!createaccessroleappaccess) {
      await transaction.rollback();
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating company" });
      return;
    }
    await transaction.commit();
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "ROLES UPDATED SUCCESSFULLY",
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
export const deleteSecRollAppAccess = async (
  req: RequestWithUser,
  res: Response
): Promise<any> => {
  const transaction = await sequelize.transaction(); // Use sequelize instance
  try {
    const { screen_details } = req.body;

    if (screen_details.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one Serial No and Role Id to delete",
      });
    }

    await Promise.all(
      screen_details.map(
        async (screen_details: { serial_no: number; role_id: string }) => {
          const { serial_no, role_id } = screen_details;

          return await accessroleappaccess.destroy({
            where: {
              serial_no,
              role_id,
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
