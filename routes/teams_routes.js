var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/teams_controller');

// Index
router.get('/', controller.getPageContent);

router.post('/list', controller.getList);
router.post('/edit', controller.edit);
router.post('/delete', controller.delete);

module.exports = router;
