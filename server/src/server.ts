import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { generatePresentationController } from './controllers/presentationController';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10); // This fixes it

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for now
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure directories exist
const uploadDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../output');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(outputDir);

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 52428800 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.pptx') || file.originalname.endsWith('.potx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .pptx and .potx files are allowed'));
    }
  }
});

// API Routes (before static serving)
app.post('/api/generate', upload.single('templateFile'), generatePresentationController);
app.use('/api/download', express.static(outputDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Serve static files from React app
const clientPath = path.join(__dirname, '../../client/dist');
console.log('Looking for client files at:', clientPath);

// Check if build directory exists
if (fs.existsSync(clientPath)) {
  console.log('✅ Client build directory found');
  app.use(express.static(clientPath));
  
  // Handle React Router (return `index.html` for all non-API routes)
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = path.join(clientPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not built. Please run: npm run build');
    }
  });
} else {
  console.log('❌ Client build directory not found at:', clientPath);
  
  // Fallback route when no frontend is built
  app.get('/', (req, res) => {
    res.json({
      message: 'Presentation Generator API',
      status: 'Frontend not built',
      buildPath: clientPath,
      exists: fs.existsSync(clientPath),
      endpoints: {
        health: '/api/health',
        generate: '/api/generate (POST)',
        download: '/api/download/:filename'
      }
    });
  });
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.status(404).send('Frontend not available. Please build the client first.');
  });
}

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    error: isDevelopment ? error.message : 'Internal server error' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Client path: ${clientPath}`);
  console.log(`📁 Client exists: ${fs.existsSync(clientPath)}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});