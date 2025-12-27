import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────
// DIRECTORY SETUP
// ─────────────────────────────────────────────────────────────────
const USER_DATA_DIR = path.join(__dirname, 'userdata');
const PROJECTS_DIR = path.join(USER_DATA_DIR, 'projects');
const PALETTES_DIR = path.join(USER_DATA_DIR, 'palettes');
const PREFERENCES_FILE = path.join(USER_DATA_DIR, 'preferences.json');
const ASSETS_DIR = path.join(USER_DATA_DIR, 'assets');
const TEMPLATES_DIR = path.join(USER_DATA_DIR, 'templates');
const FONTS_DIR = path.join(USER_DATA_DIR, 'fonts');
const EXPORTS_DIR = path.join(USER_DATA_DIR, 'exports');

// Ensure all directories exist
[USER_DATA_DIR, PROJECTS_DIR, PALETTES_DIR, ASSETS_DIR, TEMPLATES_DIR, FONTS_DIR, EXPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

if (!fs.existsSync(PREFERENCES_FILE)) {
  fs.writeFileSync(PREFERENCES_FILE, JSON.stringify({}));
}

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased for large projects

// Serve static assets from userdata/assets directory
app.use('/assets', express.static(ASSETS_DIR));

// Serve local fonts
app.use('/fonts', express.static(FONTS_DIR));

// ─────────────────────────────────────────────────────────────────
// PDF EXPORT - High Resolution (300 DPI)
// ─────────────────────────────────────────────────────────────────

// Page size definitions in pixels at 300 DPI
const PAGE_SIZES_300DPI = {
  'A4': { width: 2480, height: 3508 },      // 210mm x 297mm at 300 DPI
  'A3': { width: 3508, height: 4961 },      // 297mm x 420mm at 300 DPI
  'A5': { width: 1748, height: 2480 },      // 148mm x 210mm at 300 DPI
  'Letter': { width: 2550, height: 3300 },   // 8.5" x 11" at 300 DPI
  'Legal': { width: 2550, height: 4200 },    // 8.5" x 14" at 300 DPI
  'TradeBook': { width: 1800, height: 2700 }, // 6" x 9" at 300 DPI
  'Custom': { width: 2480, height: 3508 }    // Default to A4
};

app.post('/export-pdf', async (req, res) => {
  try {
    const { 
      url, 
      options = {},
      projectTitle = 'export',
      pageSize = 'A4',
      quality = 'high', // 'draft' (72 DPI), 'standard' (150 DPI), 'high' (300 DPI)
      showCropMarks = false,
      bleed = '0mm',
      metadata = {}
    } = req.body;

    console.log(`[PDF Export] Starting: ${projectTitle}, Size: ${pageSize}, Quality: ${quality}`);

    // Determine device scale factor based on quality
    let deviceScaleFactor;
    switch (quality) {
      case 'draft': deviceScaleFactor = 0.75; break;  // ~72 DPI
      case 'standard': deviceScaleFactor = 1.56; break; // ~150 DPI
      case 'high': 
      default: deviceScaleFactor = 3.125; break; // ~300 DPI
    }

    // Launch Puppeteer with high-quality settings
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none', // Better font rendering
        '--disable-gpu-sandbox'
      ]
    });

    const page = await browser.newPage();

    // Get page dimensions
    const pageDimensions = PAGE_SIZES_300DPI[pageSize] || PAGE_SIZES_300DPI['A4'];
    
    // Set viewport for high-res rendering
    await page.setViewport({
      width: Math.round(pageDimensions.width / deviceScaleFactor),
      height: Math.round(pageDimensions.height / deviceScaleFactor),
      deviceScaleFactor: deviceScaleFactor
    });

    // Navigate to the page
    await page.goto(url || 'http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 60000 // 60 second timeout for large documents
    });

    // Inject print-specific styles
    await page.addStyleTag({ content: `
      .no-print, 
      [data-no-print="true"],
      .sidebar,
      .toolbar,
      .controls { 
        display: none !important; 
      }
      
      body {
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .page {
        box-shadow: none !important;
        margin: 0 !important;
        page-break-after: always;
      }
      
      /* Ensure arrows are visible */
      .arrow-layer {
        overflow: visible !important;
      }
    `});

    // Wait for any fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Wait a bit more for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF with high quality settings
    const pdfBuffer = await page.pdf({
      format: pageSize === 'TradeBook' ? undefined : pageSize,
      width: pageSize === 'TradeBook' ? '6in' : undefined,
      height: pageSize === 'TradeBook' ? '9in' : undefined,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      tagged: true, // Accessibility
      outline: true // PDF bookmarks
    });

    await browser.close();

    console.log(`[PDF Export] Complete: ${pdfBuffer.length} bytes`);

    // Set response headers
    const safeTitle = projectTitle.replace(/[^a-z0-9\-_]/gi, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('[PDF Export] Error:', error);
    res.status(500).json({ 
      error: 'Error generating PDF',
      message: error.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// PNG SNAPSHOT - High Resolution Element Export
// ─────────────────────────────────────────────────────────────────
app.post('/export-png', async (req, res) => {
  try {
    const {
      url,
      selector = '.page', // CSS selector for element to capture
      scale = 4, // 4x for ~300 DPI from 72 DPI screen
      filename = 'snapshot'
    } = req.body;

    console.log(`[PNG Export] Capturing: ${selector} at ${scale}x`);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: scale
    });

    await page.goto(url || 'http://localhost:5173', {
      waitUntil: 'networkidle0'
    });

    // Hide UI elements
    await page.addStyleTag({ content: `
      .no-print, .sidebar, .toolbar, .controls { display: none !important; }
    `});

    // Find and screenshot the element
    const element = await page.$(selector);
    
    if (!element) {
      await browser.close();
      return res.status(400).json({ error: `Element not found: ${selector}` });
    }

    const screenshot = await element.screenshot({
      type: 'png',
      omitBackground: false
    });

    await browser.close();

    const safeFilename = filename.replace(/[^a-z0-9\-_]/gi, '_');
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': screenshot.length,
      'Content-Disposition': `attachment; filename="${safeFilename}.png"`
    });

    res.send(screenshot);

  } catch (error) {
    console.error('[PNG Export] Error:', error);
    res.status(500).json({ error: 'Error capturing screenshot', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// PROJECT ENDPOINTS
// ─────────────────────────────────────────────────────────────────
app.get('/projects', (req, res) => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(PROJECTS_DIR, file);
        try {
          const stats = fs.statSync(filePath);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          return {
            name: file.replace('.json', ''),
            updatedAt: stats.mtime,
            // Include metadata for richer project listing
            title: content.metadata?.title || file.replace('.json', ''),
            author: content.metadata?.author || '',
            pageCount: content.pages?.length || 0
          };
        } catch (e) {
          // Skip invalid JSON files
          console.warn(`[Projects] Invalid file: ${file}`, e.message);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(projects);
  } catch (error) {
    console.error('[Projects] Error listing:', error);
    res.status(500).json({ error: 'Error listing projects' });
  }
});

app.post('/projects', (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: 'Name and data are required' });
    }
    
    const safeName = name.replace(/[^a-z0-9\-_]/gi, '_');
    const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`[Projects] Saved: ${safeName}`);
    res.json({ success: true, name: safeName });
  } catch (error) {
    console.error('[Projects] Error saving:', error);
    res.status(500).json({ error: 'Error saving project' });
  }
});

