import { Optional } from "sequelize";

// Main interface defining all fields from the user model
export interface IUser {
  company_code: string;
  loginid: string;
  email_id: string;
  username: string;
  contact_name?: string;
  contact_no?: string;
  contact_email?: string;
  updated_at: Date; // Updated to match the model
  updated_by: string; // Added to match the model
  created_by: string; // Added to match the model
  created_at: Date; // Added to match the model
  userpass: string;
  no_of_days?: number; // Made optional as it may not be required
  active_flag: string; // Added to match the model
  lang_pref: string;
  SEC_PASSWD: string; // Added to match the model
  APPLICATION?: string; // Added to match the model
}

// Interface extending IUser and marking optional fields
export interface UserAttribute
  extends Optional<
    IUser,
    | "contact_name"
    | "contact_no"
    | "contact_email"
    | "updated_at"
    | "created_at"
    | "no_of_days"
  > {}
