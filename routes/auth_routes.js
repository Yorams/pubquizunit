var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/auth_controller');

// Index
router.get('/', controller.getPageContent);
router.get('/logout', controller.logout);

router.post('/', controller.login);

module.exports = router;
