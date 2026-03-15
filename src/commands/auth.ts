import { Command } from 'commander';
import { updateConfig } from '../utils/config.js';
import axios from 'axios';
import http from 'http';
import url from 'url';

export function registerAuthCommand(program: Command) {
  const authCmd = program
    .command('auth')
    .description('Manage Lark authentication credentials');

  authCmd
    .command('login')
    .description('Configure Lark App ID and App Secret')
    .requiredOption('--app-id <appId>', 'Lark App ID')
    .requiredOption('--app-secret <appSecret>', 'Lark App Secret')
    .action((options) => {
      const { appId, appSecret } = options;
      updateConfig({ appId, appSecret });
      console.log('✅ Authentication credentials saved successfully to ~/.lark-cli/config.json');
    });
    
  authCmd
    .command('status')
    .description('Check current authentication status')
    .action(() => {
      const { getConfig } = require('../utils/config');
      const config = getConfig();
      const envAppId = process.env.LARK_APP_ID;
      const envAppSecret = process.env.LARK_APP_SECRET;
      
      const activeAppId = envAppId || config.appId;
      const activeAppSecret = envAppSecret || config.appSecret;
      const hasUserToken = !!config.userAccessToken;
      
      if (activeAppId && activeAppSecret) {
        console.log(`✅ App Authenticated. Active App ID: ${activeAppId}`);
        if (envAppId) {
          console.log('ℹ️  Using credentials from environment variables.');
        } else {
          console.log('ℹ️  Using credentials from config file.');
        }
      } else {
        console.log('❌ App Not authenticated. Run "lark-cli auth login --app-id <id> --app-secret <secret>"');
      }

      if (hasUserToken) {
        console.log('✅ User Access Token is configured.');
      } else {
        console.log('ℹ️  User Access Token is NOT configured (Optional, for accessing user-specific resources).');
      }
    });

  authCmd
    .command('user')
    .description('Authenticate as a user to access user resources')
    .option('--token <token>', 'Directly set the user access token')
    .option('--code <code>', 'Exchange authorization code for user access token')
    .action(async (options) => {
      const { getClient } = require('../utils/client');
      const { updateConfig, getConfig } = require('../utils/config');

      // 1. If token is provided, save it directly
      if (options.token) {
        updateConfig({ userAccessToken: options.token });
        console.log('✅ User Access Token saved successfully.');
        return;
      }

      // 2. Pre-check: Validate App ID and App Secret
      const config = getConfig();
      const appId = process.env.LARK_APP_ID || config.appId;
      const appSecret = process.env.LARK_APP_SECRET || config.appSecret;

      if (!appId || !appSecret) {
        console.error('❌ Error: App ID and App Secret are required before user authentication.');
        console.error('Please run "lark-cli auth login --app-id <id> --app-secret <secret>" first.');
        process.exit(1);
      }
      
      const client = getClient();

      // Helper function to exchange code for token
      const exchangeCodeForToken = async (code: string) => {
        try {
             const tokenRes = await axios.post(
                 'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
                 {
                     grant_type: 'authorization_code',
                     client_id: appId,
                     client_secret: appSecret,
                     code: code,
                     redirect_uri: 'http://localhost:3000/callback'
                 },
                 {
                     headers: {
                         'Content-Type': 'application/json'
                     }
                 }
             );
 
             // Axios throws on 4xx/5xx, so we catch it below.
             const responseData = tokenRes.data;
             
             // Debug log to see the actual response structure
             // console.log('DEBUG: Token Response:', JSON.stringify(responseData, null, 2));
 
             if (responseData.code !== 0) {
                  console.error(`❌ Failed to exchange token: [${responseData.code}] ${responseData.msg}`);
                  if (responseData.error) console.error(JSON.stringify(responseData.error, null, 2));
                  return false;
             }
             
             let userAccessToken;
             let expiresIn;
 
             if (responseData.data && responseData.data.access_token) {
                 userAccessToken = responseData.data.access_token;
                 expiresIn = responseData.data.expires_in;
             } else if (responseData.access_token) {
                 userAccessToken = responseData.access_token;
                 expiresIn = responseData.expires_in;
             } else {
                  console.error('❌ Invalid response structure: "access_token" is missing.');
                  console.error('Response:', JSON.stringify(responseData, null, 2));
                  return false;
             }
             
             updateConfig({ userAccessToken });
             console.log('✅ User Access Token obtained and saved successfully.');
             console.log(`Expires in: ${expiresIn} seconds`);
             return true;
  
         } catch (e: any) {
              if (e.response) {
                  console.error('❌ Error exchanging code for token:', e.response.status, e.response.data);
              } else {
                  console.error('❌ Error exchanging code for token:', e.message);
              }
              return false;
         }
      };

      // 3. If code is provided manually, exchange for user_access_token
      if (options.code) {
        const success = await exchangeCodeForToken(options.code);
        if (!success) process.exit(1);
        return;
      }

      console.log('🔍 Checking App Credentials...');
      
      try {
           // Simple validation
           // Note: internal() method might not be available or stable. 
           // Let's rely on the client construction which is already validated by getClient().
           // If we want to strictly validate, we can try to get an app_access_token explicitly.
           // However, for the purpose of generating the link, we can just proceed if env vars are present.
           // The SDK will throw error later if credentials are wrong.
           // To avoid "internal is not a function" or similar errors, let's skip this explicit call
           // or use a public API like get tenant info if possible.
           // For now, let's just assume valid if getClient() returns successfully.
           const client = getClient();
      } catch (e: any) {
           console.error('❌ Failed to validate App Credentials. Please check your App ID and App Secret.');
           process.exit(1);
      }

      console.log('✅ App Credentials found.');
       console.log('\nTo authenticate as a user:');
       
       // Construct the OAuth2 URL
       const redirectUri = encodeURIComponent('http://localhost:3000/callback');
       // Refined scopes based on error 20043 (Invalid Scope)
       // Some scopes might be deprecated or incorrect.
       // Let's use standard scopes.
       // contact:contact.base:readonly -> contact:user.base:readonly (common) or just contact:contact:readonly
       // docx:document:readonly -> valid
       // bitable:app:readonly -> bitable:app:read
       // bitable:record:readonly -> bitable:record:read (bitable usually uses 'read' not 'readonly')
       // sheet:spreadsheet:readonly -> sheet:spreadsheet:read
       
       // Let's use a minimal set that is likely to be valid and cover the basics.
       // We will use space separated raw strings.
       // bitable:app:readonly -> bitable:app:read
       // sheet:spreadsheet:readonly -> sheets:spreadsheet:read
       
       const scope = encodeURIComponent('contact:user.id:readonly docx:document:readonly bitable:app:readonly bitable:record:readonly sheets:spreadsheet:readonly'); 
       // Wait, let's check the error message specifically: "bitable:record:readonly sheet:spreadsheet:readonly 有误"
       // It seems 'sheet' should be 'sheets' or the suffix is 'read'.
       // Official docs often use 'read' instead of 'readonly' for some newer APIs, or vice versa.
       // Let's try to fix the ones reported.
       // "sheet:spreadsheet:readonly" -> "sheets:spreadsheet:readonly" (plural sheets)
       // "bitable:record:readonly" -> Maybe it requires "bitable:app:readonly" to be sufficient?
       // Actually, commonly used scopes are:
       // docx:document:readonly
       // bitable:app:readonly
       // sheets:spreadsheet:readonly
       
       // Let's try this corrected list:
        const scopeList = [
          // 'contact:user.id:readonly',
          'docx:document:readonly',
          // 'bitable:app:readonly',
          // 'bitable:record:readonly', // This might be redundant or incorrect if app:readonly covers it, or it might be bitable:app:read
          // 'sheets:spreadsheet:readonly' // Fixed 'sheet' to 'sheets'
          'calendar:calendar:readonly', // Added calendar scope
          // 'drive:drive:readonly', // Removed as per request (permission not granted)
          'task:task:readonly' // Added task scope
        ];
        
        const scopeStr = encodeURIComponent(scopeList.join(' '));

      
       const oauthUrl = `https://accounts.feishu.cn/open-apis/authen/v1/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopeStr}`;
  
        console.log('\nTo authenticate as a user:');
        console.log('1. Open the following link in your browser to authorize:');
        console.log(`   ${oauthUrl}`);
        
        // Start local server to listen for callback
        console.log('\n🚀 Starting local server on http://localhost:3000/callback to receive authorization code...');
        
        const server = http.createServer(async (req, res) => {
            const reqUrl = url.parse(req.url || '', true);
            
            if (reqUrl.pathname === '/callback') {
                const code = reqUrl.query.code as string;
                const error = reqUrl.query.error as string;
                
                if (code) {
                    console.log(`\n📥 Received authorization code: ${code}`);
                    console.log('🔄 Exchanging code for access token...');
                    
                    const success = await exchangeCodeForToken(code);
                    
                    if (success) {
                        // We need to read the config to get the token we just saved
                        const { getConfig } = require('../utils/config');
                        const config = getConfig();
                        const token = config.userAccessToken || 'Saved to config';
                        
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
                                    <p>Your User Access Token has been saved to <code>~/.lark-cli/config.json</code>.</p>
                                    
                                    <div class="token-box">
                                        <strong>User Access Token:</strong><br/>
                                        ${token}
                                    </div>
                                    
                                    <button class="btn" onclick="window.close()">Close This Tab</button>
                                </div>
                            </body>
                            </html>
                        `);
                        
                        // Close server after a short delay to allow response to be sent
                        // setTimeout(() => {
                        //     server.close();
                        //     process.exit(0);
                        // }, 1000);
                        
                        // 不再自动关闭，等待用户手动中断或自行结束（CLI 保持运行直到手动 Ctrl+C 其实更好调试，
                        // 但为了流程闭环，我们可以在打印成功信息后直接 process.exit(0)，不过为了保证 HTTP 响应送达，延时还是必要的。
                        // 用户反馈说“不要跳转过来就关闭，在页面上显示一下是否成功”，我们已经做到了显示成功页面。
                        // “这个页面不用自动关闭”，浏览器页面确实不会自动关闭（除非JS window.close()生效且浏览器允许）。
                        // 关键是本地服务 server.close() 后，浏览器页面虽然还在，但连接断了。
                        // 如果用户希望 CLI 进程不退出，那我们就不能 process.exit。
                        // 但如果不退出，CLI 就一直挂着。
                        // 根据用户需求：“给一个点击关闭的按钮就可以”，页面已经有了。
                        // “不要跳转过来就关闭”可能是指 CLI 进程太快退出了，导致页面还没渲染出来或者服务就断了。
                        // 我们把延时加长一点，或者干脆不自动退出，等待用户 Ctrl+C？
                        // 通常 CLI 工具授权成功后应该退出。
                        // 让我们把延时设为 2秒，或者根据用户指示：
                        // “如果成功了，就显示user access token... 这个页面不用自动关闭”
                        // 这里的“页面不用自动关闭”指的是浏览器标签页，还是 CLI 服务？
                        // 通常浏览器标签页是用户自己关的。
                        // 如果是指 CLI 服务，那我们需要保持监听。但一旦 code 用了，服务也没用了。
                        // 所以最合理的解释是：确保页面能完整渲染出来，不要因为服务断太快导致浏览器显示“连接重置”。
                        // 之前的 1000ms 可能太短。改为不自动退出，或者延时更长。
                        // 为了稳妥，我们移除自动退出逻辑，在终端提示“授权成功，您可以关闭此终端或按 Ctrl+C 退出”。
                        
                        console.log('\n✨ Authorization completed successfully. You can now close this terminal.');
                        // process.exit(0); // Remove automatic exit to keep server alive for a bit or until user actions?
                        // Actually, once response is sent, we can close server.
                        // But let's just close server and exit after a generous timeout to ensure page loads.
                        setTimeout(() => {
                            server.close();
                            process.exit(0);
                        }, 5000); // 5 seconds should be enough for any browser to render
                        
                    } else {
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(`
                            <html>
                            <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                                <h1 style="color: #d0342c;">❌ Token Exchange Failed</h1>
                                <p>Failed to exchange authorization code for access token.</p>
                                <p>Please check your terminal for detailed error logs.</p>
                            </body>
                            </html>
                        `);
                        // 取消自动关闭，让用户手动关闭或重试
                        // setTimeout(() => {
                        //     server.close();
                        //     process.exit(1);
                        // }, 1000);
                    }
                } else if (error) {
                    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`
                        <html>
                        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                            <h1 style="color: #d0342c;">❌ Authorization Failed</h1>
                            <p>Error: ${error}</p>
                        </body>
                        </html>
                    `);
                    // 取消自动关闭，让用户手动关闭或重试
                    // setTimeout(() => {
                    //     server.close();
                    //     process.exit(1);
                    // }, 1000);
                } else {
                    res.writeHead(400);
                    res.end('Authorization code not found.');
                }
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        server.listen(3000, () => {
            console.log('⏳ Waiting for authorization...');
        });
        
        // Handle server errors (e.g. port in use)
        server.on('error', (e: any) => {
            if (e.code === 'EADDRINUSE') {
                console.error('❌ Port 3000 is already in use. Please free up port 3000 or use manual code entry.');
                console.log('\n2. After authorization, you will be redirected to a URL like:');
                console.log('   http://localhost:3000/callback?code=xxx&...');
                console.log('\n3. Copy the "code" parameter value and run:');
                console.log('   lark-cli auth user --code <your_code>');
                process.exit(1);
            } else {
                console.error('❌ Server error:', e);
            }
        });
    });
}
