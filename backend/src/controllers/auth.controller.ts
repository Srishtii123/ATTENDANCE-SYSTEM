import { Request, Response } from "express";
import { Op, QueryTypes } from "sequelize";
import bcrypt from "bcrypt";
import constants from "../helpers/constants";
import {
  buildTree,
  comparePassword,
  formatRolePermissions,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  ttlToMs,
  notifyUser,
} from "../helpers/functions";
import { loginSchema } from "../validation/auth.validation";
import { sequelize } from "../database/connection";
import User from "../models/user";
import { permissionsListQuery, userPermissionQuery } from "../utils/query";
import { StructuredResult } from "../interfaces/auth.interface";
import { RequestWithUser } from "../interfaces/common.interface";
import Company from "../models/wms/company_wms";
import axios from "axios";
import { VendorService } from "../services/vendor.service";
export const login = async (req: Request, res: Response) => {
  try {
    // Step 1: Validate request body
    const { error } = loginSchema(req.body);
    if (error) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,

        message: error.message,
      });

      return;
    }

    // Step 2: Extract email and password
    const { email, password } = req.body;

    // Step 3: Check if user exists in SEC_LOGIN
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email_id: email }, { loginid: email }],
        active_flag: "Y",
      },
    });

    // Step 4: If user not found, validate with .NET API
    if (!user) {
      try {
        const apiResponse = await VendorService.checkAccountEmployee(email);

        // Ensure the response is an array and contains at least one user
        if (Array.isArray(apiResponse) && apiResponse.length > 0) {
          const apiUser = apiResponse[0]; // Take the first user from the array
          console.log("API User Data:", apiUser);

          const isExternalPassValid = password === apiUser.PASSWORD;

          if (!isExternalPassValid) {
            res.status(constants.STATUS_CODES.BAD_REQUEST).json({
              success: false,
              message: constants.MESSAGES.USER.INVALID_PASSWORD,
            });
            return;
          }

          // Determine application type and role id
          const appType =
            typeof apiUser.TYPE === "string" &&
            apiUser.TYPE.toUpperCase() === "EMPLOYEE"
              ? "EMPLOYEE"
              : "VENDOR";

          let syntheticEmail = `${apiUser.USER_ID.toLowerCase()}@gmail.com`; // Default synthetic email
          if (
            typeof apiUser.EMAIL === "string" &&
            apiUser.EMAIL.includes("@")
          ) {
            syntheticEmail = apiUser.EMAIL;
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const insertUserQuery = `
            INSERT INTO SEC_LOGIN (
              company_code, email_id, loginid, username, userpass, active_flag, user_code, user_id, APPLICATION,
              created_at, created_by
            ) VALUES (
              'JASRA', :email_id, :loginid, :username, :userpass, 'Y', :loginid, :loginid, :application, NOW(), 'system'
            )
          `;
          await sequelize.query(insertUserQuery, {
            replacements: {
              email_id: syntheticEmail,
              loginid: apiUser.USER_ID,
              username: apiUser.NAME,
              userpass: hashedPassword,
              application: appType,
            },
            type: QueryTypes.INSERT,
          });

          user = await User.findOne({
            where: {
              loginid: apiUser.USER_ID,
              active_flag: "Y",
            },
          });
        } else {
          res.status(constants.STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: "User not found in external system",
          });
          return;
        }
      } catch (apiError: any) {
        if (apiError.response?.status === 401) {
          res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
            success: false,
            message:
              "Unauthorized access to external system. Please check API credentials.",
          });
        } else {
          res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error validating user with external system",
            error: apiError.message,
          });
        }
        return;
      }
    }

    if (!user) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    const { userpass, SEC_PASSWD } = user.dataValues;

    const isUserPassMatched = await comparePassword({
      password,
      hashedPassword: userpass,
    });

    const isSecPassMatched = SEC_PASSWD
      ? await comparePassword({
          password,
          hashedPassword: SEC_PASSWD,
        })
      : false;

    if (!isUserPassMatched && !isSecPassMatched) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: constants.MESSAGES.USER.INVALID_PASSWORD,
      });
      return;
    }

        const tokenPayload = {
      username: user.dataValues.username,
      email_id: user.dataValues.email_id,
      loginid: user.dataValues.loginid,
    };
    const token = await generateToken(tokenPayload);

    const refreshToken = await generateRefreshToken(tokenPayload);
    const maxAge = ttlToMs(process.env.REFRESH_TOKEN_TTL || "365d");
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge,
    });

    res.status(constants.STATUS_CODES.OK).json({

    // const token = await generateToken({
    //   username: user.dataValues.username,
    //   email_id: user.dataValues.email_id,
    //   loginid: user.dataValues.loginid,
    // });

    // res.status(constants.STATUS_CODES.OK).json({

      success: true,
      data: { token },
    });
    return;
  } catch (err: any) {
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred",
      error: err.message || err,
    });
    return;
  }
};

