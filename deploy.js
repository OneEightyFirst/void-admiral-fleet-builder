#!/usr/bin/env node

import ftp from 'basic-ftp';
import path from 'path';

async function deployToFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    // FTP Configuration
    await client.access({
      host: "server119.web-hosting.com",
      port: 21,
      user: "michjfbk",
      password: "1Eighty1st!",
      secure: false // Set to true for FTPS
    });
    
    console.log("🔗 Connected to FTP server");
    
    // Change to your web directory (common paths: public_html, www, htdocs)
    await client.ensureDir("/public_html/void-admiral/");
    
    console.log("📁 Changed to web directory");
    
    // Upload the entire dist folder
    await client.uploadFromDir("./dist", "/public_html/void-admiral/");
    
    console.log("✅ Deployment complete!");
    console.log("🌐 Your app should be live at: https://your-domain.com/void-admiral/");
    
  } catch (err) {
    console.error("❌ Deployment failed:", err);
  }
  
  client.close();
}

// Run deployment
deployToFTP();
