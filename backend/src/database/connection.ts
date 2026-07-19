import { Sequelize } from "sequelize";
import constants from "../helpers/constants";

export const sequelize = new Sequelize(
  constants.DATABASE.NAME,
  constants.DATABASE.USER,
  constants.DATABASE.PASSWORD,

  {
    host: constants.DATABASE.HOST,
    dialect: "mysql",
    timezone: "+00:00",
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 7200000,
    },
    dialectOptions: {
      connectTimeout: 60000,
      typeCast: true,
      supportBigNumbers: true,
      dateStrings: true,
    },
  }
);

// export const databaseConnection = () => {
//   return new Promise((resolve, reject) => {
//     sequelize
//       .authenticate()
//       .then(async () => {
//         // Set MySQL session timeouts after connection
//         await sequelize.query("SET SESSION wait_timeout = 7200");
//         await sequelize.query("SET SESSION interactive_timeout = 7200");
//         console.log(`SELECT * FROM ${constants.DATABASE.NAME}.sec_login`);
//         console.log("✅ Database Connected");
//         resolve(true);
//       })
//       .catch((error) => {
//         reject(error);
//       });
//   });
// };



export const databaseConnection = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .authenticate()
      .then(async () => {
        // Set MySQL session timeouts
        await sequelize.query("SET SESSION wait_timeout = 7200");
        await sequelize.query("SET SESSION interactive_timeout = 7200");

        // ✅ Execute query to verify connection and log results

        const [results] = await sequelize.query(
       `SELECT * FROM ${constants.DATABASE.NAME}.sec_login `
      );

     console.log(results);

        console.log("✅ Database Connected & Query Working");
        resolve(true);
      })
      .catch((error) => {
        console.error("❌ DB Connection Error:", error);
        reject(error);
      });
  });
};
