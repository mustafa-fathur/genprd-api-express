const { Personnel } = require('../models');

// Get all personnel for the logged-in user
const getAllPersonnel = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const personnel = await Personnel.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']]
    });
    
    res.json({
      status: 'success',
      data: personnel
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve personnel list' 
    });
  }
};

// Get a single personnel by ID
const getPersonnelById = async (req, res) => {
  try {
    const userId = req.user.id;
    const personnelId = req.params.id;
    
    const personnel = await Personnel.findOne({
      where: { 
        id: personnelId,
        user_id: userId
      }
    });
    
    if (!personnel) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Personnel not found' 
      });
    }
    
    res.json({
      status: 'success',
      data: personnel
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve personnel details' 
    });
  }
};

// Create a new personnel
const createPersonnel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, role, contact } = req.body;
    
    // Validate required fields
    if (!name || !role || !contact) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, role, and contact are required'
      });
    }
    
    // Create new personnel
    const personnel = await Personnel.create({
      user_id: userId,
      name,
      role,
      contact
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Personnel created successfully',
      data: personnel
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create personnel' 
    });
  }
};

// Update an existing personnel
const updatePersonnel = async (req, res) => {
  try {
    const userId = req.user.id;
    const personnelId = req.params.id;
    const { name, role, contact } = req.body;
    
    // Find the personnel
    const personnel = await Personnel.findOne({
      where: { 
        id: personnelId,
        user_id: userId
      }
    });
    
    if (!personnel) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Personnel not found' 
      });
    }
    
    // Update fields if provided
    if (name) personnel.name = name;
    if (role) personnel.role = role;
    if (contact) personnel.contact = contact;
    
    await personnel.save();
    
    res.json({
      status: 'success',
      message: 'Personnel updated successfully',
      data: personnel
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update personnel' 
    });
  }
};

// Delete a personnel
const deletePersonnel = async (req, res) => {
  try {
    const userId = req.user.id;
    const personnelId = req.params.id;
    
    // Find the personnel
    const personnel = await Personnel.findOne({
      where: { 
        id: personnelId,
        user_id: userId
      }
    });
    
    if (!personnel) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Personnel not found' 
      });
    }
    
    // Delete the personnel
    await personnel.destroy();
    
    res.json({
      status: 'success',
      message: 'Personnel deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to delete personnel' 
    });
  }
};

module.exports = {
  getAllPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel
};