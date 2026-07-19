import bcrypt from "bcrypt";
import {
  ButtonGroup,
  ComparePasswordInterface,
  CreateLogInterface,
  GenerateTokenInterface,
  GetFilterQueryInterface,
  RowData,
  SendEmailInterface,
  TreeNode,
} from "../interfaces/common.interface";
import jsonwebtoken from "jsonwebtoken";
import constants from "./constants";
import { StructuredResult } from "../interfaces/auth.interface";
import { Op } from "sequelize";
// import TiPackdetSeries from "../models/wms/transaction/inbound/tiPackDetailSeries_wms.model";
import Log from "../models/log.model";
const nodemailer = require("nodemailer"); // mail notification

// Function to compare a plain password with a hashed password
export const comparePassword = async (args: ComparePasswordInterface) => {
  // Destructure password and hashedPassword from arguments
  const { password, hashedPassword } = args;
  // Compare the password with the hashed password using bcrypt
  const result = await bcrypt.compare(password, hashedPassword);

  // Return the result of the comparison (true if match, false otherwise)
  return result;
};

// Function to generate a JSON Web Token (JWT)
export const generateToken = async (args: GenerateTokenInterface) => {
  // Destructure username, email_id, and loginid from arguments
  const { username, email_id, loginid } = args;

  // Sign the JWT with the provided data and set expiration to 24 hours
  const token = jsonwebtoken.sign(
    {
      username,
      email_id,
      loginid,
    },
    constants.AUTHENTICATION.APP_SECRET,
    {
      expiresIn: "72h",
    }
  );
  // Return the generated token
  return token;
};

// Function to build a tree structure from row data and permissions
export const buildTree = (
  data: RowData[],
  permission: StructuredResult
): TreeNode[] => {
  // Initialize an empty tree object
  const tree: Record<string, TreeNode> = {};
  // Iterate over each row of data
  data.forEach((row) => {
    // Destructure properties from the row
    const { APP_CODE, LEVEL1, LEVEL2, LEVEL3, URL_PATH } = row;

    // If the APP_CODE node doesn't exist, create it
    if (!tree[APP_CODE]) {
      tree[APP_CODE] = {
        id: (permission[APP_CODE]?.serial_number ?? 0).toString(),
        title: APP_CODE,
        type: "collapse",
        icon: "AbcIcon",
        url_path: APP_CODE.toLowerCase(),
        children: [],
      };
    }
    // Find or create LEVEL1 node
    let level1Node = tree[APP_CODE]?.children!.find(
      (node) => node.title === LEVEL1
    );

    if (!level1Node && LEVEL1 && LEVEL2 !== "") {
      level1Node = {
        id: !!permission[APP_CODE]?.children[LEVEL1]?.serial_number.toString()
          ? permission[APP_CODE]?.children[LEVEL1]?.serial_number.toString()
          : Math.floor(Number(Math.random() * 100000)).toString(),
        url_path: APP_CODE.toLowerCase(),
        title: LEVEL1,
        type: "group",
        icon: "AbcIcon",
        children: [],
      };
      tree[APP_CODE]?.children!.push(level1Node);
      tree[APP_CODE].id =
        permission[APP_CODE]?.children[LEVEL1]?.serial_number.toString();
    }

    if (!level1Node && LEVEL1 && LEVEL2 === "") {
      level1Node = {
        id: !!permission[APP_CODE]?.children[LEVEL1]?.serial_number.toString()
          ? permission[APP_CODE]?.children[LEVEL1]?.serial_number.toString()
          : Math.floor(Number(Math.random() * 100000)).toString(),
        title: LEVEL1,
        type: "item",
        icon: "AbcIcon",
        url_path: URL_PATH,
      };
      tree[APP_CODE]?.children!.push(level1Node);
      tree[APP_CODE].id =
        permission[APP_CODE]?.children[LEVEL1]?.serial_number.toString();
    }

    // If LEVEL2 exists and LEVEL1 node is found, find or create LEVEL2 node
    if (LEVEL2 && level1Node && LEVEL3 !== "") {
      let level2Node = level1Node?.children!.find(
        (node) => node.title === LEVEL2
      );
      if (!level2Node) {
        level2Node = {
          id: permission[APP_CODE]?.children[LEVEL2]?.serial_number.toString(),
          title: LEVEL2,
          type: "collapse",
          icon: "AbcIcon",
          children: [],
        };
        level1Node?.children!.push(level2Node);
      }

      // If LEVEL3 exists, find or create LEVEL3 node
      if (LEVEL3) {
        let level3Node = level2Node?.children!.find(
          (node) => node.title === LEVEL3
        );
        if (!level3Node) {
          level3Node = {
            id: permission[APP_CODE]?.children[
              LEVEL3
            ]?.serial_number.toString(),
            title: LEVEL3,
            url_path: URL_PATH,
            type: "item",
            icon: "AbcIcon",
          };
          level2Node?.children!.push(level3Node);
        }
      }
    }
    if (LEVEL2 && level1Node && LEVEL3 === "") {
      let level2Node = level1Node?.children!.find(
        (node) => node.title === LEVEL2
      );
      if (!level2Node) {
        level2Node = {
          id: permission[APP_CODE]?.children[LEVEL2]?.serial_number.toString(),
          title: LEVEL2,
          type: "item",
          icon: "AbcIcon",
          url_path: URL_PATH,
        };
        level1Node?.children!.push(level2Node);
      }

      // If LEVEL3 exists, find or create LEVEL3 node
      if (LEVEL3) {
        let level3Node = level2Node?.children!.find(
          (node) => node.title === LEVEL3
        );
        if (!level3Node) {
          level3Node = {
            id: permission[APP_CODE]?.children[
              LEVEL3
            ]?.serial_number.toString(),
            title: LEVEL3,
            url_path: URL_PATH,
            type: "item",
            icon: "AbcIcon",
          };
          level2Node?.children!.push(level3Node);
        }
      }
    }
  });

  // Return the tree as an array of its values
  return Object.values(tree);
};

