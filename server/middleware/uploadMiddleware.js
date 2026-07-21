const multer=require("multer");
const path=require("path");

const storage=multer.diskStorage({

destination:function(req,file,cb){

cb(null,"uploads/");

},

filename:function(req,file,cb){

const unique=Date.now()+"-"+Math.round(Math.random()*1E9);

cb(null,unique+path.extname(file.originalname));

}

});

const fileFilter = (req, file, cb) => {

    console.log(file.originalname);
    console.log(file.mimetype);

    if (file.originalname.toLowerCase().endsWith(".pdf")) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF allowed"));
    }
};

module.exports=multer({

storage,
fileFilter

});