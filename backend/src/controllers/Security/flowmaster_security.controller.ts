import { Response } from "express";
import { Op } from "sequelize";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import flowmaster from "../../models/Security/flowmaster_security.model";
import { flowmasterSchema } from "../../validation/Security/Security.validation";

export const createflowmaster = async (req: RequestWithUser, res: Response) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = flowmasterSchema(req.body);
    console.log("inside create");
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { flow_code, flow_description, company_code } = req.body;

    const flowmasterData = await flowmaster.findOne({
      where: {
        [Op.and]: [
          { company_code: company_code },
          { flow_description: flow_description },
        ],
      },
    });

    if (flowmasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.FLOWMASTER_PF.FLOWMASTER_ALREADY_EXISTS,
      });
      return;
    }
    const createflowmaster = await flowmaster.create({
      flow_description,
      company_code,
      created_by: requestUser.loginid,
      updated_by: requestUser.loginid,
    });
    if (!createflowmaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while Industry Sector" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.FLOWMASTER_PF.FLOWMASTER_CREATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const updateflowmaster = async (req: RequestWithUser, res: Response) => {
  try {
    const requestUser: IUser = req.user;

    const { error } = flowmasterSchema(req.body);
    if (error) {
      res
        .status(constants.STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: error.message });
      return;
    }
    const { flow_code, flow_description, company_code } = req.body;

    const flowmasterData = await flowmaster.findOne({
      where: {
        [Op.and]: [{ company_code: company_code }, { flow_code: flow_code }],
      },
    });

    if (!flowmasterData) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.FLOWMASTER_PF.FLOWMASTER_DOES_NOT_EXISTS,
      });
      return;
    }
    const createflowmaster = await flowmaster.update(
      {
        company_code,
        created_by: requestUser.loginid,
        updated_by: requestUser.loginid,

        ...req.body,
      },
      {
        where: {
          [Op.and]: [{ company_code: company_code }, { flow_code: flow_code }],
        },
      }
    );
    if (!createflowmaster) {
      res
        .status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Error while updating company" });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.FLOWMASTER_PF.FLOWMASTER_UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
export const deleteflowmaster = async (req: RequestWithUser, res: Response) => {
  try {
    const flowmastercode = req.body;

    if (!req.body.length) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message:
          constants.MESSAGES.FLOWMASTER_PF.SELECT_AT_LEAST_ONE_FLOWMASTER,
      });
      return;
    }
    const FlowmasterDeleteResponse = await flowmaster.destroy({
      where: {
        flow_code: flowmastercode,
      },
    });
    if (FlowmasterDeleteResponse === 0) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: FlowmasterDeleteResponse,
      });
      return;
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.FLOWMASTER_PF.FLOWMASTER_DELETED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
