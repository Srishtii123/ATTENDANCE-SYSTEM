import * as dotenv from "dotenv";
import axios from "axios";
import { randomUUID } from "crypto";
import { sequelize } from "../database/connection";
import EmployeeFace from "../models/Attendance/employee_face";
import EmployeeFaceArcface from "../models/Attendance/employee_face_arcface";
import Employee from "../models/Attendance/employee";
import { S3Service } from "../services/s3Upload.service";
import logger from "../utils/logger";

dotenv.config();

const numberFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

type FaceServiceResponse = {
  embedding: number[];
  model?: string;
  detectionScore?: number;
  quality?: { score?: number };
};

const extractArcfaceDescriptor = async (imageBuffer: Buffer): Promise<FaceServiceResponse> => {
  const baseUrl = String(process.env.FACE_SERVICE_URL || "http://face-service:8000").replace(/\/$/, "");
  const response = await axios.post(
    `${baseUrl}/extract-base64`,
    { imageBase64: imageBuffer.toString("base64") },
    { timeout: numberFromEnv("FACE_SERVICE_TIMEOUT_MS", 3500) }
  );

  const data = response.data as FaceServiceResponse;
  if (!Array.isArray(data.embedding) || data.embedding.length !== 512) {
    throw new Error(
      `Invalid ArcFace embedding length: ${Array.isArray(data.embedding) ? data.embedding.length : "missing"}`
    );
  }
  if (!data.embedding.every((value) => Number.isFinite(value))) {
    throw new Error("ArcFace embedding contains non-finite values");
  }

  return data;
};

const downloadFromS3 = async (s3Key: string): Promise<Buffer> => {
  const url = await S3Service.getSignedUrl(s3Key);
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data as ArrayBuffer);
};