export const getSearchFilterQuery = (args: GetFilterQueryInterface) => {
  try {
    const { insideQuery, filter, outsideQuery } = args;

    // Iterate over each filter array
    for (let index = 0; index < filter?.length; index++) {
      const eachFilter = filter[index];
      let filterQuery = [];

      // Iterate over each element within the filter array
      for (let indice = 0; indice < eachFilter?.length; indice++) {
        const element = eachFilter[indice];

        const fieldName = element.field_name;
        const operator = element.operator;

        // Skip if field_value is undefined or an empty array
        if (
          element.field_value === undefined ||
          (Array.isArray(element.field_value) &&
            element.field_value?.length === 0)
        ) {
          continue;
        }

        // Build filter query based on the operator
        switch (operator) {
          case "in":
            filterQuery.push({
              [fieldName]: {
                [Op.or]: element.field_value.map((value: any) => ({
                  [Op.iLike]: `%${value}%`,
                })),
              },
            });
            break;

          case "not_in":
            filterQuery.push({
              [fieldName]: { [Op.notIn]: element.field_value },
            });
            break;

          case "exactmatch":
            filterQuery.push({
              [fieldName]: { [Op.eq]: element.field_value },
            });
            break;

          case "contains":
            filterQuery.push({
              [fieldName]: { [Op.like]: `%${element.field_value}%` },
            });
            break;

          case "=":
            filterQuery.push({
              [fieldName]: { [Op.eq]: element.field_value },
            });
            break;

          case ">":
            filterQuery.push({
              [fieldName]: { [Op.gt]: element.field_value },
            });
            break;

          case ">=":
            filterQuery.push({
              [fieldName]: { [Op.gte]: element.field_value },
            });
            break;

          case "<":
            filterQuery.push({
              [fieldName]: { [Op.lt]: element.field_value },
            });
            break;

          case "<=":
            filterQuery.push({
              [fieldName]: { [Op.lte]: element.field_value },
            });
            break;

          case "between":
            filterQuery.push({
              [fieldName]: {
                [Op.between]: [
                  new Date(element.field_value[0]),
                  new Date(element.field_value[1]),
                ],
              },
            });
            break;
        }
      }

      // Add the compiled filter query to insideQuery if it exists
      if (filterQuery?.length) {
        insideQuery.push({ [Op.or]: filterQuery });
      }
    }

    // Combine insideQuery with outsideQuery if insideQuery exists
    if (insideQuery?.length) {
      outsideQuery[Op.and] = [...outsideQuery[Op.and], ...insideQuery];
    }

    return outsideQuery;
  } catch (error) {
    console.error("Error building Sequelize filter query:", error);
    return {};
  }
};
interface ITreeItem {
  id: string;
  label: string;
  parent_code?: string | null;
  level: number;
  children: ITreeItem[];
}
export function buildHierarchy(data: any[]): ITreeItem[] {
  const hierarchy: ITreeItem[] = [];

  data.forEach((eachData) => {
    const {
      ac_code,
      ac_name,
      l4_code,
      l4_description,
      l3_code,
      l3_description,
      l2_code,
      l2_description,
    } = eachData;

    if (!l2_code) {
      return;
    }

    let level2Index = hierarchy.findIndex((item) => item.id === l2_code);
    if (level2Index === -1) {
      hierarchy.push({
        id: l2_code,
        label: l2_description,
        level: 2,
        parent_code: null,
        children: [],
      });
      level2Index = hierarchy.length - 1;
    }

    const level2 = hierarchy[level2Index];

    if (!l3_code) {
      return;
    }

    let level3Index = level2?.children.findIndex((item) => item.id === l3_code);
    if (level3Index === -1) {
      level2?.children.push({
        id: l3_code,
        label: l3_description,
        level: 3,
        parent_code: l2_code,
        children: [],
      });
      level3Index = level2?.children.length - 1;
    }

    const level3 = level2?.children[level3Index];

    if (!l4_code) {
      return;
    }

    let level4Index = level3?.children.findIndex((item) => item.id === l4_code);
    if (level4Index === -1) {
      level3?.children.push({
        id: l4_code,
        label: l4_description,
        level: 4,
        parent_code: l3_code,
        children: [],
      });
      level4Index = level3?.children.length - 1;
    }

    const level4 = level3?.children[level4Index];

    if (!!ac_code) {
      let level5Index = level4?.children.findIndex(
        (item) => item.id === ac_code
      );
      if (level5Index === -1) {
        level4?.children.push({
          id: ac_code,
          label: ac_name,
          level: 5,
          parent_code: l4_code,
          children: [],
        });
      }
    }
  });

  return hierarchy;
}

