import { getConfig, updateConfig } from './config.js';
import { getClient } from './client.js';
import axios from 'axios';
import http from 'http';
import url from 'url';
import * as lark from '@larksuiteoapi/node-sdk';

/**
 * Executes a function with automatic token refresh handling.
 * If the function fails with an invalid access token error,
 * it triggers the authentication flow and retries the function.
 *
 * @param operation The async operation to perform. It should take a userAccessToken as argument.
 * @param userAccessToken Optional initial user access token.
 */
export async function withAuthRetry<T>(
  operation: (token: string) => Promise<any>,
  options: { userAccessToken?: string } = {}
): Promise<any> {
  const config = getConfig();
  let token = options.userAccessToken || config.userAccessToken;

  if (!token) {
    console.log('ℹ️  No User Access Token found. Starting authentication...');
    token = await authenticateUser();
  }

  try {
    const res = await operation(token);
    
    // Check for specific error codes indicating invalid token
    // 20005: invalid access token
    // 99991663, 99991664, 99991668: docx token errors
    if (res.code === 20005 || res.code === 99991668 || res.code === 99991663 || res.code === 99991664) {
      console.log(`⚠️  Token expired or invalid (Code: ${res.code}). Refreshing authentication...`);
      token = await authenticateUser();
      return await operation(token);
    }
    
    return res;
  } catch (error: any) {
    // Sometimes the SDK might throw instead of returning error code
    // Check error message or code if available
    console.error('Operation failed:', error);
    throw error;
  }
}

/**
 * Starts the OAuth2 flow to authenticate the user and get a new access token.
 */
export async function authenticateUser(): Promise<string> {
  const config = getConfig();
  const appId = process.env.LARK_APP_ID || config.appId;
  const appSecret = process.env.LARK_APP_SECRET || config.appSecret;

  if (!appId || !appSecret) {
    console.error('❌ Error: App ID and App Secret are required before user authentication.');
    console.error('Please run "lark-cli auth login --app-id <id> --app-secret <secret>" first.');
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const redirectUri = encodeURIComponent('http://localhost:3000/callback');
    const scopeList = [
      'docx:document:readonly',
      'calendar:calendar:readonly',
      'task:task:readonly',
      'contact:user.id:readonly'
    ];
    const scopeStr = encodeURIComponent(scopeList.join(' '));
    const oauthUrl = `https://accounts.feishu.cn/open-apis/authen/v1/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopeStr}`;

    console.log('\n🔐 Authentication required.');
    console.log('1. Open the following link in your browser to authorize:');
    console.log(`   ${oauthUrl}`);
    
    const server = http.createServer(async (req, res) => {
      const reqUrl = url.parse(req.url || '', true);
      
      if (reqUrl.pathname === '/callback') {
        const code = reqUrl.query.code as string;
        
        if (code) {
          console.log(`\n📥 Received authorization code.`);
          console.log('🔄 Exchanging code for access token...');
          
          try {
            const token = await exchangeCodeForToken(appId, appSecret, code);
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html>
                <head>
                    <title>Authorization Successful</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f6f7; }
                        .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 600px; width: 90%; }
                        h1 { color: #3370ff; margin-bottom: 20px; }
                        .token-box { background: #f0f2f5; padding: 15px; border-radius: 4px; word-break: break-all; font-family: monospace; margin: 20px 0; border: 1px solid #dee0e3; text-align: left; max-height: 200px; overflow-y: auto; }
                        .btn { display: inline-block; background: #3370ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 500; cursor: pointer; border: none; font-size: 16px; margin-top: 20px; }
                        .btn:hover { background: #285ecf; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>✅ Authorization Successful!</h1>
                        <p>You have successfully authenticated with Lark.</p>
                        <p>Your User Access Token has been saved to the configuration file.</p>
                        
                        <div class="token-box">
                            <strong>User Access Token:</strong><br/>
                            ${token}
                        </div>
                        
                        <button class="btn" onclick="window.close()">Close This Tab</button>
                    </div>
                </body>
              </html>
            `);
            
            setTimeout(() => {
                server.close();
            }, 3000);
            console.log('✅ Authentication successful. Resuming operation...\n');
            resolve(token);
          } catch (error) {
            res.writeHead(500);
            res.end('Authentication failed');
            server.close();
            reject(error);
          }
        }
      }
    });

    server.listen(3000, () => {
      console.log('⏳ Waiting for authorization...');
    });
    
    server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
            console.error('❌ Port 3000 is already in use.');
            process.exit(1);
        }
    });
  });
}

async function exchangeCodeForToken(appId: string, appSecret: string, code: string): Promise<string> {
  try {
    const tokenRes = await axios.post(
      'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: appSecret,
        code: code,
        redirect_uri: 'http://localhost:3000/callback'
      }
    );

    const responseData = tokenRes.data;

    if (responseData.code !== 0) {
      throw new Error(`Failed to exchange token: [${responseData.code}] ${responseData.msg}`);
    }
    
    const userAccessToken = responseData.data?.access_token || responseData.access_token;
    
    if (!userAccessToken) {
      throw new Error('Invalid response structure: access_token is missing');
    }
    
    updateConfig({ userAccessToken });
    
    // Fetch and save user info immediately after token exchange
    try {
        const userInfoRes = await axios.get('https://open.feishu.cn/open-apis/authen/v1/user_info', {
            headers: { Authorization: `Bearer ${userAccessToken}` }
        });
        
        if (userInfoRes.data.code === 0 && userInfoRes.data.data) {
            updateConfig({ userInfo: userInfoRes.data.data });
            console.log('✅ User Info fetched and saved.');
        } else {
            console.warn('⚠️ Failed to fetch user info after token exchange:', userInfoRes.data);
        }
    } catch (e) {
        console.warn('⚠️ Failed to fetch user info after token exchange:', e);
    }

    return userAccessToken;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
}
