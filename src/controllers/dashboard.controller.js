const { PRD, Personnel } = require('../models');
const { Op } = require('sequelize');

const dashboardData = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    
    const [
      totalPRD,
      totalPersonnel,
      totalDraft,
      totalInProgress,
      totalFinished,
      totalArchived,
      recentPRDs
    ] = await Promise.all([
      // Total PRDs
      PRD.count({ 
        where: { user_id: userId } 
      }),
      
      // Total Personnel
      Personnel.count({ 
        where: { user_id: userId } 
      }),
      
      // Total Draft PRDs
      PRD.count({ 
        where: { 
          user_id: userId,
          document_stage: 'draft'
        } 
      }),
      
      // Total In-Progress PRDs
      PRD.count({ 
        where: { 
          user_id: userId,
          document_stage: 'inprogress'
        } 
      }),
      
      // Total Finished PRDs
      PRD.count({ 
        where: { 
          user_id: userId,
          document_stage: 'finished'
        } 
      }),
      
      // Total Archived PRDs
      PRD.count({ 
        where: { 
          user_id: userId,
          document_stage: 'archived'
        } 
      }),
      
      // 3 Latest PRDs (either created or updated)
      PRD.findAll({
        where: { user_id: userId },
        order: [['updated_at', 'DESC']],
        limit: 3,
        attributes: [
          'id', 
          'product_name', 
          'document_stage', 
          'document_version',
          'created_at',
          'updated_at'
        ]
      })
    ]);
    
    return res.status(200).json({
      status: 'success',
      data: {
        counts: {
          totalPRD,
          totalPersonnel,
          totalDraft,
          totalInProgress,
          totalFinished,
          totalArchived
        },
        recentPRDs
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  dashboardData
};