// -----------GRN Report Formate Functions ----------
export async function formatData(data: any, getTiPackdetSeriesData: any) {
  // Check if the data is valid and is an array
  if (!data || !Array.isArray(data)) {
    return { success: false, error: "Invalid data format" };
  }

  // Convert to plain objects if data contains Sequelize model instances
  const plainData = data.map((item: any) =>
    item.get ? item.get({ plain: true }) : item
  );

  // Initialize objects to store grouped data and the final result
  const groupedData: Record<string, any[]> = {};
  const result: Record<string, any> = {};
  // Define common fields to be extracted
  const commonFields = [
    "job_no",
    "user_id",
    "prin_name",
    "grn_number",
    "grn_date",
    "container_no",
    "container_size",
    "doc_ref",
    "po_no",
  ];

  // Step 1: Extract common fields from the first object
  commonFields.forEach((field) => {
    const lowerCaseField = field.toLowerCase();
    if (plainData[0][lowerCaseField] !== undefined) {
      result[field] = plainData[0][lowerCaseField];
    }
  });

  // Step 2: Group items by `prod_code`
  plainData.forEach((item) => {
    const prodCode = item.prod_code;
    if (!groupedData[prodCode]) {
      groupedData[prodCode] = [];
    }
    groupedData[prodCode].push(item);
  });

  // Step 3: Format each `prod_code` group and accumulate totals
  const productGroups = await Promise.all(
    Object.values(groupedData).map(async (group: any) => {
      let totalGrossWt = 0;
      let totalNetWt = 0;
      let totalVolume = 0;

      // Format each item in the group
      const formattedGroup = await Promise.all(
        group.map(async (item: any) => {
          // Accumulate totals
          totalGrossWt += parseFloat(item.gross_wt || 0);
          totalNetWt += parseFloat(item.net_wt || 0);
          totalVolume += parseFloat(item.volume || 0);

          // Exclude common fields from each item
          const formattedItem = { ...item };
          commonFields.forEach((field) => delete formattedItem[field]);

          // Fetch and add children data (series details)
          try {
            const childrenData = await getTiPackdetSeriesData({
              company_code: item.company_code,
              prin_code: item.prin_code,
              job_no: item.job_no,
              packdet_no: item.packdet_no,
            });

            // Assign children data if available
            if (Array.isArray(childrenData) && childrenData.length > 0) {
              formattedItem.children = childrenData;
            } else {
              formattedItem.children = [];
            }
          } catch (error) {
            console.error(
              `Error fetching children data for prod_code ${item.prod_code}:`,
              error
            );
          }

          return formattedItem;
        })
      );

      // Add a summary entry for each group with totals
      formattedGroup.push({
        prod_code: group[0].prod_code,
        gross_wt: totalGrossWt.toFixed(6),
        net_wt: totalNetWt.toFixed(6),
        volume: totalVolume.toFixed(6),
        isTotal: true,
      });

      return formattedGroup;
    })
  );

  // Step 4: Add the grand total row
  let totalGrossWt = 0;
  let totalNetWt = 0;
  let totalVolume = 0;

  // Calculate grand totals
  productGroups.flat().forEach((item: any) => {
    if (item.isTotal) return;
    totalGrossWt += parseFloat(item.gross_wt || 0);
    totalNetWt += parseFloat(item.net_wt || 0);
    totalVolume += parseFloat(item.volume || 0);
  });

  // Add grand totals to the result
  result.products = [
    ...productGroups.flat(),
    {
      gross_wt: totalGrossWt.toFixed(6),
      net_wt: totalNetWt.toFixed(6),
      volume: totalVolume.toFixed(6),
      grnTotal: true,
    },
  ];
  return result;
}

// Function to group data by container number
export const groupByContainerNo = (data: any[]) => {
  // Initialize an object to store grouped data
  const groupedData: { [key: string]: any[] } = {};

  // Group items by `container_no`
  data.forEach((item) => {
    const containerNo = item.container_no;

    if (!groupedData[containerNo]) {
      groupedData[containerNo] = [];
    }

    groupedData[containerNo].push(item);
  });

  // Convert the grouped data object to an array of arrays
  const result = Object.values(groupedData);

  return result;
};

// Function to fetch series details for a given packdet
// export const getTiPackdetSeriesData = async ({
//   company_code,
//   prin_code,
//   job_no,
//   packdet_no,
// }: {
//   company_code: string;
//   prin_code: string;
//   job_no: string;
//   packdet_no: number;
// }) => {
//   try {
//     // Fetch series data from the database
//     let packDetSeriesData: any = await TiPackdetSeries.findAll({
//       attributes: ["packdet_no", "serial_number"],
//       where: {
//         company_code,
//         prin_code,
//         job_no,
//         packdet_no,
//       },
//     });

//     // Handle the array response correctly
//     if (packDetSeriesData.length > 0) {
//       return packDetSeriesData;
//     }
//     return [];
//   } catch (error: any) {
//     console.log("Error Occured tiPackdetReport-->", error.message);
//     return error.message;
//   }
// };

