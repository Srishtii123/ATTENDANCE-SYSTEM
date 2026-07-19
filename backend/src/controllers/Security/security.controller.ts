import { Response } from "express";
import { ISearch, RequestWithUser } from "../../interfaces/common.interface";
import { IUser } from "../../interfaces/user.interface";
import { sequelize } from "../../database/connection";
import constants from "../../helpers/constants";
// Importing models for WMS master data
import { Op } from "sequelize";
import { getSearchFilterQuery } from "../../helpers/functions";
import Rolemaster from "../../models/Security/rolemaster_security.model";
import Flowmaster from "../../models/Security/flowmaster_security.model";
import secmaster from "../../models/Security/seclogin_security.model";
import secmodule from "../../models/Security/secmodule_security.model";
import { log } from "console";
import rolemaster from "../../models/Security/rolemaster_security.model";
import company from "../../models/Security/company_security.model";
import SecLoginModel from "../../models/Security/seclogin_screenacess.model";
import MSPSProjectMasterModel from "../../models/Security/projectmaster_security.model";
//import MSProjectUserAssignModel from "../../models/Security/projectuserassign_security.model";
import { MSPSProjectMaster } from "../../interfaces/Security/Screenacess.interface";
import MsPsUserRoleMapping from "../../models/Security/userrolemapping_roleaccess";
import MsRole from "../../models/Security/role_roleaccess.model";
import { IMsPsRole } from "../../interfaces/Security/Userrollacess.interface";
import { ISecmodule } from "../../interfaces/Security/Security.interfae";
import SecLogin from "../../models/Security/seclogin_roleaccess.model";
import secrolemaster from "../../models/Security/AccesstorollSecroll_security.model";
import {
  IACCESSSECMODULEDATA,
  ISECROLEMASTER,
} from "../../interfaces/Security/Accesstoroll.interface";
import accesssecmoduledata from "../../models/Security/AccesstorollSecmodule_security.model";
import accessusersecmaster from "../../models/Security/AccesstouserSecLogin.model";
import { IUSERSECLOGIN } from "../../interfaces/Security/Accesstouser.interface";
import { IMSHRDIVISION } from "../../interfaces/Security/Userdivisionacess.interface";
import IMSHRDIVISIONMasterModel from "../../models/Security/UsertoDivision_security.model";
import SecLoginModelUSERDIVISION from "../../models/Security/seclogin_usertodivision.model";
import { ISecLogin } from "../../interfaces/Security/Userdivisionacess.interface";
import { SecLoginscreenaccess } from "../../interfaces/Security/Screenacess.interface";
import { ISecLoginroleaccess } from "../../interfaces/Security/Userrollacess.interface";
import reportmaster from "../../models/Security/ReportModule_security.model";
import { IReportmaster } from "../../interfaces/Security/Security.interfae";
import { IQuerymaster } from "../../interfaces/Security/Security.interfae";
import dynamicQuery from "../../models/Security/DynamicQuery_security.model";
// Retrieves master data (country, department, territory, etc.) with optional pagination based on the `master` type.
export const getSecMaster = async (req: RequestWithUser, res: Response) => {
  try {
    const { master } = req.params;
    const requestUser: IUser = req.user;
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 20;
    const skip = Number(page * limit - limit);

    let fetchedData: unknown[] = [];
    let totalCount = 0;
    const paginationOptions = limit ? { offset: skip, limit: limit } : {};
    const filter: ISearch = req.query.filter
      ? JSON.parse(req.query.filter)
      : {};
    console.log("inside in get master", master);
    switch (master) {
      case "company_master":
        {
          let insideQuery: any = [],
            outsideQuery = {
              [Op.and]: [{ company_code: requestUser.company_code }],
            };
          outsideQuery = getSearchFilterQuery({
            insideQuery,
            filter: filter.search,
            outsideQuery,
          });
          totalCount = await Flowmaster.count({ where: outsideQuery });
          fetchedData = await Flowmaster.findAll({
            where: outsideQuery,
            ...(!!filter?.sort &&
              Object.keys(filter?.sort).length > 0 && {
                order: [
                  [filter?.sort.field_name, filter.sort.desc ? "DESC" : "ASC"],
                ],
              }),
            ...paginationOptions,
          });
        }
        break;
      case "role_master":
        {
          let insideQuery: any = [],
            outsideQuery = {
              [Op.and]: [{ company_code: requestUser.company_code }],
            };
          outsideQuery = getSearchFilterQuery({
            insideQuery,
            filter: filter.search,
            outsideQuery,
          });
          totalCount = await Rolemaster.count({ where: outsideQuery });
          fetchedData = await Rolemaster.findAll({
            where: outsideQuery,
            ...(!!filter?.sort &&
              Object.keys(filter?.sort).length > 0 && {
                order: [
                  [filter?.sort.field_name, filter.sort.desc ? "DESC" : "ASC"],
                ],
              }),
            ...paginationOptions,
          });
        }
        break;
      case "sec_login":
        {
          let insideQuery: any = [],
            outsideQuery = {
              [Op.and]: [{ company_code: requestUser.company_code }],
            };
          outsideQuery = getSearchFilterQuery({
            insideQuery,
            filter: filter.search,
            outsideQuery,
          });
          totalCount = await secmaster.count({ where: outsideQuery });
          fetchedData = await secmaster.findAll({
            where: outsideQuery,
            ...(!!filter?.sort &&
              Object.keys(filter?.sort).length > 0 && {
                order: [
                  [filter?.sort.field_name, filter.sort.desc ? "DESC" : "ASC"],
                ],
              }),
            ...paginationOptions,
          });
        }
        break;
      case "sec_module_data":
        {
          let insideQuery: any = [],
            outsideQuery = {
              [Op.and]: [{ company_code: requestUser.company_code }],
            };
          outsideQuery = getSearchFilterQuery({
            insideQuery,
            filter: filter.search,
            outsideQuery,
          });
          totalCount = await secmodule.count({ where: outsideQuery });
          fetchedData = await secmodule.findAll({
            where: outsideQuery,
            ...(!!filter?.sort &&
              Object.keys(filter?.sort).length > 0 && {
                order: [
                  [filter?.sort.field_name, filter.sort.desc ? "DESC" : "ASC"],
                ],
              }),
            ...paginationOptions,
          });
        }
        break;
      // case "seccompany":
      //   {
      //     let insideQuery: any = [],
      //       outsideQuery = {
      //         [Op.and]: [{ company_code: requestUser.company_code }],
      //       };
      //     outsideQuery = getSearchFilterQuery({
      //       insideQuery,
      //       filter: filter.search,
      //       outsideQuery,
      //     });
      //     totalCount = await company.count({ where: outsideQuery });
      //     fetchedData = await company.findAll({
      //       where: outsideQuery,
      //       ...(!!filter?.sort &&
      //         Object.keys(filter?.sort).length > 0 && {
      //           order: [
      //             [filter?.sort.field_name, filter.sort.desc ? "DESC" : "ASC"],
      //           ],
      //         }),
      //       ...paginationOptions,
      //     });
      //   }
      //   break;
      case "sec_company":
        {
          let insideQuery: any = [];
          let outsideQuery = {}; // Empty condition to remove the where clause
          totalCount = await company.count(); // Without any conditions
          fetchedData = await company.findAll({
            ...(!!filter?.sort &&
              Object.keys(filter?.sort).length > 0 && {
                order: [
                  [filter?.sort.field_name, filter.sort.desc ? "DESC" : "ASC"],
                ],
              }),
            ...paginationOptions,
          });
        }
        break;
      //screenaccess project assign to user and user roll sec login
      case "project_access":
        {
          (fetchedData = await SecLoginModel.findAll({
            where: {
              company_code: requestUser.company_code,
            },
            offset: skip,
            limit: 200,
          })) as unknown[] as SecLoginscreenaccess[];
        }
        break;
      //screenaccess project assign to user
      case "projects":
        {
          (fetchedData = await MSPSProjectMasterModel.findAll({
            where: { company_code: requestUser.company_code },
            offset: skip,
            limit: 100,
          })) as unknown[] as MSPSProjectMaster[];
        }
        break;
      //User Roll access
      case "user_role_access":
        {
          (fetchedData = await SecLogin.findAll({
            where: {
              company_code: requestUser.company_code,
            },
            offset: skip,
            limit: 200,
          })) as unknown[] as ISecLoginroleaccess[];
        }
        break;
      //User Roll access
      case "roles":
        {
          (fetchedData = await MsRole.findAll({
            where: { company_code: requestUser.company_code },
            offset: skip,
            limit: 100,
          })) as unknown[] as IMsPsRole[];
        }
        break;
      //Functionality Assign to roll
      case "access_assign_role":
        {
          (fetchedData = await secrolemaster.findAll({
            where: {
              company_code: requestUser.company_code,
              role_desc: {
                [Op.and]: [{ [Op.ne]: null } as any, { [Op.ne]: "" } as any],
              },
            },
            offset: skip,
            limit: limit,
          })) as unknown[] as ISECROLEMASTER[];
        }
        break;
      //Functionality Assign to roll
      case "serialno":
        {
          (fetchedData = await accesssecmoduledata.findAll({
            where: {
              company_code: requestUser.company_code,
              level3: {
                [Op.and]: [{ [Op.ne]: null } as any, { [Op.ne]: "" } as any],
              },
            },

            offset: skip,
            limit: 200,
          })) as unknown[] as IACCESSSECMODULEDATA[];
        }
        break;
      //functionality Assign To user
      case "access_assign_user":
        {
          (fetchedData = await accessusersecmaster.findAll({
            where: {
              company_code: requestUser.company_code,
              username: {
                [Op.and]: [{ [Op.ne]: null } as any, { [Op.ne]: "" } as any],
              },
            },
            offset: skip,
            limit: 200,
          })) as unknown[] as IUSERSECLOGIN[];
        }
        break;
      case "sec_module_dropdown":
        {
          (fetchedData = await secmodule.findAll({
            where: {
              company_code: requestUser.company_code,
            },
            offset: skip,
            limit: 200,
          })) as unknown[] as ISecmodule[];
        }
        break;
      case "user_division_access":
        {
          (fetchedData = await SecLoginModelUSERDIVISION.findAll({
            where: {
              company_code: requestUser.company_code,
            },
            offset: skip,
            limit: 200,
          })) as unknown[] as ISecLogin[];
        }
        break;
      //screenaccess project assign to user
      case "divisions":
        {
          (fetchedData = await IMSHRDIVISIONMasterModel.findAll({
            where: { company_code: requestUser.company_code },
            offset: skip,
            limit: 200,
          })) as unknown[] as IMSHRDIVISION[];
        }
        break;
      case "report_master":
        {
          (fetchedData = await reportmaster.findAll({
            where: { company_code: requestUser.company_code },
            offset: skip,
            limit: 200,
          })) as unknown[] as IReportmaster[];
        }
        break;
        case "query_master":
        {
          let outsideQuery = {};
          totalCount = await dynamicQuery.count({ where: outsideQuery });
          fetchedData = await dynamicQuery.findAll({
            where: outsideQuery,
            ...(!!filter?.sort &&
              Object.keys(filter?.sort).length > 0 && {
                order: [
                  [filter?.sort.field_name, filter.sort.desc ? "DESC" : "ASC"],
                ],
              }),
            ...paginationOptions,
          });
        }
    }
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: { tableData: fetchedData, count: totalCount },
    });
    return;
  } catch (err) {
    console.error(err);
    res.status(constants.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error occurred while fetching data",
    });
  }
};

