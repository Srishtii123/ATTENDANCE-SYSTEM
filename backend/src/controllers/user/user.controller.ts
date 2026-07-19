import { Response } from "express";
import constants from "../../helpers/constants";
import { RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import User from "../../models/user";
import { userSchema } from "../../validation/user/user.validation";

/**
 * Updates the language preference of a user.
 *
 * @param {RequestWithUser} req - The request object containing the user's information.
 * @param {Response} res - The response object to send the result back to the client.
 */
export const updateLanguagePreference = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    // Get the user's information from the request object
    const requestUser: IUser = req.user;

    // Extract the language preference from the request body
    const { lang_pref } = req.body;

    // Validate the request body using the user schema
    const { error } = userSchema(req.body);
    if (error) {
      // If validation fails, throw an error with the validation message
      throw new Error(error.message);
    }

    // Find the user in the database using their login ID
    const user = await User.findOne({
      where: {
        loginid: requestUser.loginid,
      },
    });

    // If the user is not found, throw an error
    if (!user) {
      throw new Error(constants.MESSAGES.USER.REQUEST_USER_NOT_FOUND);
    }

    // Update the user's language preference in the database
    const editLang = await User.update(
      {
        lang_pref,
        updated_by: requestUser.loginid,
      },
      {
        where: {
          loginid: requestUser.loginid,
        },
      }
    );

    // If the update fails, throw an error
    if (!editLang) {
      throw new Error(editLang);
    }

    // Send a successful response back to the client
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.USER.LANG_PREF_UPDATED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    // If an error occurs, send a failed response back to the client
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};
