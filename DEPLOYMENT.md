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
   VITE_WHITELIST_EMAILS=alias1@gmail.com,alias2@gmail.com
   ```
   **⚠️ `VITE_WHITELIST_EMAILS` is fail-closed**: if empty or missing, ALL Google Sign-In attempts are rejected. Use Gmail aliases you control.

4. **Deploy**:
   - Render will build and deploy automatically
   - First deployment takes 3-5 minutes
   - Your site will be at: `https://arg-bot-frontend.onrender.com`

---

## 🔧 Local Development

```bash
npm install
npm run dev
```

Frontend will be at: `http://localhost:10000`

---

## ✅ Pre-Deployment Checklist

- [ ] Backend deployed and URL noted
- [ ] `VITE_API_URL` set to backend URL
- [ ] `VITE_WHITELIST_EMAILS` set with authorized Gmail aliases (fail-closed if empty)
- [ ] Tests passing: `npm run test:unit`
- [ ] Build succeeds: `npm run build`
- [ ] CORS configured on backend with frontend URL

---

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Check `VITE_API_URL` is correct
- Verify backend is running on Render
- Check browser console for CORS errors

### "Balance shows 0.00"
- Configure Binance API keys in "API Binance" section
- Whitelist server IP in Binance (shown in app)
- Wait 30 seconds and refresh

---

**Ready to deploy! 🚀**