export const deleteSecMaster = async (req: RequestWithUser, res: Response) => {
  console.error("deleteSecMaster");
  const transaction = await sequelize.transaction();
  try {
    const { master } = req.params;
    const requestUser: IUser = req.user;
    const { ids , SR_NO } = req.body;

    switch (master) {
      case "flow_master":
        if (!ids || ids.length === 0) {
          throw new Error("flow Code is required");
        }
        console.log(ids);
        {
          await Flowmaster.destroy({
            where: {
              company_code: requestUser.company_code,
              flow_code: ids,
            },
            transaction,
          });
        }
        break;
      case "role_master":
        if (!ids || ids.length === 0) {
          throw new Error("flow Code is required");
        }
        console.log(ids);
        {
          await rolemaster.destroy({
            where: {
              company_code: requestUser.company_code,
              role_id: ids,
            },
            transaction,
          });
        }
        break;
      case "sec_login":
        if (!ids || ids.length === 0) {
          throw new Error("flow Code is required");
        }
        console.log(ids);
        {
          await secmaster.destroy({
            where: {
              company_code: requestUser.company_code,
              id: ids,
            },
            transaction,
          });
        }
        break;
      case "sec_module_data":
        if (!ids || ids.length === 0) {
          throw new Error("flow Code is required");
        }
        console.log(ids);
        {
          await secmodule.destroy({
            where: {
              company_code: requestUser.company_code,
              serial_no: ids,
            },
            transaction,
          });
        }
        break;
      case "sec_company":
        if (!ids || ids.length === 0) {
          throw new Error("flow Code is required");
        }
        console.log(ids);
        {
          await company.destroy({
            where: {
              company_code: ids,
            },
            transaction,
          });
        }
        break;
      case "report_master":
        if (!ids || ids.length === 0) {
          throw new Error("Report No is required");
        }
        console.log(ids);
        {
          await reportmaster.destroy({
            where: {
              report_no: ids,
            },
            transaction,
          });
        }
        break;
        case "query_master":
        if (!ids|| ids.length === 0) {
          throw new Error("SQL STRING is required");
        }
        console.log(ids);
        {
          await dynamicQuery.destroy({
            where: {
              SR_NO: ids,
            },
            transaction,
          });
        }
        break;
    }
    await transaction.commit();
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "Record is successfully deleted.",
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
