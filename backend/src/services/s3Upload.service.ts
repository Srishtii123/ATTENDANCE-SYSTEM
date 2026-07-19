// Import AWS S3 SDK components for file operations
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
// Import application constants including AWS credentials
import constants from "../helpers/constants";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// Import interface defining S3 upload parameters
import { UploadToS3ObjectInterface } from "../interfaces/common.interface";
import logger from "../utils/logger";

const s3Client = new S3Client({
  region: constants.AWS_S3_CREDENTIALS.REGION,
  credentials: {
    accessKeyId: constants.AWS_S3_CREDENTIALS.ACCESS_KEY,
    secretAccessKey: constants.AWS_S3_CREDENTIALS.SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (req: any, res: any) => {
  const file = req.file;

  // Generate dynamic file path using current date (YYYY/MM/filename)
  const fileName: string = `uploads/${new Date().getFullYear()}/${
    new Date().getMonth() + 1
  }/${file.originalname}`;

  // Configure S3 upload parameters
  const objectParams: UploadToS3ObjectInterface = {
    Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(objectParams));

    const URL: string = constants.AWS_S3_CREDENTIALS.AWS_S3_URL(fileName);

    return res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: URL,
    });
  } catch (error: any) {
    return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadPFToS3 = async (req: any, res: any) => {
  const file = req.file;
  const requestNumber = req.body.request_number;
  const requestType = req.body.type;

  const fileName: string = `UploadWorkflow/${requestType}/${new Date().getFullYear()}/${
    new Date().getMonth() + 1
  }/${requestNumber}/${file.originalname}`;

  const objectParams: UploadToS3ObjectInterface = {
    Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(objectParams));

    const URL: string = constants.AWS_S3_CREDENTIALS.AWS_S3_URL(fileName);

    return res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: URL,
    });
  } catch (error: any) {
    return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteFileFromS3 = async (awsFileLocation: string) => {
  const params = {
    Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
    Key: awsFileLocation,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    } else {
      throw new Error("Failed to delete file from S3: Unknown error occurred");
    }
  }
};

// Employee face recognition service to get signed URL for accessing S3 objects
export class S3Service {
  static async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    const objectParams: UploadToS3ObjectInterface = {
      Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
      Key: key,
      Body: buffer,
      ACL: "public-read",
      ContentType: contentType,
    };

    try {
      await s3Client.send(new PutObjectCommand(objectParams));
      logger.info(`File uploaded to S3: ${key}`);
      return this.getFileUrl(key);
    } catch (error) {
      logger.error("S3 upload failed", error);
      throw new Error(constants.MESSAGES.SOMETHING_WENT_WRONG);
    }
  }

  static async uploadEmployeeFace(
    buffer: Buffer,
    employeeId: string,
    originalname: string
  ): Promise<string> {
    const fileName = `employee_faces/${employeeId}/${originalname}`;
    return this.uploadFile(buffer, fileName, "image/jpeg");
  }

  static async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
      Key: key,
    };

    try {
      await s3Client.send(new DeleteObjectCommand(params));
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error("S3 delete failed", error);
      throw new Error("Failed to delete file from S3");
    }
  }

  static getFileUrl(key: string): string {
    return constants.AWS_S3_CREDENTIALS.AWS_S3_URL(key);
  }

  static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
        Key: key,
      });
      // Use type assertion to handle version mismatch
      const presigner = getSignedUrl as unknown as (
        client: S3Client,
        command: GetObjectCommand,
        options: { expiresIn: number }
      ) => Promise<string>;

      return await presigner(s3Client, command, { expiresIn });
    } catch (error) {
      logger.error("Failed to generate signed URL", error);
      throw new Error("Failed to generate signed URL for file");
    }
  }
}
export const uploadVendorAttachmentToS3 = async (req: any, res: any) => {
  const file = req.file;
  const docNo = req.body.doc_no;

  const fileName: string = `VendorDocument/${docNo}/${file.originalname}`;

  const objectParams: UploadToS3ObjectInterface = {
    Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(objectParams));

    const URL: string = constants.AWS_S3_CREDENTIALS.AWS_S3_URL(fileName);

    return res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: URL,
    });
  } catch (error: any) {
    return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteVendorAttachmentFromS3 = async (req: any, res: any) => {
  const docNo = req.params.doc_no;
  const fileName = `VendorDocument/${docNo}`;

  const params = {
    Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
    Key: fileName,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    return res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadEmployeeAttachmentToS3 = async (req: any, res: any) => {
  const file = req.file;
  const requestNumber = req.body.request_number;

  const fileName: string = `LeaveDocument/${requestNumber}/${file.originalname}`;

  const objectParams: UploadToS3ObjectInterface = {
    Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(objectParams));

    const URL: string = constants.AWS_S3_CREDENTIALS.AWS_S3_URL(fileName);

    return res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: URL,
    });
  } catch (error: any) {
    return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteEmployeeAttachmentFromS3 = async (req: any, res: any) => {
  const empId = req.params.emp_id;
  const fileName = `LeaveDocument/${empId}`;

  const params = {
    Bucket: constants.AWS_S3_CREDENTIALS.S3_BUCKET,
    Key: fileName,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    return res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};
