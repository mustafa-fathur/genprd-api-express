const { getGoogleAuthURL, getGoogleUser } = require('../utils/googleOAuth');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');
const { User, RefreshToken } = require('../models');
const Sequelize = require('sequelize');

console.log(process.env.BASE_URL)

// WEB AUTHENTICATION
const webGoogleLogin = async (req, res) => {
    const url = getGoogleAuthURL(`${process.env.BASE_URL}/api/auth/web/google/callback`);
    console.log("Web: Redirecting to Google OAuth URL:", url);
    res.redirect(url);
};

const webGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    console.log("Web: Google callback called");
    
    if (!code) {
      console.log("Web: No authorization code received");
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    try {
      // Pass the redirect URI to getGoogleUser
      const redirectUri = `${process.env.BASE_URL}/api/auth/web/google/callback`;
      const googleUser = await getGoogleUser(code, redirectUri);
      console.log("Web: Google user data retrieved:", googleUser.email);
      
      let user = await User.findOne({ where: { google_id: googleUser.google_id } });
      if (!user) {
        user = await User.create(googleUser);
      }
  
      const accessToken = generateToken({ id: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ id: user.id });
  
      await RefreshToken.create({ 
          token: refreshToken, 
          user_id: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked: false
      });

      // REDIRECT to React app with tokens in URL
      const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.append('token', accessToken);
      redirectUrl.searchParams.append('refresh_token', refreshToken);
      redirectUrl.searchParams.append('user', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      }));
      
      console.log("Web: Redirecting to frontend");
      return res.redirect(redirectUrl.toString());
      
    } catch (error) {
      console.error("Web: Error fetching Google user:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
    
  } catch (err) {
    console.error("Web: Unhandled error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// MOBILE AUTHENTICATION
const mobileGoogleLogin = async (req, res) => {
    // Deteksi user agent atau parameter untuk menentukan dari mana request berasal
    const isAndroidEmulator = req.query.platform === 'android_emulator' || 
                             req.headers['user-agent'].includes('Android');
    
    // Pilih URL callback yang sesuai
    const callbackUrl = isAndroidEmulator 
        ? `${process.env.BASE_URL.replace('localhost', '10.0.2.2')}/api/auth/mobile/google/callback` 
        : `${process.env.BASE_URL}/api/auth/mobile/google/callback`;
    
    const url = getGoogleAuthURL(callbackUrl);
    console.log("Mobile: Redirecting to Google OAuth URL:", url);
    res.redirect(url);
};

const mobileGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    console.log("Mobile: Google callback called");
    
    if (!code) {
      console.log("Mobile: No authorization code received");
      return res.status(400).json({ 
        status: 'error',
        message: 'No authorization code received' 
      });
    }

    try {
      // Pass the redirect URI to getGoogleUser
      const redirectUri = `${process.env.BASE_URL}/api/auth/mobile/google/callback`;
      const googleUser = await getGoogleUser(code, redirectUri);
      console.log("Mobile: Google user data retrieved:", googleUser.email);
      
      let user = await User.findOne({ where: { google_id: googleUser.google_id } });
      if (!user) {
        user = await User.create(googleUser);
      }
  
      const accessToken = generateToken({ id: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ id: user.id });
  
      await RefreshToken.create({ 
          token: refreshToken, 
          user_id: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked: false
      });

      // RETURN JSON for mobile apps
      return res.json({
        status: 'success',
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        }
      });
      
    } catch (error) {
      console.error("Mobile: Error fetching Google user:", error);
      return res.status(401).json({ 
        status: 'error',
        message: 'Authentication failed', 
        error: error.message 
      });
    }
    
  } catch (err) {
    console.error("Mobile: Unhandled error:", err);
    return res.status(500).json({ 
      status: 'error',
      message: 'Authentication failed', 
      error: err.message 
    });
  }
};

// SHARED FUNCTIONS (keep existing)
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
      
      if (!stored) {
        return res.status(403).json({ 
          status: 'error',
          message: 'Invalid refresh token' 
        });
      }

      const newAccessToken = generateToken({ id: payload.id, email: payload.email });
      res.json({ 
        status: 'success',
        access_token: newAccessToken 
      });
    } catch (err) {
      res.status(401).json({ 
        status: 'error',
        message: 'Invalid or expired refresh token' 
      });
    }
};