const main = async (): Promise<void> => {
  await sequelize.authenticate();
  logger.info("Database connection established for ArcFace migration");

  const companyCode = process.env.MIGRATE_COMPANY_CODE;
  if (!companyCode) {
    throw new Error(
      "MIGRATE_COMPANY_CODE is required — EmployeeFaceArcface.company_code is NOT NULL " +
        "and there is no other source for it in the converted schema. See flag #1 at the top of this file."
    );
  }

  const limit = numberFromEnv("MIGRATE_LIMIT", 0);
  const dryRun = String(process.env.MIGRATE_DRY_RUN || "false").toLowerCase() === "true";
  const orderDirection = String(process.env.MIGRATE_ORDER || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";

  const oldFaces = await EmployeeFace.findAll({
    where: { is_active: true },
    order: [["created_at", orderDirection]],
    ...(limit > 0 ? { limit } : {}),
  });

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  logger.info(
    `ArcFace migration started. faces=${oldFaces.length}, dryRun=${dryRun}, companyCode=${companyCode}, order=${orderDirection}`
  );

  for (const oldFace of oldFaces as any[]) {
    try {
      const existing = await EmployeeFaceArcface.findOne({
        where: { source_face_id: oldFace.id },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const imageBuffer = await downloadFromS3(oldFace.s3_key);
      const result = await extractArcfaceDescriptor(imageBuffer);
      const employee = await Employee.findOne({
        where: { employee_id: oldFace.employee_id },
        attributes: ["employee_code"],
      });

      if (!dryRun) {
        await EmployeeFaceArcface.create({
          id: randomUUID(),
          company_code: companyCode,
          employee_id: oldFace.employee_id,
          employee_code: employee?.employee_code || null,
          source_face_id: oldFace.id,
          s3_key: oldFace.s3_key,
          descriptor: JSON.stringify(result.embedding),
          descriptor_dim: 512,
          model_name: result.model || process.env.INSIGHTFACE_MODEL_NAME || "buffalo_s",
          quality_score: result.quality?.score ?? null,
          detection_score: result.detectionScore ?? null,
          is_active: 1,
          created_at: new Date(),
          migrated_at: new Date(),
        });
      }

      migrated++;
      logger.info(`Migrated face ${oldFace.id} for employee ${oldFace.employee_id}`);
    } catch (error: any) {
      failed++;
      logger.error(`ArcFace migration failed for face ${oldFace.id}, employee ${oldFace.employee_id}`, {
        s3Key: oldFace.s3_key,
        error: error?.message || error,
      });
    }
  }

  logger.info(`ArcFace migration finished. migrated=${migrated}, skipped=${skipped}, failed=${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
};

main()
  .catch((error) => {
    logger.error("ArcFace migration crashed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch((error) => logger.warn("Failed to close DB connection", error));
  });
  
  
  
  
  
  
  
  
  // import "reflect-metadata";
// import * as dotenv from "dotenv";
// import axios from "axios";
// import { randomUUID } from "crypto";
// import { initializeAllConnections, closeAllConnections, AppDataSource } from "../database/connection";
// import { EmployeeFace } from "../entity/Attendance/employee_face.entity";
// import { EmployeeFaceArcface } from "../entity/Attendance/employee_face_arcface.entity";
// import { Employee } from "../entity/Attendance/employee.entity";
// import { downloadFileBuffer } from "../services/ociUpload.service";
// import logger from "../utils/logger";

// dotenv.config();

// const numberFromEnv = (name: string, fallback: number): number => {
//   const value = Number(process.env[name]);
//   return Number.isFinite(value) ? value : fallback;
// };

// type FaceServiceResponse = {
//   embedding: number[];
//   model?: string;
//   detectionScore?: number;
//   quality?: {
//     score?: number;
//   };
// };

// const extractArcfaceDescriptor = async (imageBuffer: Buffer): Promise<FaceServiceResponse> => {
//   const baseUrl = String(process.env.FACE_SERVICE_URL || "http://face-service:8000").replace(/\/$/, "");
//   const response = await axios.post(
//     `${baseUrl}/extract-base64`,
//     { imageBase64: imageBuffer.toString("base64") },
//     { timeout: numberFromEnv("FACE_SERVICE_TIMEOUT_MS", 3500) }
//   );

//   const data = response.data as FaceServiceResponse;
//   if (!Array.isArray(data.embedding) || data.embedding.length !== 512) {
//     throw new Error(`Invalid ArcFace embedding length: ${Array.isArray(data.embedding) ? data.embedding.length : "missing"}`);
//   }
//   if (!data.embedding.every((value) => Number.isFinite(value))) {
//     throw new Error("ArcFace embedding contains non-finite values");
//   }

//   return data;
// };

// const main = async (): Promise<void> => {
//   await initializeAllConnections();

//   const oldFaceRepo = AppDataSource.getRepository(EmployeeFace);
//   const arcfaceRepo = AppDataSource.getRepository(EmployeeFaceArcface);
//   const employeeRepo = AppDataSource.getRepository(Employee);

//   const companyCode = process.env.MIGRATE_COMPANY_CODE;
//   const limit = numberFromEnv("MIGRATE_LIMIT", 0);
//   const dryRun = String(process.env.MIGRATE_DRY_RUN || "false").toLowerCase() === "true";
//   const orderDirection = String(process.env.MIGRATE_ORDER || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";

//   const oldFaces = await oldFaceRepo.find({
//     where: companyCode ? { is_active: "1", company_code: companyCode } : { is_active: "1" },
//     order: { created_at: orderDirection },
//     ...(limit > 0 ? { take: limit } : {}),
//   });

//   let migrated = 0;
//   let skipped = 0;
//   let failed = 0;

//   logger.info(`ArcFace migration started. faces=${oldFaces.length}, dryRun=${dryRun}, company=${companyCode || "ALL"}, order=${orderDirection}`);

//   for (const oldFace of oldFaces) {
//     try {
//       const existing = await arcfaceRepo.findOne({
//         where: {
//           source_face_id: oldFace.id,
//           company_code: oldFace.company_code,
//         },
//       });

//       if (existing) {
//         skipped++;
//         continue;
//       }

//       const imageBuffer = await downloadFileBuffer(oldFace.s3_key);
//       const result = await extractArcfaceDescriptor(imageBuffer);
//       const employee = await employeeRepo.findOne({
//         where: {
//           employee_id: oldFace.employee_id,
//           company_code: oldFace.company_code,
//         },
//         select: ["employee_code"],
//       });

//       if (!dryRun) {
//         const arcface = arcfaceRepo.create({
//           id: randomUUID(),
//           company_code: oldFace.company_code,
//           employee_id: oldFace.employee_id,
//           employee_code: employee?.employee_code || null,
//           source_face_id: oldFace.id,
//           s3_key: oldFace.s3_key,
//           descriptor: JSON.stringify(result.embedding),
//           descriptor_dim: 512,
//           model_name: result.model || process.env.INSIGHTFACE_MODEL_NAME || "buffalo_s",
//           quality_score: result.quality?.score ?? null,
//           detection_score: result.detectionScore ?? null,
//           is_active: 1,
//           created_at: new Date(),
//           migrated_at: new Date(),
//         });
//         await arcfaceRepo.save(arcface);
//       }

//       migrated++;
//       logger.info(`Migrated face ${oldFace.id} for employee ${oldFace.employee_id}`);
//     } catch (error: any) {
//       failed++;
//       logger.error(`ArcFace migration failed for face ${oldFace.id}, employee ${oldFace.employee_id}`, {
//         s3Key: oldFace.s3_key,
//         error: error?.message || error,
//       });
//     }
//   }

//   logger.info(`ArcFace migration finished. migrated=${migrated}, skipped=${skipped}, failed=${failed}`);

//   if (failed > 0) {
//     process.exitCode = 1;
//   }
// };

// main()
//   .catch((error) => {
//     logger.error("ArcFace migration crashed", error);
//     process.exitCode = 1;
//   })
//   .finally(async () => {
//     await closeAllConnections().catch((error) => logger.warn("Failed to close DB connections", error));
//   });



