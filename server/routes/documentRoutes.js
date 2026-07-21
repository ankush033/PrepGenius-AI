const express=require("express");

const router=express.Router();

const auth=require("../middleware/authMiddleware");

const upload=require("../middleware/uploadMiddleware");

const {
  uploadDocument,
  getDocuments,
  deleteDocument,
} = require("../controllers/documentController");

router.post(

"/upload",auth,upload.single("pdf"),

uploadDocument

);
router.get("/", auth, getDocuments);

router.delete("/:id", auth, deleteDocument);
module.exports=router;