# 🚀 MentorBridge Deployment Guide

## 📋 Overview
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js + Express)
- **Email**: Resend (Email Service)
- **Database**: MongoDB Atlas

---

## 🔧 Environment Variables

### 🟨 Backend (Render)
```bash
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
OPENAI_API_KEY=sk-... (optional for AI features)
CLIENT_URL=https://mentorbridge-frontend.vercel.app
RESEND_API_KEY=re_...
```

### 🟦 Frontend (Vercel)
```bash
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## 📧 Resend Email Setup

1. **Domain Verification** (Required for production):
   - Add your domain `mentorbridge.app` to Resend
   - Update DNS records as provided by Resend
   - Change `from` address to `noreply@mentorbridge.app`

2. **Testing Mode** (Current setup):
   - Uses `onboarding@resend.dev` (Resend's testing domain)
   - Only sends emails to registered email addresses
   - Other emails are mocked (logged to console)

---

## 🚀 Deployment Steps

### 1. Backend Deployment (Render)
```bash
# 1. Push to GitHub
git add .
git commit -m "Configure for Render deployment"
git push

# 2. Connect to Render
# - Go to render.com
# - Connect GitHub repository
# - Use render.yaml configuration
# - Set environment variables
```

### 2. Frontend Deployment (Vercel)
```bash
# 1. Push to GitHub (already done)
# 2. Connect to Vercel
# - Go to vercel.com
# - Connect GitHub repository
# - Set environment variables
# - Deploy automatically
```

---

## 🔗 URLs After Deployment

- **Frontend**: `https://mentorbridge-frontend.vercel.app`
- **Backend API**: `https://mentorbridge-backend.onrender.com/api`
- **Health Check**: `https://mentorbridge-backend.onrender.com/api/health`

---

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas connection string updated
- [ ] JWT_SECRET is strong and unique
- [ ] Resend API key is valid
- [ ] Domain verified in Resend (for production emails)
- [ ] CORS origins updated in backend
- [ ] Environment variables set in both platforms

---

## 🐛 Troubleshooting

### Common Issues:
1. **CORS Errors**: Update allowed origins in `app.js` and `socketService.js`
2. **Email Not Sending**: Check Resend API key and domain verification
3. **MongoDB Connection**: Verify connection string and IP whitelist
4. **Socket Connection**: Ensure WebSocket enabled on Render

### Debug Commands:
```bash
# Check backend health
curl https://your-backend.onrender.com/api/health

# Check frontend build
npm run build
npm run preview
```

---

## 🔄 Production vs Development

### Development:
- Uses `http://localhost:3001` (backend)
- Uses `http://localhost:5173` (frontend)
- Mock emails for non-allowed addresses

### Production:
- Uses Render and Vercel URLs
- Real email delivery via Resend
- Proper SSL certificates

---

## 📞 Support

For deployment issues:
1. Check Render logs
2. Check Vercel build logs
3. Verify environment variables
4. Test API endpoints individually
