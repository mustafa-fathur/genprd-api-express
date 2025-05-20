const { getGoogleAuthURL, getGoogleUser } = require('../utils/googleOAuth');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { User, RefreshToken } = require('../models');
const Sequelize = require('sequelize');

const googleLogin = async (req, res) => {
    const url = getGoogleAuthURL();
    console.log("Redirecting to Google OAuth URL:", url);
    res.redirect(url);
};

const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        console.log("Received code from Google:", code ? `${code.substring(0, 10)}...` : undefined);
        
        if (!code) {
            return res.status(400).json({ message: 'No authorization code received' });
        }
  
        const googleUser = await getGoogleUser(code);
  
        let user = await User.findOne({ where: { google_id: googleUser.google_id } });
        if (!user) {
          user = await User.create(googleUser);
        }
  
        const accessToken = generateToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id });
  
        // Store refresh token in database
        await RefreshToken.create({ 
            token: refreshToken, 
            user_id: user.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            revoked: false
        });
  
        res.json({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
          }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Authentication failed' });
    }
};

const refreshToken = async (req, res) => {
    const { refresh_token } = req.body;
    try {
      const payload = verifyRefreshToken(refresh_token);

      const stored = await RefreshToken.findOne({ 
        where: { 
          token: refresh_token,
          revoked: false,
          expires_at: { 
            [Sequelize.Op.gt]: new Date() 
          } 
        } 
      });
      
      if (!stored) return res.status(403).json({ message: 'Invalid refresh token' });

      const newAccessToken = generateToken({ id: payload.id, email: payload.email });
      res.json({ access_token: newAccessToken });
    } catch (err) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

const logout = async (req, res) => {
    const userId = req.user.id;
    try {
      await RefreshToken.destroy({ where: { user_id: userId } });
      res.json({ message: 'Logout successful' });
    } catch (err) {
      res.status(500).json({ message: 'Logout failed' });
    }
};

module.exports = {
    googleLogin,
    googleCallback,
    refreshToken,
    logout
};