const express = require('express');
const router = express.Router();
const prdController = require('../controllers/prd.controller');

router.get('/', prdController.getAllPRDs);
router.get('/:id', prdController.getPRDById);
router.post('/', prdController.createPRD);
router.put('/:id', prdController.updatePRD);
router.delete('/:id', prdController.deletePRD);

module.exports = router;
