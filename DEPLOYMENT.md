# 🚀 TurboWheel Deployment Guide

This guide covers deploying TurboWheel to various platforms for both development and production environments.

## 📋 Prerequisites

- Node.js 16+ and npm
- Git
- MetaMask wallet with Sepolia ETH
- Platform accounts (Vercel, Render, etc.)

## 🏗️ Local Development

### 1. Clone and Setup
```bash
git clone https://github.com/your-username/turbowheel.git
cd turbowheel
npm run install-all
```

### 2. Environment Configuration
```bash
# Copy environment template
cp server/env.example server/.env

# Edit server/.env with your values
PORT=3001
NODE_ENV=development
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
YELLOW_API_KEY=your_yellow_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

Access the game at: http://localhost:3000

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare for Deployment
```bash
# Build the frontend
npm run build

# Test the build locally
cd client
npm run preview
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Environment Variables (Vercel)
Set these in your Vercel dashboard:
- `VITE_API_URL`: Your backend API URL
- `VITE_CONTRACT_ADDRESS`: Deployed contract address
- `VITE_NETWORK`: sepolia

## 🖥️ Backend Deployment (Render)

### 1. Prepare Backend
```bash
cd server
npm install --production
```

### 2. Deploy to Render
1. Connect your GitHub repository
2. Select the `server` directory as root
3. Set build command: `npm install`
4. Set start command: `npm start`

### 3. Environment Variables (Render)
- `PORT`: 3001
- `NODE_ENV`: production
- `SEPOLIA_RPC_URL`: Your Infura/Alchemy URL
- `PRIVATE_KEY`: Your wallet private key
- `YELLOW_API_KEY`: Your Yellow SDK API key

## 📜 Smart Contract Deployment

### 1. Setup Hardhat
```bash
cd contracts
npm install
```

### 2. Configure Network
Update `hardhat.config.js` with your RPC URLs and private keys.

### 3. Deploy to Sepolia
```bash
# Deploy contracts
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

### 4. Update Frontend
Update contract addresses in your frontend configuration.

## 🔧 Production Configuration

### Frontend (Vite)
```javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
```

### Backend (Express)
```javascript
// Production middleware
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
  app.use(helmet());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }));
}
```

## 🐳 Docker Deployment

### 1. Create Dockerfile
```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install-all

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

### 2. Build and Run
```bash
# Build image
docker build -t turbowheel .

# Run container
docker run -p 3001:3001 --env-file .env turbowheel
```

## 🔍 Monitoring and Analytics

### 1. Error Tracking
```javascript
// Add Sentry for error tracking
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV
});
```

### 2. Performance Monitoring
```javascript
// Add performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 🧪 Testing Deployment

### 1. Health Checks
```bash
# Test API health
curl https://your-api-url.com/api/health

# Test game loading
curl https://your-frontend-url.com
```

### 2. Web3 Integration Test
1. Connect MetaMask to Sepolia
2. Ensure you have test ETH
3. Play a game and submit score
4. Verify transaction on Etherscan

## 🚨 Troubleshooting

### Common Issues

**Frontend not loading:**
- Check API URL configuration
- Verify CORS settings
- Check browser console for errors

**Backend connection failed:**
- Verify environment variables
- Check database connection
- Review server logs

**Smart contract errors:**
- Ensure sufficient ETH for gas
- Verify contract deployment
- Check network configuration

### Debug Commands
```bash
# Check frontend build
npm run build && npm run preview

# Test backend locally
cd server && npm start

# Verify contracts
cd contracts && npm run compile
```

## 📊 Performance Optimization

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading
- Optimize images

### Backend
- Use Redis for caching
- Implement rate limiting
- Add request compression
- Use connection pooling

### Smart Contracts
- Optimize gas usage
- Use events for logging
- Implement batch operations
- Consider layer 2 solutions

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] Smart contracts audited
- [ ] Private keys secured
- [ ] Error messages sanitized

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement microservices
- Use container orchestration
- Consider serverless functions

### Database Scaling
- Use read replicas
- Implement caching layers
- Consider sharding
- Use connection pooling

### Blockchain Scaling
- Consider layer 2 solutions
- Implement batch transactions
- Use state channels effectively
- Optimize gas usage

## 🎯 Next Steps

1. **Monitor Performance**: Set up monitoring and alerting
2. **User Analytics**: Implement user behavior tracking
3. **A/B Testing**: Test different game mechanics
4. **Community Features**: Add social features
5. **Mobile App**: Consider React Native version

---

For additional support, check the [main README](README.md) or open an issue on GitHub.
