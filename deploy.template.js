#!/usr/bin/env node

import ftp from 'basic-ftp';
import path from 'path';

async function deployToFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    // FTP Configuration - REPLACE WITH YOUR ACTUAL CREDENTIALS
    await client.access({
      host: "YOUR_FTP_HOST",
      port: 21,
      user: "YOUR_FTP_USERNAME", 
      password: "YOUR_FTP_PASSWORD",
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