// ---------- Stock Detail Report ------------
// Function to format data for the Stock Detail Report
export const formatDataDetailStock = (data: any) => {
  // Check if data is valid and is an array
  if (!data || !Array.isArray(data))
    return { success: false, error: "Invalid data format" };

  // Convert to plain objects if data contains model instances
  const plainData = data.map((item: any) =>
    item.get ? item.get({ plain: true }) : item
  );

  // Initialize objects to store grouped data and the final result
  const groupedData: any = {};
  const result: any = {};
  // Define common fields to be extracted
  const commonFields = ["company_code", "prin_code", "prin_name"];

  // Step 1: Separate common fields from the first object
  commonFields.forEach((field) => {
    const lowerCaseField = field.toLowerCase();
    // Check if the field exists in the first object
    if (plainData?.[0]?.[lowerCaseField] !== undefined)
      result[field] = plainData?.[0]?.[field];
  });

  // Step 2: Group items by `prod_code`
  plainData.forEach((item) => {
    const prodCode = item.prod_code;
    if (!groupedData[prodCode]) {
      groupedData[prodCode] = [];
    }
    groupedData[prodCode].push(item);
  });

  // Step 3: Format each `prod_code` group and accumulate totals
  const productGroups = Object.values(groupedData).map((group: any) => {
    let totalPQtyInStock = 0;
    let totalLQtyInStock = 0;
    let totalPQtyAvailable = 0;
    let totalLQtyAvailable = 0;

    // First object should include `prod_code`, `prod_name`, `puom`, `luom`
    const firstItem = {
      prod_code: group[0].prod_code,
      prod_name: group[0].prod_name,
      p_uom: group[0].p_uom,
      l_uom: group[0].l_uom,
    };

    // Format each item in the group
    const formattedGroup = group.map((item: any) => {
      // Accumulate totals
      totalPQtyInStock += parseFloat(item.pqty_stock || 0);
      totalLQtyInStock += parseFloat(item.lqty_stock || 0);
      totalPQtyAvailable += parseFloat(item.pqty_avl || 0);
      totalLQtyAvailable += parseFloat(item.lqty_avl || 0);

      // Exclude common fields from each item
      const formattedItem = { ...item };
      commonFields.forEach((field) => delete formattedItem[field]);
      // Remove prod_code, prod_name, puom, and luom from the rest of the objects
      delete formattedItem.prod_code;
      delete formattedItem.prod_name;
      delete formattedItem.puom;
      delete formattedItem.luom;

      return formattedItem;
    });

    // Add the summary entry for each group
    formattedGroup.push({
      prod_code: group[0].prod_code,
      uppp: group[0].uppp,
      pqty_stock: totalPQtyInStock.toFixed(6),
      lqty_stock: totalLQtyInStock.toFixed(6),
      pqty_avl: totalPQtyAvailable.toFixed(6),
      lqty_avl: totalLQtyAvailable.toFixed(6),
      isTotal: true,
    });

    // Return the first item followed by the rest of the formatted items
    return [firstItem, ...formattedGroup];
  });

  // Step 4: Add the grand total row
  let grandTotalPQtyInStock = 0;
  let grandTotalLQtyInStock = 0;
  let grandTotalPQtyAvailable = 0;
  let grandTotalLQtyAvailable = 0;

  // Calculate grand totals
  productGroups.forEach((group: any) => {
    group.forEach((item: any) => {
      if (item.isTotal) return;
      grandTotalPQtyInStock += parseFloat(item.pqty_stock || 0);
      grandTotalLQtyInStock += parseFloat(item.lqty_stock || 0);
      grandTotalPQtyAvailable += parseFloat(item.pqty_avl || 0);
      grandTotalLQtyAvailable += parseFloat(item.lqty_avl || 0);
    });
  });

  // Add grand totals to the result
  result.products = [
    ...productGroups.flat(),
    {
      pqty_stock: grandTotalPQtyInStock.toFixed(6),
      lqty_stock: grandTotalLQtyInStock.toFixed(6),
      pqty_avl: grandTotalPQtyAvailable.toFixed(6),
      lqty_avl: grandTotalLQtyAvailable.toFixed(6),
      stockTotal: true,
    },
  ];

  return result;
};

// Function to convert Sequelize query conditions to SQL
export const convertSequelizeConditionToSql = (query: any): string => {
  let conditions: string[] = [];
  // Check if the query has an 'and' operator
  if (query[Op.and]) {
    // Map each condition to a SQL string
    conditions = query[Op.and].map((cond: any) =>
      Object.entries(cond)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(" AND ")
    );
  }
  // Join all conditions with 'AND' or return '1=1' if no conditions
  return conditions.length ? conditions.join(" AND ") : "1=1";
};

// -------- convert data in to desired format for summary stock -----------
// Function to format data for the Summary Stock Report
export const formatDataSummaryStock = (stockReport: any) => {
  return stockReport.map((item: any) => {
    // Calculate balance fields
    const balance_puom =
      parseFloat(item.open_stk_puom) +
      (parseFloat(item.qty_in_puom) - parseFloat(item.qty_in_luom));
    const balance_luom =
      parseFloat(item.open_stk_luom) +
      (parseFloat(item.qty_in_luom) - parseFloat(item.qty_out_luom));
    const balance =
      parseFloat(item.open_stk) +
      (parseFloat(item.qty_in) - parseFloat(item.qty_out));
    // Return the new object with balance fields added last
    return {
      ...item,
      balance_puom,
      balance_luom,
      balance,
    };
  });
};

