import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database/connection";
import constants from "../../helpers/constants";
import { Employee } from "./associations";

export const AttendanceRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

// Extend Model with typed properties
class AttendanceRequest extends Model {
  public id!: string;
  public company_code!: string;
  public employee_id!: string;
  public employee_code!: string;
  public requested_by!: string | null;
  public event_type!: string;
  public event_time!: Date;
  public s3_image_key!: string | null;
  public status!: string;
  public approved_by!: string | null;
  public rejected_by!: string | null;
  public approved_at!: Date | null;
  public notes!: string | null;
  public created_at!: Date;
}

AttendanceRequest.init(
  {
    id: {
      field: "ID",
      type: DataTypes.STRING(36),
      primaryKey: true,
    },
    company_code: {
      field: "COMPANY_CODE",
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    employee_id: {
      field: "EMPLOYEE_ID",
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    employee_code: {
      field: "EMPLOYEE_CODE",
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    requested_by: {
      field: "REQUESTED_BY",
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    event_type: {
      field: "EVENT_TYPE",
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    event_time: {
      field: "EVENT_TIME",
      type: DataTypes.DATE,
      allowNull: false,
    },
    s3_image_key: {
      field: "S3_IMAGE_KEY",
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      field: "STATUS",
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "CANCELLED"),
      defaultValue: AttendanceRequestStatus.PENDING,
    },
    approved_by: {
      field: "APPROVED_BY",
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rejected_by: {
      field: "REJECTED_BY",
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    approved_at: {
      field: "APPROVED_AT",
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      field: "NOTES",
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    created_at: {
      field: "CREATED_AT",
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: constants.TABLE.attendance_requests,
    timestamps: false,
    indexes: [
      { fields: ["employee_id", "company_code"] },
      { fields: ["company_code"] },
    ],
  }
);

AttendanceRequest.belongsTo(Employee, {
  foreignKey: "employee_id",
  targetKey: "employee_id",
  as: "employee",  // ✅ add 'as' to match your include alias in the service
});

export default AttendanceRequest;