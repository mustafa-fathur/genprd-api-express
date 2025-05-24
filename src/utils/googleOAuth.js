const { OAuth2Client } = require('google-auth-library');

// Create OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const getGoogleAuthURL = (customRedirectUri) => {
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['email', 'profile'],
    redirect_uri: customRedirectUri,
  });
};

const getGoogleUser = async (code, redirectUri) => {
  try {
    console.log('Getting tokens from Google...');
    
    // Exchange authorization code for tokens
    const { tokens } = await client.getToken({
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
    });
    
    console.log('Tokens received, getting user info...');
    
    // Set credentials for this client
    client.setCredentials(tokens);
    
    // Get user info
    const { data } = await client.request({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo',
    });
    
    console.log('User info received');
    
    return {
      google_id: data.id,
      name: data.name,
      email: data.email,
      avatar_url: data.picture,
    };
  } catch (error) {
    console.error('Error in getGoogleUser:', error.message);
    throw error;
  }
};

module.exports = { getGoogleAuthURL, getGoogleUser };