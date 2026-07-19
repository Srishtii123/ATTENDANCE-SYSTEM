import * as express from "express";
import multer from "multer";
import passport from "passport";
import {
  deleteFiles,
  editFiles,
  editPFFiles,
  getFiles,
  getpfFiles,
  deleteFilesPF,
  //getHrVendorFiles,
  editHrVendorFiles,
  //deleteHrVendorFiles,
  //getEmployeeFiles,
  editEmployeeFiles,
  //deleteEmployeeFiles,
} from "../controllers/files.controller";
import { checkUserAuthorization } from "../middleware/checkUserAthorization";
import {
  uploadToS3,
  uploadPFToS3,
  uploadVendorAttachmentToS3,
  uploadEmployeeAttachmentToS3,
  deleteEmployeeAttachmentFromS3,
} from "../services/s3Upload.service";
// router for files operations

const router = express.Router();
const upload = multer({
  // store the file in memory
  storage: multer.memoryStorage(),
  // allow all files to be uploaded
  fileFilter(req, file, next) {
    next(null, true);
  },
});
//------------import/export------

//----------file----------
router.get(
  "/:request_number",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  // check if the user has the necessary permissions
  checkUserAuthorization,
  // get the files for the given request number
  getFiles
);

//----------PFfile----------
router.get(
  "/purchaseRequest/:request_number",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  getpfFiles
);

//------Vendor files----------
// router.get(
//   "/vendor/:request_number",
//   passport.authenticate("jwt", { session: false }),
//   checkUserAuthorization,
//   getHrVendorFiles
// );

//------Employee files----------
// router.get(
//   "/employee/:request_number",
//   passport.authenticate("jwt", { session: false }),
//   checkUserAuthorization,
//   getEmployeeFiles
// );

router.put(
  "/editFiles",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  // check if the user has the necessary permissions
  checkUserAuthorization,
  // get the files for the given request number
  editFiles
);

router.put(
  "/editPFFile",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  editPFFiles
);

router.put(
  "/editVendorFile",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  editHrVendorFiles
);

router.put(
  "/editEmployeeFile",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  editEmployeeFiles
);

router.post(
  "/upload",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  // check if the user has the necessary permissions
  checkUserAuthorization,
  // single file upload
  upload.single("file"),
  // upload the file to s3
  uploadToS3
);

router.post(
  "/uploadFilePf",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  // check if the user has the necessary permissions
  checkUserAuthorization,
  // single file upload
  upload.single("file"),
  // upload the file to s3
  uploadPFToS3
);

router.post(
  "/uploadVendorAttachment",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  upload.single("file"),
  uploadVendorAttachmentToS3
);

router.post(
  "/uploadEmployeeAttachment",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  upload.single("file"),
  uploadEmployeeAttachmentToS3
);

router.delete(
  "/delete",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  // check if the user has the necessary permissions
  checkUserAuthorization,
  // delete the files for the given request number
  deleteFiles
);

router.delete(
  "/deletePF/:request_number/:sr_no",
  // authenticate the user using the jwt token
  passport.authenticate("jwt", { session: false }),
  // check if the user has the necessary permissions
  checkUserAuthorization,
  // delete the PF files for the given request number and sr_no
  deleteFilesPF
);

// router.delete(
//   "/deleteVendorAttachment/:request_number/:sr_no",
//   passport.authenticate("jwt", { session: false }),
//   checkUserAuthorization,
//   deleteHrVendorFiles
// );

// router.delete(
//   "/deleteEmployeeAttachment/:emp_id",
//   passport.authenticate("jwt", { session: false }),
//   checkUserAuthorization,
//   deleteEmployeeFiles
// );

export default router;