app.get('/projects/:name', (req, res) => {
  try {
    const { name } = req.params;
    const safeName = name.replace(/[^a-z0-9\-_]/gi, '_');
    const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('[Projects] Error loading:', error);
    res.status(500).json({ error: 'Error loading project' });
  }
});

// Rename project
app.patch('/projects/:name', (req, res) => {
  try {
    const { name } = req.params;
    const { newName } = req.body;
    
    if (!newName) {
      return res.status(400).json({ error: 'New name is required' });
    }
    
    const safeName = name.replace(/[^a-z0-9\-_]/gi, '_');
    const safeNewName = newName.replace(/[^a-z0-9\-_]/gi, '_');
    
    const oldPath = path.join(PROJECTS_DIR, `${safeName}.json`);
    const newPath = path.join(PROJECTS_DIR, `${safeNewName}.json`);
    
    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: 'A project with that name already exists' });
    }
    
    fs.renameSync(oldPath, newPath);
    res.json({ success: true, name: safeNewName });
  } catch (error) {
    console.error('[Projects] Error renaming:', error);
    res.status(500).json({ error: 'Error renaming project' });
  }
});

app.delete('/projects/:name', (req, res) => {
  try {
    const { name } = req.params;
    const safeName = name.replace(/[^a-z0-9\-_]/gi, '_');
    const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    fs.unlinkSync(filePath);
    console.log(`[Projects] Deleted: ${safeName}`);
    res.json({ success: true, message: `Project "${name}" deleted` });
  } catch (error) {
    console.error('[Projects] Error deleting:', error);
    res.status(500).json({ error: 'Error deleting project' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ASSET MANAGEMENT (Images)
// ─────────────────────────────────────────────────────────────────
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ASSETS_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9\-_.]/gi, '_');
    const uniqueName = `${Date.now()}-${safeName}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Upload asset
app.post('/assets', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const assetPath = `/assets/${req.file.filename}`;
    console.log(`[Assets] Uploaded: ${req.file.filename}`);
    
    res.json({ 
      success: true, 
      path: assetPath,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('[Assets] Upload error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// List assets
app.get('/assets-list', (req, res) => {
  try {
    const files = fs.readdirSync(ASSETS_DIR);
    const assets = files
      .filter(file => !file.startsWith('.'))
      .map(file => {
        const filePath = path.join(ASSETS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: `/assets/${file}`,
          size: stats.size,
          modified: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    res.json(assets);
  } catch (error) {
    console.error('[Assets] Error listing:', error);
    res.status(500).json({ error: 'Error listing assets' });
  }
});

// Delete asset
app.delete('/assets/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const safeName = filename.replace(/\.\./g, '');
    const filePath = path.join(ASSETS_DIR, safeName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('[Assets] Error deleting:', error);
    res.status(500).json({ error: 'Error deleting asset' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PALETTE ENDPOINTS
// ─────────────────────────────────────────────────────────────────
app.get('/palettes', (req, res) => {
  try {
    const files = fs.readdirSync(PALETTES_DIR);
    const palettes = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(PALETTES_DIR, file);
        try {
          return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
    res.json(palettes);
  } catch (error) {
    console.error('[Palettes] Error listing:', error);
    res.status(500).json({ error: 'Error listing palettes' });
  }
});

app.post('/palettes', (req, res) => {
  try {
    const palette = req.body;
    if (!palette || !palette.id || !palette.name) {
      return res.status(400).json({ error: 'Invalid palette data' });
    }
    
    const safeName = palette.name.replace(/[^a-z0-9\-_]/gi, '_');
    const filePath = path.join(PALETTES_DIR, `${safeName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(palette, null, 2));
    res.json({ success: true, id: palette.id });
  } catch (error) {
    console.error('[Palettes] Error saving:', error);
    res.status(500).json({ error: 'Error saving palette' });
  }
});

