var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/index_controller');

// Index
router.get('/', controller.getPageContent);

module.exports = router;
