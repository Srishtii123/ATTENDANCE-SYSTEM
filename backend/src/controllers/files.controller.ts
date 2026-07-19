import { Response } from "express";
import { IFiles, RequestWithUser } from "../interfaces/common.interface";
import constants from "../helpers/constants";
import Files from "../models/files.model";
import { deleteFileFromS3 } from "../services/s3Upload.service";
import { sequelize } from "../database/connection";
//import FilesVH from "../models/filesvh.model";

export const getFiles = async (req: RequestWithUser, res: Response) => {
  try {
    // get request_number from req.params
    const { request_number } = req.params;
    // get modules from req.query
    const { modules } = req.query;

    // check if request_number is undefined
    if (request_number === undefined) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: true,
        message: constants.MESSAGES.BAD_REQUEST,
      });
      return;
    }

    // query to get files
    const files = await Files.findAll({
      where:
        modules === "IMPORT"
          ? { modules, request_number }
          : { company_code: req.user.company_code, request_number },
    });

    // send response
    res.status(constants.STATUS_CODES.OK).json({ sucess: true, data: files });

    return;
  } catch (error: any) {
    // handle error
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const getpfFiles = async (req: RequestWithUser, res: Response) => {
  try {
    // get request_number from req.params
    const { request_number } = req.params;
    // get modules from req.query
    const { modules } = req.query;

    // check if request_number is undefined
    if (request_number === undefined) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: true,
        message: constants.MESSAGES.BAD_REQUEST,
      });
      return;
    }

    // query to get files
    const files = await Files.findAll({
      where:
        modules === "IMPORT"
          ? { modules, request_number }
          : { company_code: req.user.company_code, request_number },
    });

    // send response
    res.status(constants.STATUS_CODES.OK).json({ sucess: true, data: files });

    return;
  } catch (error: any) {
    // handle error
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const editFiles = async (req: RequestWithUser, res: Response) => {
  try {
    // get request_number from req.params
    const { aws_file_locn } = req.body;
    // get modules from req.query
    const { user_file_name } = req.query;

    // query to get files
    const files = await Files.update(
      { user_file_name: user_file_name },
      {
        where: { aws_file_locn: aws_file_locn },
      }
    );

    // send response
    res.status(constants.STATUS_CODES.OK).json({ sucess: true, data: files });

    return;
  } catch (error: any) {
    // handle error
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const editPFFiles = async (req: RequestWithUser, res: Response) => {
  try {
    // get request_number and aws_file_locn from req.body
    const { aws_file_locn, request_number, user_file_name } = req.body;
    // get user_file_name from req.query and ensure it's a string
    console.log(user_file_name, aws_file_locn, request_number);
    // execute direct SQL update query
    const [updateCount] = await sequelize.query(
      `UPDATE UPLOADED_FILES_DLTS 
       SET user_file_name = :user_file_name 
       WHERE aws_file_locn = :aws_file_locn AND request_number = :request_number`,
      {
        replacements: { user_file_name, aws_file_locn, request_number },
      }
    );

    // check if any rows were updated
    if (Number(updateCount) === 0) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.FILE_NOT_FOUND,
      });
      return;
    }

    // send response with direct success message
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "File name updated successfully",
    });

    return;
  } catch (error: any) {
    // handle error
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const deleteFiles = async (req: RequestWithUser, res: Response) => {
  try {
    const { request_number, sr_no } = req.params;

    if (request_number === undefined) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: true,
        message: constants.MESSAGES.BAD_REQUEST,
      });
      return;
    }

    // query to delete files
    const deleteOprResponse = await Files.destroy({
      where: { company_code: req.user.company_code, request_number, sr_no },
    });

    // check if delete operation was successful
    if (deleteOprResponse === 0) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: deleteOprResponse,
      });
      return;
    }

    // send response
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.DELETED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    // handle error
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

export const deleteFilesPF = async (req: RequestWithUser, res: Response) => {
  try {
    const { request_number, sr_no } = req.params;

    if (request_number === undefined) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: true,
        message: constants.MESSAGES.BAD_REQUEST,
      });
      return;
    }

    // query to find the file details
    const file = await Files.findOne({
      where: { request_number, sr_no },
    });

    if (!file) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.FILE_NOT_FOUND,
      });
      return;
    }

    // delete the file from AWS S3
    //await deleteFileFromS3(file.aws_file_locn);

    // delete the file record from the database
    const deleteOprResponse = await Files.destroy({
      where: { request_number, sr_no },
    });

    // check if delete operation was successful
    if (deleteOprResponse === 0) {
      res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Delete operation failed",
      });
      return;
    }

    // send response
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: constants.MESSAGES.DELETED_SUCCESSFULLY,
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

//vendor and HR file attachment
// export const getHrVendorFiles = async (req: RequestWithUser, res: Response) => {
//   try {
//     console.log("inside getHrVendorFiles");
//     // get request_number from req.params

//     const { request_number } = req.params;
//     // get modules from req.query
//     const { modules } = req.query;
//     console.log("Request Params:", { request_number, modules });
//     console.log("User Company Code:", req.user.company_code);

//     // check if request_number is undefined
//     if (request_number === undefined) {
//       res.status(constants.STATUS_CODES.BAD_REQUEST).json({
//         success: true,
//         message: constants.MESSAGES.BAD_REQUEST,
//       });
//       return;
//     }

//     // query to get files
//     // const files = await FilesVH.findAll({
//     //   where:
//     //     modules === "IMPORT"
//     //       ? { modules, request_number }
//     //       : { company_code: req.user.company_code, request_number },
//     // });

//     // send response
//     res.status(constants.STATUS_CODES.OK).json({ sucess: true, data: files });

