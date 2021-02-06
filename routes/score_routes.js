var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/score_controller');

// Index
router.get('/', controller.getPageContent);
router.get('/top', controller.getTopPageContent);
router.get('/topvideo', controller.getTopVideoPageContent);


router.post('/getScore', controller.getScore);

module.exports = router;
