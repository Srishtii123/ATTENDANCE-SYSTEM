import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database/connection";
import constants from "../../helpers/constants";

export interface IEmployeeFaceArcface extends Model {
  id: string;
  company_code: string;
  employee_id: string;
  employee_code: string | null;
  source_face_id: string | null;
  s3_key: string;
  descriptor: string;
  descriptor_dim: number;
  model_name: string;
  quality_score: number | null;
  detection_score: number | null;
  is_active: 0 | 1;
  created_at: Date;
  migrated_at: Date | null;
}

const EmployeeFaceArcface = sequelize.define<IEmployeeFaceArcface>(
  constants.TABLE.EMPLOYEE_FACE_ARCFACE,
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      field: "ID",
    },
    company_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "COMPANY_CODE",
    },
    employee_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "EMPLOYEE_ID",
    },
    employee_code: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: "EMPLOYEE_CODE",
    },
    source_face_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: "SOURCE_FACE_ID",
    },
    s3_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "S3_KEY",
    },
    descriptor: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      field: "DESCRIPTOR",
    },
    descriptor_dim: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 512,
      field: "DESCRIPTOR_DIM",
    },
    model_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "buffalo_s",
      field: "MODEL_NAME",
    },
    quality_score: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true,
      field: "QUALITY_SCORE",
    },
    detection_score: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true,
      field: "DETECTION_SCORE",
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      field: "IS_ACTIVE",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "CREATED_AT",
    },
    migrated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "MIGRATED_AT",
    },
  },
  {
    tableName: constants.TABLE.EMPLOYEE_FACE_ARCFACE,
    timestamps: false,
    indexes: [
      {
        fields: ["company_code", "employee_id"],
      },
      {
        fields: ["company_code", "is_active"],
      },
    ],
  }
);

export default EmployeeFaceArcface;
