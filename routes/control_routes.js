var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/control_controller');

// Index
router.get('/', controller.getPageContent);


router.post('/get_questions', controller.getQuestions);

module.exports = router;
