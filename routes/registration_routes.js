var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/registration_controller');

// Index
router.get('/', controller.getPageContent);

router.post('/', controller.edit);

module.exports = router;
