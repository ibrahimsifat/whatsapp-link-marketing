# Deployment Guide

## Overview

This guide covers deployment options for the WhatsApp Link Generator application.

## Vercel Deployment (Recommended)

### Prerequisites
- GitHub account
- Vercel account
- Repository pushed to GitHub

### Steps

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   \`\`\`
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   \`\`\`

3. **Environment Variables**
   Add these in Vercel dashboard:
   \`\`\`
   NEXT_PUBLIC_APP_NAME=WhatsApp Business Link Generator
   NEXT_PUBLIC_UPLOAD_PASSWORD=your-secure-password
   \`\`\`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Manual Deployment

### Build for Production

\`\`\`bash
npm run build
npm run start
\`\`\`

### Docker Deployment

Create `Dockerfile`:
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

Build and run:
\`\`\`bash
docker build -t whatsapp-link-generator .
docker run -p 3000:3000 whatsapp-link-generator
\`\`\`

## Environment Configuration

### Production Environment Variables

\`\`\`env
# Required
NEXT_PUBLIC_APP_NAME="WhatsApp Business Link Generator"
NEXT_PUBLIC_UPLOAD_PASSWORD="secure-password-here"

# Optional
NEXT_PUBLIC_GA_ID="GA-XXXXXXXXX"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
\`\`\`

### Security Considerations

1. **Change Default Password**: Update `UPLOAD_PASSWORD` in production
2. **HTTPS Only**: Ensure SSL certificate is configured
3. **Content Security Policy**: Configure CSP headers
4. **Rate Limiting**: Implement rate limiting for file uploads

## Performance Optimization

### Build Optimization

1. **Bundle Analysis**
   \`\`\`bash
   npm run analyze
   \`\`\`

2. **Image Optimization**
   - Use Next.js Image component
   - Optimize static images

3. **Code Splitting**
   - Lazy load components
   - Dynamic imports for heavy libraries

### Monitoring

1. **Error Tracking**: Integrate Sentry or similar
2. **Analytics**: Add Google Analytics
3. **Performance Monitoring**: Use Vercel Analytics

## Backup and Recovery

### Data Backup
Since the app uses local storage, consider:
- Regular data export features
- Cloud storage integration
- Database migration for production use

### Recovery Procedures
1. Redeploy from Git repository
2. Restore environment variables
3. Test all functionality

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

2. **Runtime Errors**
   - Check environment variables
   - Verify file upload permissions
   - Review browser console for client-side errors

3. **Performance Issues**
   - Enable compression
   - Optimize images
   - Check bundle size

### Support

For deployment issues:
1. Check Vercel documentation
2. Review application logs
3. Contact support team
