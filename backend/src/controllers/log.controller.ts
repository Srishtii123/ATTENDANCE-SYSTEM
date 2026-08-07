import { Response } from "express";
import constants from "../helpers/constants";
import { RequestWithUser } from "../interfaces/common.interface";
import { IUser } from "../interfaces/user.interface";
import Log from "../models/log.model";

/**
 * Retrieves logs for the current user.
 * 
 * @param {RequestWithUser} req - The incoming request with user data.
 * @param {Response} res - The outgoing response.
 */
export const getLogs = async (req: RequestWithUser, res: Response) => {
  try {
    // Get the current user from the request.
    const requestUser: IUser = req.user;

    // Initialize variables to store fetched data and total count.
    let fetchedData: unknown[] = [],
      totalCount;

    // Count the total number of logs for the current user.
    totalCount = await Log.count({
      where: {
        company_code: requestUser.company_code,
        loginid: requestUser.loginid,
      },
    });

    // Fetch all logs for the current user, ordered by updated_at in descending order.
    fetchedData = await Log.findAll({
      where: {
        company_code: requestUser.company_code,
        loginid: requestUser.loginid,
      },
      order: [["updated_at", "DESC"]],
    });

    // If no data is found, return a 404 response.
    if (!fetchedData) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.NOT_FOUND,
      });
    }

    // Return the fetched data and total count in a 200 response.
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: { tableData: fetchedData, count: totalCount },
    });
    return;
  } catch (error: any) {
    // If an error occurs, return a 400 response with the error message.
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

/**
 * Retrieves the count of unread logs for the current user.
 * 
 * @param {RequestWithUser} req - The incoming request with user data.
 * @param {Response} res - The outgoing response.
 */
export const getUnReadLogsCount = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    // Get the current user from the request.
    const requestUser: IUser = req.user;

    // Count the number of unread logs for the current user.
    let count = await Log.count({
      where: {
        company_code: requestUser.company_code,
        loginid: requestUser.loginid,
        read_flag: "N",
      },
    });

    // Return the count in a 200 response.
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: { count },
    });
    return;
  } catch (error: any) {
    // If an error occurs, return a 400 response with the error message.
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

/**
 * Updates the read status of logs for the current user.
 * 
 * @param {RequestWithUser} req - The incoming request with user data.
 * @param {Response} res - The outgoing response.
 */
export const updateReadLog = async (req: RequestWithUser, res: Response) => {
  try {
    // Get the current user from the request.
    const requestUser: IUser = req.user;

    // Update the read status of logs for the current user.
    const updateReadLog = await Log.update(
      {
        read_flag: "Y",
        updated_by: requestUser.loginid,
      },
      {
        where: {
          company_code: requestUser.company_code,
          loginid: requestUser.loginid,
          read_flag: "N",
        },
      }
    );

    // If no data is updated, return a 404 response.
    if (!updateReadLog) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.NOT_FOUND,
      });
    }

    // Return a success message in a 200 response.
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Logs " + constants.MESSAGES.UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    // If an error occurs, return a 400 response with the error message.
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};