export const me = async (req: RequestWithUser, res: Response) => {
  try {
    // Retrieve the current user from the request
    const requestUser = req.user;

    // If the user is not found, return a 401 response
    if (!requestUser) {
      res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: constants.MESSAGES.USER.USER_NOT_FOUND,
      });
      return;
    }

    // Retrieve the user's information from the database
    const user = await User.findOne({
      where: { email_id: requestUser.email_id },
      attributes: { exclude: ["userpass"] },
      include: [{ model: Company,
        attributes: ["company_logo"],
        required: false,
         }],
    });

    // If the user is not found, return a 404 response
    if (!user) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.USER.USER_NOT_FOUND,
      });
      return;
    }

    //----------------------list of all permission that  a application will have--------output:wms:{serial_no:1,app_code:"WMS",childer:{}}
    const allPermissions: {
      menu: string;
      serial_no: string;
      app_code: string;
    }[] = await sequelize.query(permissionsListQuery, {
      type: QueryTypes.SELECT,
    });

    const permissions: StructuredResult =
      allPermissions.reduce((acc, curr) => {
        const { menu, serial_no, app_code } = curr;

        const serialNumber = Number(serial_no);

        if (serialNumber > 0) {
          if (!acc[app_code]) {
            acc[app_code] = {
              serial_number: serialNumber ?? 0,
              app_code: app_code,
              children: {},
            };
          }

          if (menu !== app_code) {
            acc[app_code].children[menu] = {
              serial_number: serialNumber ?? 0,
              app_code,
            };
          }
        }

        return acc;
      }, {} as StructuredResult) ?? {};

    //-----------list of all permissions that user have------output:[1,42,3,4,66]
    const userPermissions = await sequelize.query(userPermissionQuery, {
      type: QueryTypes.SELECT,
      replacements: { loginid: user.dataValues.loginid },
    });

    // Format the user's permissions into a structured view
    const formattedPermissions = formatRolePermissions(userPermissions);

    // Build the permission-based menu tree
    //--------------tree view -----------------
    let permissionBasedMenuTree = {};
    if (formattedPermissions) {
      const menuTreeQuery = `SELECT * FROM SEC_MODULE_DATA
      WHERE SERIAL_NO IN (${Object.keys(formattedPermissions)
        ?.map((sn) => `'${sn}'`)
        .join(",")})`;

      const menuTreeData = await sequelize.query<any>(menuTreeQuery, {
        type: QueryTypes.SELECT,
      });
      if (menuTreeData)
        permissionBasedMenuTree = buildTree(menuTreeData, permissions);
    }

    // Return the user's information, permissions, and menu tree in the response
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: {
      user,
      permissionBasedMenuTree,
      permissions,
      user_permission: formattedPermissions,
      },
    });
    console.log("data", {
      user,
      permissionBasedMenuTree,
      permissions,
      user_permission: formattedPermissions,
    });
    return;
  } catch (error: any) {
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
    return;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    // Check if user exists
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email_id: email },
          { loginid: email },
          { contact_email: email },
        ],
        active_flag: "Y",
      },
    });

    if (!user) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Send password reset email
    await notifyUser({
      event: constants.EVENTS.FORGOT_PASSWORD,
      request_users: user.dataValues.email_id,
      subject: "Password Reset Instructions",
      htmlMessage: `
        <p>Dear User,</p>
        <p>Please click on the following link to reset your password:</p>
        <p><a href="${process.env.FRONTEND_URL}/reset-password?email=${user.dataValues.email_id}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,</p>
      `,
    });

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Password reset instructions have been sent to your email",
    });
    return;
  } catch (error: any) {
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred",
    });
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email_id: email }, { loginid: email }],
        active_flag: "Y",
      },
    });

    if (!user) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await user.update({ userpass: hashedPassword });

    // Send confirmation email
    await notifyUser({
      event: constants.EVENTS.RESET_PASSWORD,
      request_users: user.dataValues.email_id,
      subject: "Password Reset Successful",
      htmlMessage: `
        <p>Dear User,</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <p>Best regards,</p>
        <p>Bayanat Technology</p>
      `,
    });

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Password has been reset successfully",
    });
    return;
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred",
    });
    return;
  }
};

const parseCookies = (header?: string) => {
  const list: Record<string, string> = {};
  if (!header) return list;
  header.split(";").forEach((c) => {
    const parts = c.split("=");
    const key = parts.shift()?.trim();
    if (key) list[key] = decodeURIComponent(parts.join("="));
  });
  return list;
};

const cookieOpts: any = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = parseCookies(req.headers.cookie)["refresh_token"];
    if (!refreshToken) {
      res.status(401).json({ success: false, message: "Refresh token missing" });
      return;
    }

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
      return;
    }

    const data = {
      username: payload.username,
      email_id: payload.email_id,
      loginid: payload.loginid,
    };
    const token = await generateToken(data);
    const newRefresh = await generateRefreshToken(data);
    res.cookie("refresh_token", newRefresh, {
      ...cookieOpts,
      maxAge: ttlToMs(process.env.REFRESH_TOKEN_TTL || "365d"),
    });

    res.status(200).json({ success: true, data: { token } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("refresh_token", cookieOpts);
  res.status(200).json({ success: true, message: "Logged out" });
};