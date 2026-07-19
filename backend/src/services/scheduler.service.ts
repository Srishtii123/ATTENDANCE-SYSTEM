import { sequelize } from "../database/connection";
import { QueryTypes } from "sequelize";
import { VendorService } from "./vendor.service";
import cron from "node-cron";

export class SchedulerService {
  static async processUnsentVendorData() {
    try {
      // Get unsent header records
      const unsentHeaders = await sequelize.query(
        `
        SELECT * FROM TR_AC_LPO_HEADER 
        WHERE LAST_ACTION = 'SUBMITTED' 
        AND DATA_TRANSFER = 'N'
      `,
        { type: QueryTypes.SELECT }
      );

      type Header = {
        COMPANY_CODE: string;
        DOC_NO: string;
        [key: string]: any;
      };

      for (const headerObj of unsentHeaders) {
        const header = headerObj as Header;
        try {
          // Send header data
          await VendorService.insertAcHeader(header);

          // Get and send related detail records
          const details = await sequelize.query(
            `
            SELECT * FROM TR_AC_LPO_DETAIL 
            WHERE COMPANY_CODE = :companyCode 
            AND DOC_NO = :docNo
          `,
            {
              replacements: {
                companyCode: header.COMPANY_CODE,
                docNo: header.DOC_NO,
              },
              type: QueryTypes.SELECT,
            }
          );

          for (const detail of details) {
            await VendorService.insertAcDetail(detail);
          }

          // Update transfer flag
          await VendorService.updateDataTransferFlag(
            header.COMPANY_CODE,
            header.DOC_NO
          );

          console.log(`Successfully processed document ${header.DOC_NO}`);
        } catch (error) {
          console.error(`Error processing document ${header.DOC_NO}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error("Error in vendor scheduler process:", error);
    }
  }

  static initializeScheduler() {
    // Run vendor data sync every 6 hours
    cron.schedule("0 */6 * * *", async () => {
      console.log("Running vendor data transfer check...");
      await this.processUnsentVendorData();
    });

    console.log("Scheduler initialized");
  }
}
