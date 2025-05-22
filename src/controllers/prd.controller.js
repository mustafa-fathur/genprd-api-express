const { PRD } = require('../models');

// Get all PRDs for a user
const getAllPRDs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const prds = await PRD.findAll({
      where: { user_id: userId },
      order: [['updated_at', 'DESC']]
    });
    
    return res.status(200).json({
      status: 'success',
      data: prds
    });
  } catch (err) {
    console.error('Error getting PRDs:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get PRDs',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get a single PRD by ID
const getPRDById = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
    const prd = await PRD.findOne({
      where: { 
        id: prdId,
        user_id: userId
      }
    });
    
    if (!prd) {
      return res.status(404).json({
        status: 'error',
        message: 'PRD not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: prd
    });
  } catch (err) {
    console.error('Error getting PRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get PRD',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create a new PRD
const createPRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      product_name,
      document_version,
      document_stage,
      project_overview,
      start_date,
      end_date,
      document_owners,
      developers,
      stakeholders,
      darci_roles,
      generated_sections,
      timeline
    } = req.body;
    
    // Validate required fields
    if (!product_name || !project_overview || !start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }
    
    const newPRD = await PRD.create({
      user_id: userId,
      product_name,
      document_version: document_version || '1.0',
      document_stage: document_stage || 'draft',
      project_overview,
      start_date,
      end_date,
      document_owners: document_owners || [],
      developers: developers || [],
      stakeholders: stakeholders || [],
      darci_roles: darci_roles || {},
      generated_sections: generated_sections || {},
      timeline: timeline || {}
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'PRD created successfully',
      data: newPRD
    });
  } catch (err) {
    console.error('Error creating PRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create PRD',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update an existing PRD
const updatePRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
    const prd = await PRD.findOne({
      where: { 
        id: prdId,
        user_id: userId
      }
    });
    
    if (!prd) {
      return res.status(404).json({
        status: 'error',
        message: 'PRD not found'
      });
    }
    
    // Update fields
    const updatedData = {};
    
    // Only update fields that are provided
    const allowedFields = [
      'product_name', 'document_version', 'document_stage', 
      'project_overview', 'start_date', 'end_date', 'document_owners', 
      'developers', 'stakeholders', 'darci_roles', 'generated_sections', 'timeline'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    });
    
    await prd.update(updatedData);
    
    return res.status(200).json({
      status: 'success',
      message: 'PRD updated successfully',
      data: prd
    });
  } catch (err) {
    console.error('Error updating PRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update PRD',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete a PRD
const deletePRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
    const prd = await PRD.findOne({
      where: { 
        id: prdId,
        user_id: userId
      }
    });
    
    if (!prd) {
      return res.status(404).json({
        status: 'error',
        message: 'PRD not found'
      });
    }
    
    await prd.destroy();
    
    return res.status(200).json({
      status: 'success',
      message: 'PRD deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting PRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete PRD',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAllPRDs,
  getPRDById,
  createPRD,
  updatePRD,
  deletePRD
};