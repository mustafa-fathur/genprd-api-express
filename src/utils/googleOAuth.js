const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getGoogleAuthURL = () => {
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['email', 'profile'],
  });
};

const getGoogleUser = async (code) => {
  try {
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    return {
      google_id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar_url: payload.picture
    };
  } catch (error) {
    console.error("Error getting Google user:", error);
    throw error;
  }
};

module.exports = { getGoogleAuthURL, getGoogleUser };
