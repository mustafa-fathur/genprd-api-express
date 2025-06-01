const express = require('express');
const router = express.Router();
const prdController = require('../controllers/prd.controller');

// PERBAIKAN: Route spesifik harus berada di ATAS route dengan parameter :id
// Route spesifik seperti /recent dan /dashboard
router.get('/recent', prdController.getRecentPRDs);

// Endpoint untuk koleksi (collection endpoints)
router.get('/', prdController.getAllPRDs);
router.post('/', prdController.createPRD);

// Endpoint untuk item spesifik (item endpoints)
router.get('/:id', prdController.getPRDById);
router.put('/:id', prdController.updatePRD);
router.delete('/:id', prdController.deletePRD);
router.patch('/:id/archive', prdController.archivePRD);
router.patch('/:id/pin', prdController.togglePinPRD);
router.patch('/:id/stage', prdController.updatePRDStage);
router.get('/:id/download', prdController.downloadPRD);

module.exports = router;
