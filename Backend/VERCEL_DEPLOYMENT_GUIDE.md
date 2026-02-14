# Vercel Deployment Guide for Trainer Lab Access Portal Backend

## Issues Fixed

### 1. **CORS Configuration**
- Changed `rewrites` to `builds` and `routes` in `vercel.json`
- Updated CORS headers to apply to all routes `/(.*)`  instead of just `/api/(.*)`
- Set `Access-Control-Allow-Origin` to `*` to allow all origins (you can restrict this later)
- Added explicit OPTIONS handler in `app.js` for CORS preflight requests

### 2. **Vercel Configuration**
- Added `builds` section to specify the serverless function
- Changed from `rewrites` to `routes` for proper routing
- Removed `env` from `vercel.json` (environment variables should be set in Vercel dashboard)

## Deployment Steps

### Step 1: Ensure All Files Are Committed
```bash
cd Backend
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

### Step 2: Set Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add the following environment variables:

   **Required Variables:**
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_ACCESS_SECRET` - Your JWT access token secret
   - `JWT_REFRESH_SECRET` - Your JWT refresh token secret
   - `ADMIN_INVITE_CODE` - Your admin invite code
   
   **Optional Variables:**
   - `JWT_ACCESS_EXPIRY` - Default: `3d`
   - `JWT_REFRESH_EXPIRY` - Default: `7d`
   - `NODE_ENV` - Set to `production`

4. Make sure to set these for **Production**, **Preview**, and **Development** environments

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel CLI (Recommended)
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the Backend directory
cd Backend
vercel --prod
```

#### Option B: Deploy via Git Integration
1. Push your changes to GitHub
2. Vercel will automatically detect the changes and redeploy
3. Wait for the deployment to complete

### Step 4: Verify Deployment

1. Once deployed, visit your backend URL (e.g., `https://your-backend.vercel.app`)
2. You should see: "Trainer Lab Access Portal API Running"
3. Test the health endpoint: `https://your-backend.vercel.app/health`
4. Check the Vercel logs for any errors

### Step 5: Update Frontend CORS Configuration

If you want to restrict CORS to only your frontend domain:

1. Update `vercel.json` line 16:
   ```json
   { "key": "Access-Control-Allow-Origin", "value": "https://trainer-lab-access-portal.vercel.app" }
   ```
   Replace with your actual frontend URL

2. Redeploy

## Common Issues and Solutions

### Issue 1: "500 Internal Server Error"
**Solution:** Check Vercel logs for the actual error
```bash
vercel logs
```

### Issue 2: "CORS Error"
**Solution:** 
- Ensure environment variables are set in Vercel dashboard
- Verify the frontend URL is correct
- Check that the CORS headers are applied to all routes

### Issue 3: "Module not found"
**Solution:**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check that `"type": "module"` is in `package.json`

### Issue 4: "Database Connection Failed"
**Solution:**
- Verify `MONGO_URI` is set correctly in Vercel environment variables
- Ensure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check MongoDB Atlas network access settings

## Vercel Project Settings

### Root Directory
- Set to `Backend` if deploying from monorepo
- Or deploy from the Backend directory directly

### Build & Development Settings
- **Build Command:** Leave empty (no build needed)
- **Output Directory:** Leave empty
- **Install Command:** `npm install`

## Testing After Deployment

1. **Test Root Endpoint:**
   ```bash
   curl https://your-backend.vercel.app/
   ```
   Expected: "Trainer Lab Access Portal API Running"

2. **Test Health Endpoint:**
   ```bash
   curl https://your-backend.vercel.app/health
   ```
   Expected: JSON with status, timestamp, and environment

3. **Test API Endpoint:**
   ```bash
   curl https://your-backend.vercel.app/api/auth/health
   ```

## Important Notes

- **Serverless Functions:** Vercel runs your app as serverless functions, so each request is stateless
- **Cold Starts:** First request after inactivity may be slower
- **Connection Pooling:** MongoDB connections are cached across invocations
- **Logs:** Use `vercel logs` or check the Vercel dashboard for real-time logs
- **Environment Variables:** Never commit `.env` file; always use Vercel dashboard

## Next Steps After Successful Deployment

1. Update your frontend to use the new backend URL
2. Test all API endpoints thoroughly
3. Monitor Vercel logs for any issues
4. Set up custom domain if needed
5. Configure production-specific CORS origins

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test endpoints individually
4. Check MongoDB connection and network access
