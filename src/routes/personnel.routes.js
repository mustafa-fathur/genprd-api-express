const express = require('express');
const router = express.Router();
const personnelController = require('../controllers/personnel.controller');

router.get('/', personnelController.getAllPersonnel);
router.get('/:id', personnelController.getPersonnelById);
router.post('/', personnelController.createPersonnel);
router.put('/:id', personnelController.updatePersonnel);
router.delete('/:id', personnelController.deletePersonnel);

module.exports = router;
