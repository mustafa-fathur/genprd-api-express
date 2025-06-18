const { User } = require('../models');

// Get current user's profile
// Debug version
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get the actual creation timestamp from the user object
    // Sequelize typically uses createdAt for the timestamp
    const createdAt = user.createdAt || user.created_at;
    
    // Format the date properly
    let memberSince;
    if (createdAt && !isNaN(new Date(createdAt).getTime())) {
      // If we have a valid date, format it
      memberSince = new Date(createdAt).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } else {
      // Fallback if date is invalid
      memberSince = 'Unknown';
    }
    
    res.json({
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        member_since: memberSince
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to retrieve user profile' 
    });
  }
};

// Update user profile (optional - for future use)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only allow updating name for now, since email and avatar come from Google
    if (name) {
      user.name = name;
      await user.save();
    }
    
    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update profile' 
    });
  }
};

const updateFCMToken = async (req, res) => {
  try {
    console.log('Received FCM token update request:', req.body, 'User:', req.user);
    const userId = req.user.id;
    const { fcm_token } = req.body;

    await User.update({ fcm_token }, { where: { id: userId } });

    return res.status(200).json({
      status: 'success',
      message: 'FCM token updated successfully'
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update FCM token',
      error: err.message
    });
  }
};


module.exports = {
  getProfile,
  updateProfile,
  updateFCMToken
};