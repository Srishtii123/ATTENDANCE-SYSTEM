// Import required modules and controllers
import * as express from "express";
import passport from "passport";
import {
  getLogs, // Controller to retrieve logs
  getUnReadLogsCount, // Controller to retrieve unread logs count
  updateReadLog, // Controller to update read log
} from "../controllers/log.controller";
import { checkUserAuthorization } from "../middleware/checkUserAthorization"; // Middleware to check user authorization

// Create a new router instance
const router = express.Router();

// Define route to retrieve logs
router.get(
  "/", // Base route
  passport.authenticate("jwt", { session: false }), // Authenticate using JWT
  checkUserAuthorization, // Check user authorization
  getLogs // Call getLogs controller
);

// Define route to retrieve unread logs count
router.get(
  "/read", // Route to retrieve unread logs count
  passport.authenticate("jwt", { session: false }), // Authenticate using JWT
  checkUserAuthorization, // Check user authorization
  getUnReadLogsCount // Call getUnReadLogsCount controller
);

// Define route to update read log
router.put(
  "/allRead", // Route to update read log
  passport.authenticate("jwt", { session: false }), // Authenticate using JWT
  checkUserAuthorization, // Check user authorization
  updateReadLog // Call updateReadLog controller
);

// Export the router instance
export default router;