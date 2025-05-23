const { PRD } = require('../models');
const axios = require('axios');
const { generatePRDPDF } = require('../utils/pdf-generator');

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

// Get PRD by ID
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
    console.error('Error getting PRD by ID:', err);
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
    console.log('Starting createPRD function');
    const userId = req.user.id;
    console.log('User ID:', userId);
    
    const {
      product_name,
      document_version,
      project_overview,
      start_date,
      end_date,
      document_owner,
      developer,
      stakeholders,
      darci_roles,
      generate_content = true
    } = req.body;
    
    console.log('Request body parsed successfully');
    
    // Validate required fields
    if (!product_name || !project_overview || !start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    // Initialize with default empty values
    let generatedSections = {};
    let timeline = [];
    
    // Call Flask API to generate PRD content if generate_content is true
    if (generate_content) {
      try {
        // Prepare data for the Flask API
        const flaskPayload = {
          document_version: document_version || '1.0',
          product_name,
          document_owner: document_owner || [],
          developer: developer || [],
          stakeholders: stakeholders || [],
          document_stage: 'draft',
          project_overview,
          darci_roles: darci_roles || {
            decider: [],
            accountable: [],
            responsible: [],
            consulted: [],
            informed: []
          },
          start_date,
          end_date
        };

        console.log('Calling Flask API with payload structure:', Object.keys(flaskPayload));
        
        // Explicitly use the correct Flask URL with the proper port
        // Use process.env.FLASK_URL if available, otherwise use hardcoded 127.0.0.1:8000
        const flaskUrl = process.env.FLASK_URL || 'http://127.0.0.1:8000';
        console.log('Sending request to Flask API:', `${flaskUrl}/api/generate-prd`);
        
        const flaskResponse = await axios.post(
          `${flaskUrl}/api/generate-prd`, 
          flaskPayload,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 180000 // 3 minutes timeout for Gemini generation
          }
        );
        
        console.log('Received response from Flask API with status:', flaskResponse.status);
        console.log('Response data structure:', Object.keys(flaskResponse.data));
        
        // Store the entire response as generated_sections
        generatedSections = flaskResponse.data;
        
        // Extract timeline data if it exists
        if (flaskResponse.data && flaskResponse.data.project_timeline && 
            flaskResponse.data.project_timeline.phases) {
          timeline = flaskResponse.data.project_timeline.phases;
          console.log(`Found ${timeline.length} timeline phases`);
        } else {
          console.log('No timeline data found in response');
        }
      } catch (apiError) {
        console.error('Error calling Flask API:', apiError.message);
        if (apiError.response) {
          console.error('API Response Status:', apiError.response.status);
          console.error('API Response Data:', apiError.response.data);
        } else if (apiError.request) {
          // The request was made but no response was received
          console.error('No response received:', apiError.request._currentUrl);
        }
        // Continue with PRD creation even if AI generation fails
      }
    }
    
    // Process DARCI roles from the Flask response
    let finalDarciRoles = {};
    
    if (generatedSections && generatedSections.darci && generatedSections.darci.roles) {
      console.log('Processing DARCI roles from generated content');
      // Transform the roles array into a structured object
      const roleTypes = ['decider', 'accountable', 'responsible', 'consulted', 'informed'];
      roleTypes.forEach(roleType => {
        const role = generatedSections.darci.roles.find(r => r.name === roleType);
        if (role) {
          finalDarciRoles[roleType] = role.members || [];
        } else {
          finalDarciRoles[roleType] = [];
        }
      });
    } else {
      console.log('Using input DARCI roles');
      // Use the input DARCI roles if there's no generated data
      finalDarciRoles = darci_roles || {
        decider: [],
        accountable: [],
        responsible: [],
        consulted: [],
        informed: []
      };
    }
    
    console.log('Preparing to create PRD record in database');
    
    // Create the PRD record with structured data
    const prdData = {
      user_id: userId,
      product_name: product_name,
      document_version: document_version || '1.0',
      document_stage: 'draft',
      project_overview: project_overview,
      start_date: start_date,
      end_date: end_date,
      document_owners: document_owner || [],
      developers: developer || [],
      stakeholders: stakeholders || [],
      darci_roles: finalDarciRoles,
      generated_sections: generatedSections,
      timeline: timeline
    };
    
    console.log('Creating PRD with data structure:', Object.keys(prdData));
    console.log('Timeline data type:', Array.isArray(prdData.timeline) ? 'array' : typeof prdData.timeline);
    console.log('Generated sections data type:', typeof prdData.generated_sections);
    
    try {
      const newPRD = await PRD.create(prdData);
      console.log('PRD created successfully with ID:', newPRD.id);
      
      return res.status(201).json({
        status: 'success',
        message: 'PRD created successfully',
        data: newPRD
      });
    } catch (dbError) {
      console.error('Database error creating PRD:', dbError);
      // Check for validation errors
      if (dbError.name === 'SequelizeValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error when creating PRD',
          errors: dbError.errors.map(e => ({field: e.path, message: e.message})),
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Database error while creating PRD',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (err) {
    console.error('General error creating PRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create PRD',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update PRD
const updatePRD = async (req, res) => {
  try {
    console.log('Starting updatePRD function');
    const userId = req.user.id;
    const prdId = req.params.id;
    
    // Find the PRD first
    const existingPrd = await PRD.findOne({
      where: { 
        id: prdId,
        user_id: userId 
      }
    });
    
    if (!existingPrd) {
      return res.status(404).json({
        status: 'error',
        message: 'PRD not found'
      });
    }
    
    console.log('Found existing PRD:', existingPrd.id);
    
    const {
      product_name,
      document_version,
      project_overview,
      start_date,
      end_date,
      document_owners,
      developers,
      stakeholders,
      darci_roles,
      generated_sections,
      timeline,
      regenerate_content = false
    } = req.body;
    
    // Prepare update data
    const updateData = {
      document_stage: 'inprogress', // Update stage to inprogress when editing
      updated_at: new Date()
    };
    
    // Only update fields that are provided
    if (product_name !== undefined) updateData.product_name = product_name;
    if (document_version !== undefined) updateData.document_version = document_version;
    if (project_overview !== undefined) updateData.project_overview = project_overview;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (document_owners !== undefined) updateData.document_owners = document_owners;
    if (developers !== undefined) updateData.developers = developers;
    if (stakeholders !== undefined) updateData.stakeholders = stakeholders;
    if (darci_roles !== undefined) updateData.darci_roles = darci_roles;
    if (generated_sections !== undefined) updateData.generated_sections = generated_sections;
    if (timeline !== undefined) updateData.timeline = timeline;
    
    console.log('Update data prepared:', Object.keys(updateData));
    
    // If regenerate_content is true, call Flask API
    if (regenerate_content) {
      console.log('Regenerating content with Flask API');
      try {
        const flaskPayload = {
          document_version: updateData.document_version || existingPrd.document_version,
          product_name: updateData.product_name || existingPrd.product_name,
          document_owner: updateData.document_owners || existingPrd.document_owners,
          developer: updateData.developers || existingPrd.developers,
          stakeholders: updateData.stakeholders || existingPrd.stakeholders,
          document_stage: 'inprogress',
          project_overview: updateData.project_overview || existingPrd.project_overview,
          darci_roles: updateData.darci_roles || existingPrd.darci_roles,
          start_date: updateData.start_date || existingPrd.start_date,
          end_date: updateData.end_date || existingPrd.end_date
        };
        
        const flaskUrl = process.env.FLASK_URL || 'http://127.0.0.1:8000';
        console.log('Calling Flask API for content regeneration');
        
        const flaskResponse = await axios.post(
          `${flaskUrl}/api/generate-prd`,
          flaskPayload,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 180000
          }
        );
        
        if (flaskResponse.status === 200) {
          console.log('Flask API regeneration successful');
          updateData.generated_sections = flaskResponse.data;
          
          // Extract timeline if available
          if (flaskResponse.data && flaskResponse.data.project_timeline && 
              flaskResponse.data.project_timeline.phases) {
            updateData.timeline = flaskResponse.data.project_timeline.phases;
          }
        }
      } catch (apiError) {
        console.error('Error regenerating content:', apiError.message);
        // Continue with update even if regeneration fails
      }
    }
    
    // Update the PRD
    await PRD.update(updateData, {
      where: { 
        id: prdId,
        user_id: userId 
      }
    });
    
    // Fetch the updated PRD
    const updatedPrd = await PRD.findByPk(prdId);
    
    console.log('PRD updated successfully');
    
    return res.status(200).json({
      status: 'success',
      message: regenerate_content ? 'PRD updated with regenerated content' : 'PRD updated successfully',
      data: updatedPrd
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

// Delete PRD
const deletePRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
    console.log(`Attempting to delete PRD ${prdId} for user ${userId}`);
    
    // Find the PRD first to ensure it exists and belongs to the user
    const prd = await PRD.findOne({
      where: { 
        id: prdId,
        user_id: userId 
      }
    });
    
    if (!prd) {
      return res.status(404).json({
        status: 'error',
        message: 'PRD not found or you do not have permission to delete it'
      });
    }
    
    // Delete the PRD
    await PRD.destroy({
      where: { 
        id: prdId,
        user_id: userId 
      }
    });
    
    console.log(`PRD ${prdId} deleted successfully`);
    
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

// Archive PRD
const archivePRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
    console.log(`Attempting to archive PRD ${prdId} for user ${userId}`);
    
    // Find the PRD first
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
    
    // Check if already archived
    if (prd.document_stage === 'archived') {
      return res.status(400).json({
        status: 'error',
        message: 'PRD is already archived'
      });
    }
    
    // Update document stage to archived
    await PRD.update(
      { 
        document_stage: 'archived',
        updated_at: new Date()
      },
      {
        where: { 
          id: prdId,
          user_id: userId 
        }
      }
    );
    
    // Fetch the updated PRD
    const archivedPrd = await PRD.findByPk(prdId);
    
    console.log(`PRD ${prdId} archived successfully`);
    
    return res.status(200).json({
      status: 'success',
      message: 'PRD archived successfully',
      data: archivedPrd
    });
  } catch (err) {
    console.error('Error archiving PRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to archive PRD',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Download PRD as PDF/document
const downloadPRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
    console.log(`Starting PDF download for PRD ${prdId} by user ${userId}`);
    
    // Find the PRD
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
    
    console.log('PRD found, current stage:', prd.document_stage);
    
    // Update document stage to 'finished' when downloading
    if (prd.document_stage !== 'finished') {
      await PRD.update(
        { 
          document_stage: 'finished',
          updated_at: new Date()
        },
        {
          where: { 
            id: prdId,
            user_id: userId 
          }
        }
      );
      console.log('PRD stage updated to finished');
    }
    
    // Generate PDF
    try {
      console.log('Generating PDF...');
      const pdfResult = await generatePRDPDF(prd.toJSON());
      
      console.log('PDF generated successfully:', pdfResult.url);
      
      return res.status(200).json({
        status: 'success',
        message: 'PDF generated successfully',
        data: {
          download_url: pdfResult.url, // This will be signed URL or public URL
          public_url: pdfResult.publicUrl, // Alternative public URL
          file_name: pdfResult.fileName,
          gcs_path: pdfResult.gcsPath,
          prd_id: prdId,
          generated_at: new Date().toISOString(),
          expires_at: pdfResult.expiresAt // Only present if using signed URLs
        }
      });
      
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate PDF',
        error: process.env.NODE_ENV === 'development' ? pdfError.message : undefined
      });
    }
    
  } catch (err) {
    console.error('Error in downloadPRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process download request',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAllPRDs,
  getPRDById,
  createPRD,
  updatePRD,
  deletePRD,
  archivePRD,
  downloadPRD
};