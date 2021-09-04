var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/questions_controller');

// Index
router.get('/', controller.getPageContent);
router.get('/print', controller.getPrintContent);

router.post('/edit_item', controller.editItem);
router.post('/get_questions', controller.getQuestions);

module.exports = router;