//     return;
//   } catch (error: any) {
//     // handle error
//     res
//       .status(constants.STATUS_CODES.BAD_REQUEST)
//       .json({ success: false, message: error.message });
//     return;
//   }
// };

export const editHrVendorFiles = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    // get request_number and aws_file_locn from req.body
    const { aws_file_locn, request_number, user_file_name } = req.body;
    // get user_file_name from req.query and ensure it's a string
    console.log(user_file_name, aws_file_locn, request_number);
    // execute direct SQL update query
    const [updateCount] = await sequelize.query(
      `UPDATE UPLOADED_FILES_DLTS_VH 
       SET user_file_name = :user_file_name 
       WHERE aws_file_locn = :aws_file_locn AND request_number = :request_number`,
      {
        replacements: { user_file_name, aws_file_locn, request_number },
      }
    );

    // check if any rows were updated
    if (Number(updateCount) === 0) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.FILE_NOT_FOUND,
      });
      return;
    }

    // send response with direct success message
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "File name updated successfully",
    });

    return;
  } catch (error: any) {
    // handle error
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

// export const deleteHrVendorFiles = async (
//   req: RequestWithUser,
//   res: Response
// ) => {
//   try {
//     const { request_number, sr_no } = req.params;

//     if (request_number === undefined) {
//       res.status(constants.STATUS_CODES.BAD_REQUEST).json({
//         success: true,
//         message: constants.MESSAGES.BAD_REQUEST,
//       });
//       return;
//     }

//     // query to find the file details
//     const file = await FilesVH.findOne({
//       where: { request_number, sr_no },
//     });

//     if (!file) {
//       res.status(constants.STATUS_CODES.NOT_FOUND).json({
//         success: false,
//         message: constants.MESSAGES.FILE_NOT_FOUND,
//       });
//       return;
//     }

//     const deleteOprResponse = await FilesVH.destroy({
//       where: { request_number, sr_no },
//     });

//     // check if delete operation was successful
//     if (deleteOprResponse === 0) {
//       res.status(constants.STATUS_CODES.BAD_REQUEST).json({
//         success: false,
//         message: "Delete operation failed",
//       });
//       return;
//     }

//     // send response
//     res.status(constants.STATUS_CODES.OK).json({
//       success: true,
//       message: constants.MESSAGES.DELETED_SUCCESSFULLY,
//     });
//     return;
//   } catch (error: any) {
//     res
//       .status(constants.STATUS_CODES.BAD_REQUEST)
//       .json({ success: false, message: error.message });
//     return;
//   }
// };

// export const getEmployeeFiles = async (req: RequestWithUser, res: Response) => {
//   try {
//     const { request_number } = req.params;
//     const { modules } = req.query;

//     console.log("Request Params:", { request_number, modules });

//     if (request_number === undefined) {
//       res.status(constants.STATUS_CODES.BAD_REQUEST).json({
//         success: true,
//         message: constants.MESSAGES.BAD_REQUEST,
//       });
//       return;
//     }

//     const files = await FilesVH.findAll({
//       where:
//         modules === "IMPORT"
//           ? { modules, request_number }
//           : { company_code: req.user.company_code, request_number },
//     });

//     res.status(constants.STATUS_CODES.OK).json({ sucess: true, data: files });
//     return;
//   } catch (error: any) {
//     res
//       .status(constants.STATUS_CODES.BAD_REQUEST)
//       .json({ success: false, message: error.message });
//     return;
//   }
// };

export const editEmployeeFiles = async (
  req: RequestWithUser,
  res: Response
) => {
  try {
    const { aws_file_locn, request_number, user_file_name } = req.body;

    const [updateCount] = await sequelize.query(
      `UPDATE UPLOADED_FILES_DLTS_VH 
       SET user_file_name = :user_file_name 
       WHERE aws_file_locn = :aws_file_locn AND request_number = :request_number`,
      {
        replacements: { user_file_name, aws_file_locn, request_number },
      }
    );

    if (Number(updateCount) === 0) {
      res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.FILE_NOT_FOUND,
      });
      return;
    }

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "File name updated successfully",
    });
    return;
  } catch (error: any) {
    res
      .status(constants.STATUS_CODES.BAD_REQUEST)
      .json({ success: false, message: error.message });
    return;
  }
};

// export const deleteEmployeeFiles = async (
//   req: RequestWithUser,
//   res: Response
// ) => {
//   try {
//     const { request_number, sr_no } = req.params;

//     if (request_number === undefined) {
//       res.status(constants.STATUS_CODES.BAD_REQUEST).json({
//         success: true,
//         message: constants.MESSAGES.BAD_REQUEST,
//       });
//       return;
//     }

//     const file = await FilesVH.findOne({
//       where: { request_number, sr_no },
//     });

//     if (!file) {
//       res.status(constants.STATUS_CODES.NOT_FOUND).json({
//         success: false,
//         message: constants.MESSAGES.FILE_NOT_FOUND,
//       });
//       return;
//     }

//     const deleteOprResponse = await FilesVH.destroy({
//       where: { request_number, sr_no },
//     });

//     if (deleteOprResponse === 0) {
//       res.status(constants.STATUS_CODES.BAD_REQUEST).json({
//         success: false,
//         message: "Delete operation failed",
//       });
//       return;
//     }

//     res.status(constants.STATUS_CODES.OK).json({
//       success: true,
//       message: constants.MESSAGES.DELETED_SUCCESSFULLY,
//     });
//     return;
//   } catch (error: any) {
//     res
//       .status(constants.STATUS_CODES.BAD_REQUEST)
//       .json({ success: false, message: error.message });
//     return;
//   }
// };
