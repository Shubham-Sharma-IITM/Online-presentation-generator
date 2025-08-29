import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { generatePresentationController } from './controllers/presentationController';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../output');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(outputDir);

// Configure multer for file uploads
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
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.pptx') || file.originalname.endsWith('.potx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .pptx and .potx files are allowed'));
    }
  }
});

// Routes
app.post('/api/generate', upload.single('templateFile'), generatePresentationController);

// Serve generated files
app.use('/api/download', express.static(outputDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    error: error.message || 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});