const logout = async (req, res) => {
    const userId = req.user.id;
    try {
      await RefreshToken.destroy({ where: { user_id: userId } });
      res.json({ 
        status: 'success',
        message: 'Logout successful' 
      });
    } catch (err) {
      res.status(500).json({ 
        status: 'error',
        message: 'Logout failed' 
      });
    }
};

const verifyGoogleToken = async (req, res) => {
  try {
    console.log("Received request to verify Google token");
    const { id_token, access_token } = req.body;
    
    if (!id_token) {
      console.log("Missing ID token");
      return res.status(400).json({ 
        status: 'error', 
        message: 'ID token is required' 
      });
    }
    
    console.log("Verifying Google token...");
    
    try {
      // Verifikasi token menggunakan Google API
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      console.log("Token verified successfully for:", payload.email);
      
      const googleId = payload['sub'];
      const email = payload['email'];
      const name = payload['name'] || email.split('@')[0];
      const picture = payload['picture'];
      
      // Cari atau buat user
      console.log("Finding or creating user in database");
      let user = await User.findOne({ where: { email: email } });
      
      if (!user) {
        console.log("Creating new user");
        user = await User.create({
          google_id: googleId,
          email: email,
          name: name,
          avatar_url: picture,
        });
      } else if (user.google_id !== googleId) {
        // Update google_id jika berbeda
        user.google_id = googleId;
        await user.save();
      }
      
      // Generate token
      console.log("Generating tokens");
      const accessToken = generateToken({ id: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ id: user.id });
      
      // Simpan refresh token
      await RefreshToken.create({ 
        token: refreshToken, 
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false
      });
      
      // Kembalikan response
      console.log("Authentication successful, returning tokens");
      return res.json({
        status: 'success',
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        }
      });
      
    } catch (error) {
      console.error("Error verifying Google token:", error);
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid token',
        error: error.message 
      });
    }
  } catch (err) {
    console.error("Unhandled error:", err);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error',
      error: err.message 
    });
  }
};

// CONVENTIONAL AUTHENTICATION
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, and name are required'
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create default avatar URL using first letter of name
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
    
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      avatar_url: defaultAvatar,
      google_id: null // Null for conventional auth users
    });
    
    // Generate tokens
    const accessToken = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });
    
    // Save refresh token
    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false
    });
    
    // Return response
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: err.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Check if it's a Google OAuth user without password
    if (!user.password) {
      return res.status(400).json({
        status: 'error',
        message: 'This account uses Google Sign-In. Please login with Google.'
      });
    }
    
    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Generate tokens
    const accessToken = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id });
    
    // Save refresh token
    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false
    });
    
    // Return response
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: err.message
    });
  }
};

// Password reset request
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // For security reasons, still return success even if user doesn't exist
      return res.json({
        status: 'success',
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate a reset token (in production you would use a more secure method)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    
    // Store the token with expiry time (would typically be in a separate table)
    // For simplicity, we'll use the refresh token table with a special prefix
    const resetRefreshToken = `reset_${resetToken}`;
    
    await RefreshToken.create({
      token: resetRefreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      revoked: false
    });
    
    // In a real application, you would send an email with a reset link
    // For demo purposes, we'll just return the token
    console.log(`Password reset requested for ${email}. Token: ${resetToken}`);
    
    res.json({
      status: 'success',
      message: 'If your email is registered, you will receive a password reset link',
      // Only for development:
      dev_reset_token: resetToken
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Password reset request failed',
      error: err.message
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Token and new password are required'
      });
    }
    
    // Find the reset token
    const resetRefreshToken = `reset_${token}`;
    const tokenRecord = await RefreshToken.findOne({
      where: {
        token: resetRefreshToken,
        revoked: false,
        expires_at: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });
    
    if (!tokenRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }
    
    // Get the user
    const user = await User.findByPk(tokenRecord.user_id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update password
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();
    
    // Revoke the reset token
    tokenRecord.revoked = true;
    await tokenRecord.save();
    
    // Revoke all refresh tokens for security
    await RefreshToken.update(
      { revoked: true },
      { where: { user_id: user.id, revoked: false } }
    );
    
    res.json({
      status: 'success',
      message: 'Password has been reset successfully. Please login with your new password.'
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Password reset failed',
      error: err.message
    });
  }
};

// Add to exports
module.exports = {
    webGoogleLogin,
    webGoogleCallback,
    mobileGoogleLogin,
    mobileGoogleCallback,
    verifyGoogleToken,
    refreshToken,
    logout,
    register,
    login,
    requestPasswordReset,
    resetPassword
};