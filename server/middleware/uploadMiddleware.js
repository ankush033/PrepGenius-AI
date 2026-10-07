const multer=require("multer");
const path=require("path");
const fs=require("fs/promises");

const MAX_FILE_SIZE = 100 * 1024 * 1024;

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
    if (file.originalname.toLowerCase().endsWith(".pdf")) {
        cb(null, true);
    } else {
        const error = new Error("Only PDF files are allowed.");
        error.status = 400;
        cb(error);
    }
};

const parseUpload = multer({

storage,
fileFilter,
limits: {
    fileSize: MAX_FILE_SIZE,
},

}).single("pdf");

// Multer's fileFilter only sees client-supplied metadata. Check the bytes
// after Multer has written the file so a renamed non-PDF is rejected too.
const validatePdfUpload = (req, res, next) => {
    parseUpload(req, res, async (uploadError) => {
        if (uploadError) {
            const tooLarge = uploadError.code === "LIMIT_FILE_SIZE";
            return res.status(tooLarge ? 413 : uploadError.status || 400).json({
                success: false,
                message: tooLarge
                    ? "PDF must be 100 MB or smaller."
                    : uploadError.message || "File upload failed.",
            });
        }

        if (!req.file) return next();

        try {
            const handle = await fs.open(req.file.path, "r");
            let header;
            try {
                header = Buffer.alloc(1024);
                const { bytesRead } = await handle.read(header, 0, header.length, 0);
                header = header.subarray(0, bytesRead);
            } finally {
                await handle.close();
            }

            // PDF files identify themselves with %PDF- near the start of the file.
            const signaturePosition = header.indexOf(Buffer.from("%PDF-"));
            if (signaturePosition === -1) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(400).json({
                    success: false,
                    message: "The uploaded file does not contain a valid PDF signature.",
                });
            }

            return next();
        } catch (error) {
            await fs.unlink(req.file.path).catch(() => {});
            return res.status(500).json({
                success: false,
                message: "Unable to validate the uploaded PDF.",
            });
        }
    });
};

// documentRoutes uses the standard Multer `upload.single("pdf")` form.
// Return the middleware that performs the Multer upload and PDF validation.
module.exports = {
    single: (fieldName) => {
        if (fieldName !== "pdf") {
            throw new Error('This upload middleware only accepts the "pdf" field.');
        }
        return validatePdfUpload;
    },
};
