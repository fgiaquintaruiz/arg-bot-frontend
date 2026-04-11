# ARGBOT Frontend - Deployment Guide

## 🌐 Production Deployment

### Current Setup
- **Frontend URL**: https://arg-bot-frontend.onrender.com
- **Backend URL**: (your Render backend URL)
- **Port**: Render automatically assigns ports for web services (no need to configure)

### Deploy to Render.com

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Create Render Web Service**:
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `arg-bot-frontend`
   - Configure:
     - **Name**: `arg-bot-frontend`
     - **Environment**: `Static Site`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
     - **Plan**: Free

3. **Set Environment Variables**:
   In Render dashboard → Environment Variables:
   ```
   VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
   VITE_ENCRYPTION_KEY=<generate-with-script-below>
   ```

4. **Deploy**:
   - Render will build and deploy automatically
   - First deployment takes 3-5 minutes
   - Your site will be at: `https://arg-bot-frontend.onrender.com`

---

## 🔑 Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Example output**: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`

**⚠️ IMPORTANT**: 
- Use the SAME key for both frontend (`VITE_ENCRYPTION_KEY`) and backend (`ENCRYPTION_KEY`)
- Never commit this key to GitHub
- Save it in a password manager

---

## 🔧 Local Development

```bash
npm install
npm run dev
```

Frontend will be at: `http://localhost:10000`

---

## 📦 How Encryption Works

### Flow:
1. User enters Binance API Key & Secret in the app
2. Frontend encrypts them with `VITE_ENCRYPTION_KEY` using AES
3. Encrypted keys saved to localStorage
4. Encrypted keys sent to backend on every API call
5. Backend decrypts with `ENCRYPTION_KEY` (must match)
6. Backend uses decrypted keys to call Binance API

### Security:
- ✅ Keys encrypted before storage
- ✅ Keys encrypted in transit (HTTPS)
- ✅ Backend decrypts only when needed
- ⚠️ Key exposed in client bundle (acceptable for trusted users)

---

## ✅ Pre-Deployment Checklist

- [ ] Backend deployed and URL noted
- [ ] Encryption key generated (32 chars)
- [ ] `VITE_API_URL` set to backend URL
- [ ] `VITE_ENCRYPTION_KEY` set (matches backend)
- [ ] Tests passing: `npm run test:unit`
- [ ] Build succeeds: `npm run build`
- [ ] CORS configured on backend with frontend URL

---

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Check `VITE_API_URL` is correct
- Verify backend is running on Render
- Check browser console for CORS errors

### "Decryption failed"
- Ensure `VITE_ENCRYPTION_KEY` matches backend `ENCRYPTION_KEY`
- Re-enter Binance API keys in the app

### "Balance shows 0.00"
- Configure Binance API keys in "API Binance" section
- Whitelist server IP in Binance (shown in app)
- Wait 30 seconds and refresh

---

**Ready to deploy! 🚀**