// ---------- convert data in to desired format for Ageing Stock Report -----------
// Function to format data for the Ageing Stock Report
export const ageingStockFormatData = (data: any) => {
  // Check if data is empty or has no elements
  if (!data || data.length === 0) return {};
  // Convert to plain objects if data contains model instances
  const plainData = data.map((item: any) =>
    item.get ? item.get({ plain: true }) : item
  );
  // Extract common fields from the first object
  const commonFields = {
    COMPANY_CODE: plainData[0].COMPANY_CODE,
    PRIN_CODE: plainData[0].PRIN_CODE,
    PRIN_NAME: plainData[0].PRIN_NAME,
    d_age1: plainData[0].d_age1,
    d_age2: plainData[0].d_age2,
    d_age3: plainData[0].d_age3,
    d_age4: plainData[0].d_age4,
    d_age5: plainData[0].d_age5,
  };

  // Initialize grand total
  let grandTotal = 0;
  let BELOW_AGE1_Total = 0;
  let AGE_1_total = 0;
  let AGE_2_total = 0;
  let AGE_3_total = 0;
  let AGE_4_total = 0;
  let ABOVE_AGE5_total = 0;
  // Map through the data and create a new array for the 'data' field
  const formattedData = plainData.map((item: any) => {
    // Calculate total for each item
    const total =
      parseFloat(item.BELOW_AGE1) +
      parseFloat(item.AGE_1) +
      parseFloat(item.AGE_2) +
      parseFloat(item.AGE_3) +
      parseFloat(item.AGE_4) +
      parseFloat(item.ABOVE_AGE5);

    // Add to grand total
    grandTotal += total;
    BELOW_AGE1_Total += parseFloat(item.BELOW_AGE1);
    AGE_1_total += parseFloat(item.AGE_1);
    AGE_2_total += parseFloat(item.AGE_2);
    AGE_3_total += parseFloat(item.AGE_3);
    AGE_4_total += parseFloat(item.AGE_4);
    ABOVE_AGE5_total += parseFloat(item.ABOVE_AGE5);
    // Return the object with data nested inside and total included
    return {
      BELOW_AGE1: item.BELOW_AGE1,
      AGE_1: item.AGE_1,
      AGE_2: item.AGE_2,
      AGE_3: item.AGE_3,
      AGE_4: item.AGE_4,
      ABOVE_AGE5: item.ABOVE_AGE5,

      total,
    };
  });

  // Append the grand total object at the end of the data array
  formattedData.push({
    isAgeing: true,
    grand_total: grandTotal,
    BELOW_AGE1_Total,
    AGE_1_total,
    AGE_2_total,
    AGE_3_total,
    AGE_4_total,
    ABOVE_AGE5_total,
  });

  // Return the final object with common fields and data array
  return {
    ...commonFields,
    data: formattedData,
  };
};

// ------- Ageing Report Accounts Division Formatted Functions -------
// Function to format data for the Ageing Report Accounts Division
export const AgeingViewAccountsFormatted = (
  data: any[],
  age_1: any,
  age_2: any,
  age_3: any,
  age_4: any,
  age_5: any,
  age_6: any
) => {
  // Check if data is valid and not empty
  if (!data || data.length === 0) return {};
  // Convert to plain objects if data contains model instances
  const plainData = data.map((item: any) =>
    item.get ? item.get({ plain: true }) : item
  );
  // Define common fields
  const commonFields = {
    d_age1: age_1,
    d_age2: age_2,
    d_age3: age_3,
    d_age4: age_4,
    d_age5: age_5,
    d_age6: age_6,
  };

  // Group data by l4_code
  const groupedData = plainData.reduce((acc, item) => {
    const l4Code = item.l4_code;

    // Initialize group if it doesn't exist
    if (!acc[l4Code]) {
      acc[l4Code] = {
        data: [],
        totals: {
          isTotal: true,
          l4_code: item.l4_code,
          l4_description: item.l4_description,
          age_below: 0,
          age_1: 0,
          age_2: 0,
          age_3: 0,
          age_4: 0,
          age_5: 0,
          age_above: 0,
        },
        heading: {
          isHeading: true,
          l4_code: item.l4_code,
          l4_description: item.l4_description,
        },
      };
    }

    // Add the current item to the group
    acc[l4Code].data.push(item);

    // Sum the totals
    acc[l4Code].totals.age_below += parseFloat(item.age_below || 0);
    acc[l4Code].totals.age_1 += parseFloat(item.age_1 || 0);
    acc[l4Code].totals.age_2 += parseFloat(item.age_2 || 0);
    acc[l4Code].totals.age_3 += parseFloat(item.age_3 || 0);
    acc[l4Code].totals.age_4 += parseFloat(item.age_4 || 0);
    acc[l4Code].totals.age_5 += parseFloat(item.age_5 || 0);
    acc[l4Code].totals.age_above += parseFloat(item.age_above || 0);

    return acc;
  }, {});

  // Initialize grand totals
  const grandTotals = {
    grandTotal: true,
    age_below: 0,
    age_1: 0,
    age_2: 0,
    age_3: 0,
    age_4: 0,
    age_5: 0,
    age_above: 0,
  };

  // Flatten the grouped data into an array and calculate grand totals
  const resultDataArray = Object.values(groupedData).flatMap((group: any) => {
    // Add to grand totals
    grandTotals.age_below += group.totals.age_below;
    grandTotals.age_1 += group.totals.age_1;
    grandTotals.age_2 += group.totals.age_2;
    grandTotals.age_3 += group.totals.age_3;
    grandTotals.age_4 += group.totals.age_4;
    grandTotals.age_5 += group.totals.age_5;
    grandTotals.age_above += group.totals.age_above;

    return [group.heading, ...group.data, group.totals];
  });

  // Add grand totals at the end
  resultDataArray.push(grandTotals);

  // Return the final object with common fields and data array
  return {
    ...commonFields,
    dataArray: resultDataArray,
  };
};

