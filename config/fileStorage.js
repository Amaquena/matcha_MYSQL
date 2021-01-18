const multer = require('multer');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './uploads/');
	},
	filename: function (req, file, cb) {
		cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
	}
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg')
		cb(null, true);
	else
		cb("Invalid file type", false);
};

const limits = {
	fileSize: 1024 * 1024 * 5
};

module.exports.storage = storage;
module.exports.limits = limits;
module.exports.fileFilter = fileFilter; 