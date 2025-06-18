const { PRD, User } = require('../models');
const axios = require('axios');
const { generatePRDPDF } = require('../utils/pdf-generator');
const admin = require('../utils/firebase');
const { Op } = require('sequelize');

// Get all PRDs with improved filtering and pagination
const getAllPRDs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      stage, 
      search,   
      sort = 'updated_at', 
      order = 'DESC',
      all = false // Parameter untuk mengambil semua PRD tanpa pagination
    } = req.query;
    
    // Build where conditions
    const whereConditions = { user_id: userId };
    
    // Filter by document_stage if provided
    if (stage && stage !== 'all') {
      whereConditions.document_stage = stage;
    }
    
    // Add search functionality
    if (search) {
      whereConditions[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { project_overview: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Pagination options
    const options = {
      where: whereConditions,
      order: [[sort, order]],
      attributes: [
        'id', 'product_name', 'document_stage', 'document_version', 
        'project_overview', 'start_date', 'end_date', 'is_pinned', 
        'created_at', 'updated_at', 'last_viewed_at'
      ]
    };
    
    // Add pagination unless all=true
    if (!all) {
      const offset = (page - 1) * limit;
      options.offset = offset;
      options.limit = parseInt(limit);
    }
    
    // Get PRDs with count
    const { count, rows: prds } = await PRD.findAndCountAll(options);
    
    return res.status(200).json({
      status: 'success',
      data: {
        total: count,
        pages: all ? 1 : Math.ceil(count / limit),
        current_page: parseInt(page),
        prds
      }
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

// Get recent PRDs for sidebar
const getRecentPRDs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get pinned PRDs first, then most recently viewed/updated
    const recentPRDs = await PRD.findAll({
      where: { 
        user_id: userId,
        document_stage: { [Op.ne]: 'archived' } // Exclude archived
      },
      order: [
        ['is_pinned', 'DESC'], // Pinned PRDs first
        ['last_viewed_at', 'DESC'], // Then by last viewed
        ['updated_at', 'DESC'] // Then by last updated
      ],
      limit: limit,
      attributes: [
        'id', 'product_name', 'document_stage', 
        'updated_at', 'is_pinned', 'last_viewed_at'
      ]
    });
    
    return res.status(200).json({
      status: 'success',
      data: recentPRDs
    });
  } catch (err) {
    console.error('Error getting recent PRDs:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get recent PRDs',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get PRD by ID with tracking of last viewed
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
    
    // Update last_viewed_at timestamp
    await prd.update({ last_viewed_at: new Date() });
    
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

// Create a new PRD (with Flask API for content generation)
const createPRD = async (req, res) => {
  try {
    console.log('Starting createPRD function');
    const userId = req.user.id;
    console.log('User ID:', userId);
    console.log(process.env.FLASK_URL);
    
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
      generate_content = true,
      document_stage = 'draft' // Default to draft but allow override
    } = req.body;
    
    console.log('Request body parsed successfully');
    console.log('Document owners received:', document_owners);
    console.log('Developers received:', developers);
    
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
          document_owner: document_owners || [],
          developer: developers || [],
          stakeholders: stakeholders || [],
          document_stage: document_stage || 'draft',
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
        
        const flaskUrl = process.env.FLASK_URL;
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
      document_stage: document_stage || 'draft',
      project_overview: project_overview,
      start_date: start_date,
      end_date: end_date,
      document_owners: document_owners || [],
      developers: developers || [],
      stakeholders: stakeholders || [],
      darci_roles: finalDarciRoles,
      generated_sections: generatedSections,
      timeline: timeline,
      is_pinned: false, // Default value for new PRDs
      last_viewed_at: new Date() // Set initial view time
    };
    
    console.log('Creating PRD with data structure:', Object.keys(prdData));
    
    try {
      const newPRD = await PRD.create(prdData);
      console.log('PRD created successfully with ID:', newPRD.id);

      const user = await User.findByPk(userId);

      if (user?.fcm_token) {
        const message = {
          token: user.fcm_token,
          notification: {
            title: 'PRD Generated',
            body: `Your PRD "${product_name}" has been successfully generated.`,
          },
          android: {
            priority: "high",
            notification: {
              channelId: "default_channel", // harus match dengan yang di Flutter
            }
          },
          data: {
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          }
        };

        try {
          const response = await admin.messaging().send(message);
          console.log("✅ FCM notification sent:", response);
        } catch (error) {
          console.error("❌ FCM error:", error);
        }
      }
      
      return res.status(201).json({
        status: 'success',
        message: 'PRD created successfully',
        data: newPRD
      });
    } catch (dbError) {
      console.error('Database error creating PRD:', dbError);
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

// Update PRD (Manual editing only - no Flask API regeneration)
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
      document_stage,
      project_overview,
      start_date,
      end_date,
      document_owners,
      developers,
      stakeholders,
      darci_roles,
      generated_sections,
      timeline,
      is_pinned
    } = req.body;
    
    // Prepare update data
    const updateData = {
      updated_at: new Date()
    };
    
    // Allow explicit document_stage setting, otherwise default behavior
    if (document_stage !== undefined) {
      updateData.document_stage = document_stage;
    } else if (existingPrd.document_stage === 'draft') {
      // Auto-progress from draft to inprogress on first edit
      updateData.document_stage = 'inprogress';
    }
    
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
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    
    console.log('Update data prepared:', Object.keys(updateData));
    
    // Update the PRD (no Flask API calls - pure manual editing)
    await existingPrd.update(updateData);
    
    console.log('PRD updated successfully');
    
    return res.status(200).json({
      status: 'success',
      message: 'PRD updated successfully',
      data: existingPrd
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

// Toggle PRD pinned status
const togglePinPRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
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
    
    // Toggle is_pinned status
    const newPinnedStatus = !prd.is_pinned;
    
    await prd.update({ is_pinned: newPinnedStatus });
    
    return res.status(200).json({
      status: 'success',
      message: newPinnedStatus 
        ? 'PRD pinned successfully' 
        : 'PRD unpinned successfully',
      data: {
        id: prd.id,
        is_pinned: newPinnedStatus
      }
    });
  } catch (err) {
    console.error('Error toggling PRD pin status:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update PRD pin status',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update PRD document stage
const updatePRDStage = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    const { document_stage } = req.body;
    
    // Validate stage value
    const validStages = ['draft', 'inprogress', 'finished', 'archived'];
    if (!validStages.includes(document_stage)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid document stage value'
      });
    }
    
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
    
    await prd.update({ 
      document_stage,
      updated_at: new Date()
    });
    
    return res.status(200).json({
      status: 'success',
      message: `PRD stage updated to ${document_stage}`,
      data: {
        id: prd.id,
        document_stage
      }
    });
  } catch (err) {
    console.error('Error updating PRD stage:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update PRD stage',
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
    await prd.destroy();
    
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

// Archive PRD - Simplified to use updatePRDStage
const archivePRD = async (req, res) => {
  try {
    const userId = req.user.id;
    const prdId = req.params.id;
    
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
    
    // Check if it's already archived, if so, unarchive it
    const newStage = prd.document_stage === 'archived' ? 'draft' : 'archived';
    
    // Update the PRD directly
    await prd.update({ 
      document_stage: newStage,
      updated_at: new Date()
    });
    
    return res.status(200).json({
      status: 'success',
      message: newStage === 'archived' ? 'PRD archived successfully' : 'PRD unarchived successfully',
      data: {
        id: prd.id,
        document_stage: newStage
      }
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
    const { update_stage = true } = req.query; // Parse as boolean
    
    console.log(`Starting PDF download for PRD ${prdId} by user ${userId}, update_stage=${update_stage}`);
    
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
    
    // Update document stage to 'finished' when downloading, if requested
    const shouldUpdateStage = update_stage === 'true';
    if (shouldUpdateStage && prd.document_stage !== 'finished' && prd.document_stage !== 'archived') {
      await prd.update({ 
        document_stage: 'finished',
        updated_at: new Date()
      });
      console.log('PRD stage updated to finished');
    } else {
      console.log('PRD stage remains unchanged:', prd.document_stage);
    }
    
    // Generate PDF with timeout and retry
    try {
      console.log('Generating PDF...');
      
      // Add timeout for PDF generation (3 minutes)
      const pdfPromise = generatePRDPDF(prd.toJSON());
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 180000)
      );
      
      // Race between PDF generation and timeout
      const pdfResult = await Promise.race([pdfPromise, timeoutPromise]);
      
      console.log('PDF generated successfully:', pdfResult.url);
      
      return res.status(200).json({
        status: 'success',
        message: 'PDF generated successfully',
        data: {
          download_url: pdfResult.url,
          public_url: pdfResult.publicUrl || pdfResult.url,
          file_name: pdfResult.fileName,
          gcs_path: pdfResult.gcsPath,
          prd_id: prdId,
          document_stage: prd.document_stage,
          generated_at: new Date().toISOString(),
          expires_at: pdfResult.expiresAt
        }
      });
      
    } catch (pdfError) {
      console.error('PDF generation error details:', pdfError);
      
      // Check for specific types of PDF errors
      let errorMessage = 'Failed to generate PDF';
      if (pdfError.message.includes('timeout')) {
        errorMessage = 'PDF generation timed out. The document may be too large.';
      } else if (pdfError.code === 'ECONNREFUSED') {
        errorMessage = 'PDF service is currently unavailable';
      }
      
      return res.status(500).json({
        status: 'error',
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? pdfError.toString() : undefined
      });
    }
    
  } catch (err) {
    console.error('Error in downloadPRD:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process download request',
      error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get counts for different PRD stages
    const [totalDraft, totalInProgress, totalFinished, totalArchived] = await Promise.all([
      PRD.count({ where: { user_id: userId, document_stage: 'draft' } }),
      PRD.count({ where: { user_id: userId, document_stage: 'inprogress' } }),
      PRD.count({ where: { user_id: userId, document_stage: 'finished' } }),
      PRD.count({ where: { user_id: userId, document_stage: 'archived' } })
    ]);
    
    // Get total PRDs
    const totalPRD = totalDraft + totalInProgress + totalFinished + totalArchived;
    
    // Get recent PRDs (last 5)
    const recentPRDs = await PRD.findAll({
      where: { user_id: userId },
      order: [['updated_at', 'DESC']],
      limit: 5,
      attributes: [
        'id', 'product_name', 'document_stage', 
        'updated_at', 'is_pinned', 'last_viewed_at'
      ]
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        counts: {
          totalPRD,
          totalDraft,
          totalInProgress,
          totalFinished,
          totalArchived
        },
        recentPRDs
      }
    });
  } catch (err) {
    console.error('Error getting dashboard data:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAllPRDs,
  getRecentPRDs,
  getPRDById,
  createPRD,
  updatePRD,
  togglePinPRD,
  updatePRDStage,
  deletePRD,
  archivePRD,
  downloadPRD,
  getDashboardStats
};