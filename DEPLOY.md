# 🚀 Deployment Guide

## Option 1: Netlify (Recommended - Easiest)

### Method A: Drag & Drop
1. Run `npm run build` 
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist/` folder to Netlify
4. ✅ Done! Your app is live with HTTPS

### Method B: Git Integration
1. Push your code to GitHub
2. Connect Netlify to your repo
3. Auto-deploy on every push

## Option 2: Vercel (Also Great)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. ✅ Auto-deployed!

## Option 3: FTP Deployment

### Setup
1. Edit `deploy.js` with your FTP credentials:
   ```javascript
   host: "your-ftp-host.com",
   user: "your-username", 
   password: "your-password"
   ```

2. Update the remote path:
   ```javascript
   await client.ensureDir("/public_html/void-admiral/");
   ```

### Deploy
```bash
npm run deploy
```

## Option 4: Manual FTP
1. Run `npm run build`
2. Upload contents of `dist/` folder to your web server
3. Make sure `index.html` is in the root of your web directory

## 🔧 Build Commands
- `npm run build` - Build for production
- `npm run deploy` - Build + FTP deploy
- `npm run preview` - Preview built app locally

## 🌐 Firebase Hosting (Bonus)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Choose the option that works best for your hosting setup! 🎯
