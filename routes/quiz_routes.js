var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/quiz_controller');

// Index
router.get('/', controller.getPageContent);
router.get('/:guid', controller.getPageContent);

router.post('/submitanswer', controller.submitAnswer);

module.exports = router;