// --------- Structue Profi And Loss Report Data -----------
// Function to format the Profit and Loss Report data
export const formatProfitAndLossReport = (data: any, decimalLimit: any) => {
  // Check if data is valid and is an array
  if (!data || !Array.isArray(data)) {
    return { success: false, error: "Invalid data format" };
  }

  // Convert to plain objects if data contains Sequelize model instances
  const plainData = data.map((item: any) =>
    item.get ? item.get({ plain: true }) : item
  );

  // Initialize objects to store grouped data and the final result
  const groupedData: Record<string, any[]> = {};
  const result: Record<string, any> = {};

  // Group items by `h_code`
  plainData.forEach((item: any) => {
    const hCode = item.h_code;
    if (!groupedData[hCode]) {
      groupedData[hCode] = [];
    }
    // Format the lcur_amount field
    groupedData[hCode].push(item);
  });

  const productGroups: any[] = [];
  let grandTotalLcurAmount = 0;

  // Process each group
  for (const [hCode, group] of Object.entries(groupedData)) {
    let totalLcurAmount = 0;

    // Push the heading for each group
    productGroups.push({
      h_code: hCode,
      h_name: group[0].h_name || "Unknown Name",
      isHeading: true,
    });

    // Format each item in the group
    const formattedGroup: any[] = group.map((item: any) => {
      const lcurAmount = parseFloat(item.lcur_amount || 0);
      totalLcurAmount += lcurAmount;
      return { ...item, lcur_amount: lcurAmount.toFixed(decimalLimit) };
    });

    // Add a summary row for the group
    formattedGroup.push({
      h_code: hCode,
      lcur_amount: totalLcurAmount.toFixed(decimalLimit),
      isTotal: true,
    });

    // Push the formatted group to the product groups
    productGroups.push(...formattedGroup);
    grandTotalLcurAmount += totalLcurAmount;
  }

  // Add a grand total row
  productGroups.push({
    lcur_amount: grandTotalLcurAmount.toFixed(decimalLimit),
    plGrandTotal: true,
  });

  // Assign the processed product groups to the result object
  result.products = productGroups;
  console.log("result:", JSON.stringify(result));
  return result;
};

// ------------- Cheque Payment Report Format Function -------------
// Function to format the Cheque Payment Report data
export const chequePaymentReportFormat = (
  data: any[],
  decimalLimit: number
) => {
  // Check if data is valid and is a non-empty array
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { success: false, message: "Invalid data" };
  }

  // Convert to plain objects if data contains model instances
  const plainData = data.map((item: any) =>
    item.get ? item.get({ plain: true }) : item
  );
  let total = 0;

  // Common fields to extract
  const commonFields = [
    "company_name",
    "hdr_ac_code",
    "doc_no",
    "doc_date",
    "cheque_no",
    "cheque_date",
    "party_name",
    "prepared",
    "verified",
    "approved",
    "bank_name_inv",
    "company_address1",
    "company_address2",
    "company_address3",
  ];

  // Extract common fields from the first object
  const commonFieldData: Record<string, any> = {};
  commonFields.forEach((field) => {
    const lowerCaseField = field.toLowerCase();
    if (data[0][lowerCaseField] !== undefined) {
      commonFieldData[field] = plainData[0][lowerCaseField];
    }
  });

  // Process the array to calculate totals and format amounts
  const formattedData = plainData.map((item) => {
    const amount = parseFloat(item.amount) || 0;
    total += amount;
    return {
      ...item,
      amount: parseFloat(amount.toFixed(decimalLimit)),
    };
  });

  // Add total as the last item
  formattedData.push({
    isTotal: true,
    total: total.toFixed(decimalLimit),
  });

  // Combine common fields and the formatted data into the final structure
  return {
    ...commonFieldData,
    products: formattedData,
  };
};

//-------------create function for creating log-------------
// Function to create a log entry
export const createLog = async (args: CreateLogInterface) => {
  // Destructure the arguments to get necessary information
  const { event, request_user, module, description } = args;
  // Prepare the log entry object
  const createLogEntry = {
    company_code: request_user.company_code,
    module: module,
    description: description,
    read: "N",
    loginid: request_user.loginid,
  };

  // Switch based on the event type
  switch (event) {
    case constants.EVENTS.COUNTRY_CREATED: {
      // Create a log entry for country creation
      await Log.create({
        ...createLogEntry,
        created_by: request_user.loginid,
        updated_by: request_user.loginid,
      });
      break;
    }
  }
};

