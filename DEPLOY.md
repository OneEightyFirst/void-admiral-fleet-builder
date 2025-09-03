# 🚀 Deployment Guide

## Option 1: Firebase Hosting (Current Setup) ⭐

This project is configured for Firebase Hosting with custom domain support.

### Deploy
```bash
npm run build
firebase deploy
```

### First-time Setup (if needed)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

### Custom Domain
- Domain: `vafleets.com`
- SSL: Automatically provided by Firebase
- CDN: Global edge locations

## Option 2: Netlify (Alternative)

### Method A: Drag & Drop
1. Run `npm run build` 
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist/` folder to Netlify
4. ✅ Done! Your app is live with HTTPS

### Method B: Git Integration
1. Push your code to GitHub
2. Connect Netlify to your repo
3. Auto-deploy on every push

## Option 3: Vercel (Alternative)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. ✅ Auto-deployed!

## 🔧 Build Commands
- `npm run build` - Build for production
- `npm run preview` - Preview built app locally
- `npm run deploy:netlify` - Build + Netlify instructions

## 📁 Build Output
- Built files go to `dist/` folder
- Ready for any static hosting service
- Optimized for production with code splitting

Choose Firebase Hosting for the best performance and features! 🎯
