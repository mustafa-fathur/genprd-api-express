const express = require('express');
const router = express.Router();
const prdController = require('../controllers/prd.controller');

router.get('/', prdController.getAllPRDs);
router.get('/:id', prdController.getPRDById);
router.post('/', prdController.createPRD);
router.put('/:id', prdController.updatePRD);
router.delete('/:id', prdController.deletePRD);
router.patch('/:id/archive', prdController.archivePRD);
router.get('/:id/download', prdController.downloadPRD);

module.exports = router;
