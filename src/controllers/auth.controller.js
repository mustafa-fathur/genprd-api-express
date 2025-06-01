const { getGoogleAuthURL, getGoogleUser } = require('../utils/googleOAuth');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
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

module.exports = {
    webGoogleLogin,
    webGoogleCallback,
    mobileGoogleLogin,
    mobileGoogleCallback,
    verifyGoogleToken,
    refreshToken,
    logout
};