// Function to format role permissions
export function formatRolePermissions(rows: any[]) {
  // Initialize an object to store formatted data
  const formattedData: { [key: string]: ButtonGroup } = {};

  // Iterate over each row of role permissions
  rows.forEach((row) => {
    const roleId = row.SERIAL_NO;

    // Initialize a new ButtonGroup object if it doesn't exist for this roleId
    if (!formattedData[roleId]) {
      formattedData[roleId] = {} as ButtonGroup;
    }

    // Assign or update the permissions for this roleId
    formattedData[roleId] = {
      new: row.SNEW || "N",
      modfiy: row.SMODIFY || "N",
      delete: row.SDELETE || "N",
      save: row.SSAVE || "N",
      save_as: row.SSAVEAS || "N",
      upload: row.SUPLOAD || "N",
      undo: row.SUNDO || "N",
      print: row.SPRINT || "N",
      print_setup: row.SPRINTSETUP || "N",
      help: row.SHELP || "N",
    };
  });

  return formattedData;
}

// export const notifyUser = async (args: SendEmailInterface) => {
//   const {
//     event,
//     request_user,
//     message,
//     request_users,
//     subject,
//     cc,
//     htmlMessage,
//     attachments,
//   } = args;

//   const transporter = nodemailer.createTransport({
//     service: "Outlook365",
//     auth: {
//       user: constants.ENV.EMAIL_USER,
//       pass: constants.ENV.EMAIL_PASS,
//     },
//   });

//   let mailOptions;

//   switch (event) {
//     case constants.EVENTS.COUNTRY_CREATED:
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_user?.contact_email,
//         subject:
//           subject || "Country " + constants.MESSAGES.CREATED_SUCCESSFULLY,
//         text: message || "Country " + constants.MESSAGES.CREATED_SUCCESSFULLY,
//       };
//       break;

//     case constants.EVENTS.TRANSACTION_COMPLETED:
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         cc: cc,
//         subject: "Notification From BT-PMS",
//         text: message || "A new transaction has been successfully completed.",
//         html: htmlMessage,
//       };
//       break;

//     // New cases for PO operations
//     case constants.EVENTS.PO_MODIFIED:
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         cc: cc,
//         subject:
//           subject || `Purchase Order Modified: ${request_user?.company_code}`,
//         text:
//           message ||
//           `Dear Sir,\n\nYour Purchase Order has been modified.\n\nBest regards.`,
//         attachments: attachments || [],
//       };
//       break;

//     case constants.EVENTS.PO_CONFIRMED:
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         cc: cc,
//         subject:
//           subject || `Purchase Order Confirmed: ${request_user?.company_code}`,
//         text:
//           message ||
//           `Dear Sir,\n\nYour Purchase Order has been confirmed.\n\nBest regards.`,
//         attachments: attachments || [],
//       };
//       break;

//     case constants.EVENTS.PO_CANCELLED:
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         cc: cc,
//         subject:
//           subject || `Purchase Order Cancelled: ${request_user?.company_code}`,
//         text:
//           message ||
//           `Dear Sir,\n\nYour Purchase Order has been cancelled.\n\nBest regards.`,
//         attachments: attachments || [],
//       };
//       break;

//     // New cases for PR operations
//     case "CANCEL":
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         cc: cc,
//         subject: subject || `Purchase Request Cancelled`,
//         text:
//           message ||
//           `Dear Sir,\n\nThe Purchase Request has been cancelled.\n\nBest regards.`,
//         html: htmlMessage,
//       };
//       break;

//     case "REJECT":
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         cc: cc,
//         subject: subject || `Purchase Request Rejected`,
//         text:
//           message ||
//           `Dear Sir,\n\nThe Purchase Request has been rejected.\n\nBest regards.`,
//         html: htmlMessage,
//       };
//       break;

//     case "SENTBACK":
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         cc: cc,
//         subject: subject || `Purchase Request Sent Back`,
//         text:
//           message ||
//           `Dear Sir,\n\nThe Purchase Request has been sent back for further action.\n\nBest regards.`,
//         html: htmlMessage,
//       };
//       break;

//     case constants.EVENTS.FORGOT_PASSWORD:
//       mailOptions = {
//         from: constants.ENV.EMAIL_USER,
//         to: request_users,
//         subject: subject || "Password Reset Instructions",
//         text: message || "Please follow the instructions to reset your password.",
//         html: htmlMessage,
//       };
//       break;

//     default:
//       console.warn(`Unhandled event type: ${event}`);
//       return;
//   }
//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`Email sent successfully for event: ${event}`);
//   } catch (error) {
//     console.error(`Failed to send email for event: ${event}`, error);
//   }
// };

