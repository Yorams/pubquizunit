var express = require('express');
var router = express.Router();

// Controllers
var controller = require('../controllers/auth_controller');

// Index
router.get('/list', controller.getUserListContent);

router.post('/list', controller.getUserList);

router.post('/edit', controller.editUser);
router.post('/delete', controller.deleteUser);

module.exports = router;
