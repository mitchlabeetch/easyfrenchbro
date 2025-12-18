import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to generate PDF
app.post('/export-pdf', async (req, res) => {
  try {
    const { url, options } = req.body;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new"
    });
    const page = await browser.newPage();

    await page.goto(url || 'http://localhost:5173', { waitUntil: 'networkidle0' });

    // Optional: Hide specific UI elements if not handled by CSS media print
    await page.addStyleTag({ content: '.no-print { display: none !important; }' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': 'attachment; filename="export.pdf"'
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).send('Error generating PDF');
  }
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_DATA_DIR = path.join(__dirname, 'userdata');
const PROJECTS_DIR = path.join(USER_DATA_DIR, 'projects');
const PALETTES_DIR = path.join(USER_DATA_DIR, 'palettes');
const PREFERENCES_FILE = path.join(USER_DATA_DIR, 'preferences.json');
const ASSETS_DIR = path.join(USER_DATA_DIR, 'assets');
const TEMPLATES_DIR = path.join(USER_DATA_DIR, 'templates');

// Ensure directories exist
[USER_DATA_DIR, PROJECTS_DIR, PALETTES_DIR, ASSETS_DIR, TEMPLATES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
if (!fs.existsSync(PREFERENCES_FILE)) {
  fs.writeFileSync(PREFERENCES_FILE, JSON.stringify({}));
}

// Get all projects
app.get('/projects', (req, res) => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(PROJECTS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file.replace('.json', ''),
          updatedAt: stats.mtime
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
    res.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).send('Error listing projects');
  }
});

// Save project
app.post('/projects', (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).send('Name and data are required');
    }
    
    // Sanitize filename to prevent directory traversal
    const safeName = name.replace(/[^a-z0-9\-_]/gi, '_');
    const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true, name: safeName });
  } catch (error) {
    console.error('Error saving project:', error);
    res.status(500).send('Error saving project');
  }
});

// Load project
app.get('/projects/:name', (req, res) => {
  try {
    const { name } = req.params;
    const safeName = name.replace(/[^a-z0-9\-_]/gi, '_');
    const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Project not found');
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error loading project:', error);
    res.status(500).send('Error loading project');
  }
});

// Delete project
app.delete('/projects/:name', (req, res) => {
  try {
    const { name } = req.params;
    const safeName = name.replace(/[^a-z0-9\-_]/gi, '_');
    const filePath = path.join(PROJECTS_DIR, `${safeName}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Project not found');
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true, message: `Project "${name}" deleted` });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).send('Error deleting project');
  }
});
// --- Palette Endpoints ---

// Get all palettes
app.get('/palettes', (req, res) => {
  try {
    const files = fs.readdirSync(PALETTES_DIR);
    const palettes = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(PALETTES_DIR, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      });
    res.json(palettes);
  } catch (error) {
    console.error('Error listing palettes:', error);
    res.status(500).send('Error listing palettes');
  }
});

// Save palette
app.post('/palettes', (req, res) => {
  try {
    const palette = req.body;
    if (!palette || !palette.id || !palette.name) {
      return res.status(400).send('Invalid palette data');
    }
    
    const safeName = palette.name.replace(/[^a-z0-9\-_]/gi, '_'); // Filename based on name
    const filePath = path.join(PALETTES_DIR, `${safeName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(palette, null, 2));
    res.json({ success: true, id: palette.id });
  } catch (error) {
    console.error('Error saving palette:', error);
    res.status(500).send('Error saving palette');
  }
});

// --- Preference Endpoints ---

app.get('/preferences', (req, res) => {
    try {
        if (fs.existsSync(PREFERENCES_FILE)) {
            const data = JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf-8'));
            res.json(data);
        } else {
            res.json({});
        }
    } catch (e) {
        console.error("Error reading preferences", e);
        res.status(500).send("Error reading preferences");
    }
});

app.post('/preferences', (req, res) => {
    try {
        const prefs = req.body;
        fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2));
        res.json({ success: true });
    } catch (e) {
        console.error("Error saving preferences", e);
        res.status(500).send("Error saving preferences");
    }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