// ─────────────────────────────────────────────────────────────────
// PREFERENCE ENDPOINTS
// ─────────────────────────────────────────────────────────────────
app.get('/preferences', (req, res) => {
  try {
    if (fs.existsSync(PREFERENCES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf-8'));
      res.json(data);
    } else {
      res.json({});
    }
  } catch (e) {
    console.error('[Preferences] Error reading:', e);
    res.status(500).json({ error: 'Error reading preferences' });
  }
});

app.post('/preferences', (req, res) => {
  try {
    const prefs = req.body;
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2));
    res.json({ success: true });
  } catch (e) {
    console.error('[Preferences] Error saving:', e);
    res.status(500).json({ error: 'Error saving preferences' });
  }
});

// ─────────────────────────────────────────────────────────────────
// UTILITY ENDPOINTS
// ─────────────────────────────────────────────────────────────────

// Open folder in system explorer
app.post('/open-folder', async (req, res) => {
  try {
    const { path: folderPath } = req.body;
    const targetPath = folderPath ? path.resolve(USER_DATA_DIR, folderPath) : USER_DATA_DIR;
    
    // Security check
    if (!targetPath.startsWith(USER_DATA_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let command;
    let args = [];

    if (process.platform === 'darwin') {
      command = 'open';
      args = [targetPath];
    } else if (process.platform === 'win32') {
      command = 'explorer';
      args = [targetPath];
    } else {
      command = 'xdg-open';
      args = [targetPath];
    }

    const { spawn } = await import('child_process');
    spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Open Folder] Error:', error);
    res.status(500).json({ error: 'Error opening folder' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '2.0.0',
    features: ['pdf-300dpi', 'png-export', 'assets', 'mirror-margins']
  });
});

// ─────────────────────────────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  EasyFrenchBro Book Layout Tool - Server v2.0.0              ║
║                                                              ║
║  Backend running on: http://localhost:${PORT}                   ║
║                                                              ║
║  Features:                                                   ║
║    ✓ High-res PDF export (up to 300 DPI)                     ║
║    ✓ PNG element snapshots                                   ║
║    ✓ Local asset management                                  ║
║    ✓ Project rename support                                  ║
║                                                              ║
║  Directories:                                                ║
║    Projects: ${PROJECTS_DIR}
║    Assets:   ${ASSETS_DIR}
║    Fonts:    ${FONTS_DIR}
╚══════════════════════════════════════════════════════════════╝
  `);
});