// services/email.service.ts - Update your existing function
export const notifyUser = async (args: SendEmailInterface) => {
  const {
    event,
    request_user,
    message,
    request_users,
    subject,
    cc,
    htmlMessage,
    attachments,
  } = args;

  const transporter = nodemailer.createTransport({
    service: "Outlook365",
    auth: {
      user: constants.ENV.EMAIL_USER,
      pass: constants.ENV.EMAIL_PASS,
    },
  });

  let mailOptions;

  switch (event) {
    case constants.EVENTS.COUNTRY_CREATED:
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_user?.contact_email,
        subject:
          subject || "Country " + constants.MESSAGES.CREATED_SUCCESSFULLY,
        text: message || "Country " + constants.MESSAGES.CREATED_SUCCESSFULLY,
      };
      break;

    case constants.EVENTS.TRANSACTION_COMPLETED:
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        cc: cc,
        subject: "Notification From BT-PMS",
        text: message || "A new transaction has been successfully completed.",
        html: htmlMessage,
      };
      break;

    // New cases for PO operations
    case constants.EVENTS.PO_MODIFIED:
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        cc: cc,
        subject:
          subject || `Purchase Order Modified: ${request_user?.company_code}`,
        text:
          message ||
          `Dear Sir,\n\nYour Purchase Order has been modified.\n\nBest regards.`,
        attachments: attachments || [],
      };
      break;

    case constants.EVENTS.PO_CONFIRMED:
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        cc: cc,
        subject:
          subject || `Purchase Order Confirmed: ${request_user?.company_code}`,
        text:
          message ||
          `Dear Sir,\n\nYour Purchase Order has been confirmed.\n\nBest regards.`,
        attachments: attachments || [],
      };
      break;

    case constants.EVENTS.PO_CANCELLED:
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        cc: cc,
        subject:
          subject || `Purchase Order Cancelled: ${request_user?.company_code}`,
        text:
          message ||
          `Dear Sir,\n\nYour Purchase Order has been cancelled.\n\nBest regards.`,
        attachments: attachments || [],
      };
      break;

    // New cases for PR operations
    case "CANCEL":
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        cc: cc,
        subject: subject || `Purchase Request Cancelled`,
        text:
          message ||
          `Dear Sir,\n\nThe Purchase Request has been cancelled.\n\nBest regards.`,
        html: htmlMessage,
      };
      break;

    case "REJECT":
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        cc: cc,
        subject: subject || `Purchase Request Rejected`,
        text:
          message ||
          `Dear Sir,\n\nThe Purchase Request has been rejected.\n\nBest regards.`,
        html: htmlMessage,
      };
      break;

    case "SENTBACK":
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        cc: cc,
        subject: subject || `Purchase Request Sent Back`,
        text:
          message ||
          `Dear Sir,\n\nThe Purchase Request has been sent back for further action.\n\nBest regards.`,
        html: htmlMessage,
      };
      break;

    case constants.EVENTS.FORGOT_PASSWORD:
      mailOptions = {
        from: constants.ENV.EMAIL_USER,
        to: request_users,
        subject: subject || "Password Reset Instructions",
        text: message || "Please follow the instructions to reset your password.",
        html: htmlMessage,
      };
      break;

    case constants.EVENTS.PROXY_ATTENDANCE_DETECTED:
     const proxyData = request_user; 
  const defaultProxyHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background: #ff6b35; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #ff6b35; }
        .employee-card { background: #fff; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 10px 0; }
        .proxy { border-left: 4px solid #ff4444; }
        .actual { border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 15px; background: #f1f1f1; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 PROXY ATTENDANCE DETECTED</h2>
          <p>Employee cancelled proxy attempt</p>
        </div>
        
        <div class="content">
          <div class="section">
            <p><strong>UUID:</strong> ${proxyData?.uuid || 'N/A'}</p>
            <p><strong>Timestamp:</strong> ${proxyData?.timestamp ? new Date(proxyData.timestamp).toLocaleString() : new Date().toLocaleString()}</p>
            <p><strong>Action:</strong> ${proxyData?.action_taken || 'cancelled_by_user'}</p>
            <p><strong>Confidence Level:</strong> ${proxyData?.confidence || 0}%</p>
          </div>

          <div class="section">
            <h3>👤 Proxy Employee (System Recognized)</h3>
            <div class="employee-card proxy">
              <p><strong>Employee Code:</strong> ${proxyData?.proxy_employee_code || 'N/A'}</p>
              <p><strong>Name:</strong> ${proxyData?.proxy_employee_name || 'N/A'}</p>
              <p><strong>Department:</strong> ${proxyData?.proxy_department || 'N/A'}</p>
            </div>
          </div>
          ${proxyData?.s3_image_url ? `
          <div class="section">
            <h3>👥 Actual Employee (Who Cancelled)</h3>
            <h3>🖼️ Captured Image</h3>
            <p><strong>S3 URL:</strong> <a href="${proxyData.s3_image_url}" target="_blank">View Image</a></p>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This is an automated alert from the Face Recognition Attendance System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  mailOptions = {
    from: constants.ENV.EMAIL_USER,
    to: request_users, 
    cc: [
      "thexplorare111@gmail.com",
    ],
    subject: subject || `🚨 PROXY ATTENDANCE DETECTED - ${proxyData?.timestamp ? new Date(proxyData.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}`,
    html: htmlMessage || defaultProxyHtml,
    attachments: attachments || [],
  };
  break;

    default:
      console.warn(`Unhandled event type: ${event}`);
      return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully for event: ${event}`);
  } catch (error) {
    console.error(`Failed to send email for event: ${event}`, error);
  }
};

