// ============================================
// OAUTH SERVICE - Platform-specific OAuth flows
// ============================================

const axios = require('axios');
const jwt = require('jsonwebtoken');

const OAUTH_CONFIGS = {
  TIKTOK_ORGANIC: {
    authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientId: () => process.env.TIKTOK_CLIENT_KEY,
    clientSecret: () => process.env.TIKTOK_CLIENT_SECRET,
    scopes: ['user.info.basic', 'video.list'],
    windsorConnectorType: 'tiktok_organic',
  },
  YOUTUBE: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    windsorConnectorType: 'youtube',
  },
  FACEBOOK_ORGANIC: {
    authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientId: () => process.env.META_APP_ID,
    clientSecret: () => process.env.META_APP_SECRET,
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_read_posts', 'read_insights'],
    windsorConnectorType: 'facebook_organic',
  },
  INSTAGRAM_ORGANIC: {
    authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientId: () => process.env.META_APP_ID,
    clientSecret: () => process.env.META_APP_SECRET,
    scopes: ['instagram_basic', 'instagram_manage_insights', 'pages_show_list'],
    windsorConnectorType: 'instagram',
  },
};

function getConfig(provider) {
  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  return config;
}

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for OAuth state signing');
  }
  return secret;
}

function buildAuthUrl(provider, redirectUri, state) {
  const config = getConfig(provider);
  const clientId = config.clientId();
  if (!clientId) {
    throw new Error(`OAuth client ID not configured for ${provider}`);
  }

  const params = new URLSearchParams();

  if (provider === 'TIKTOK_ORGANIC') {
    params.set('client_key', clientId);
    params.set('scope', config.scopes.join(','));
    params.set('response_type', 'code');
    params.set('redirect_uri', redirectUri);
    params.set('state', state);
  } else {
    params.set('client_id', clientId);
    params.set('scope', config.scopes.join(' '));
    params.set('response_type', 'code');
    params.set('redirect_uri', redirectUri);
    params.set('state', state);
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

async function exchangeCode(provider, code, redirectUri) {
  const config = getConfig(provider);
  const clientId = config.clientId();
  const clientSecret = config.clientSecret();

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth credentials not configured for ${provider}`);
  }

  if (provider === 'TIKTOK_ORGANIC') {
    const response = await axios.post(config.tokenUrl, {
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const data = response.data?.data || response.data;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || null,
      expires_in: data.expires_in || null,
      open_id: data.open_id || null,
    };
  }

  // Google / Meta flow (standard OAuth2)
  const params = new URLSearchParams();
  params.set('client_id', clientId);
  params.set('client_secret', clientSecret);
  params.set('code', code);
  params.set('grant_type', 'authorization_code');
  params.set('redirect_uri', redirectUri);

  const response = await axios.post(config.tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token || null,
    expires_in: response.data.expires_in || null,
  };
}

function createState(companyId, provider, userId) {
  return jwt.sign(
    { companyId, provider, userId },
    getJwtSecret(),
    { expiresIn: '10m' }
  );
}

function verifyState(state) {
  try {
    const payload = jwt.verify(state, getJwtSecret());
    return { companyId: payload.companyId, provider: payload.provider, userId: payload.userId };
  } catch (err) {
    throw new Error('Invalid or expired OAuth state token');
  }
}

function getAvailableProviders() {
  return Object.entries(OAUTH_CONFIGS)
    .filter(([, config]) => config.clientId() && config.clientSecret())
    .map(([key]) => key);
}

module.exports = {
  OAUTH_CONFIGS,
  getConfig,
  buildAuthUrl,
  exchangeCode,
  createState,
  verifyState,
  getAvailableProviders,
};
