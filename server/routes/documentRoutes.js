const express=require("express");

const router=express.Router();

const auth=require("../middleware/authMiddleware");

const upload=require("../middleware/uploadMiddleware");
const rateLimit=require("../middleware/rateLimit");
const uploadRateLimit=rateLimit({windowMs:60*60*1000,max:10,key:(req)=>`${req.ip}:${req.user?.id||"anonymous"}`});

const {
  uploadDocument,
  getDocuments,
  deleteDocument,
} = require("../controllers/documentController");

router.post(

"/upload",auth,uploadRateLimit,upload.single("pdf"),

uploadDocument

);
router.get("/", auth, getDocuments);

router.delete("/:id", auth, deleteDocument);
module.exports=router;
