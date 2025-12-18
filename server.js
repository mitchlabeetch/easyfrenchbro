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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
