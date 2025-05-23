const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_STORAGE_KEYFILE,
});

const bucketName = process.env.GCP_BUCKET_NAME;
const folderName = process.env.GCP_FOLDER_NAME;

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function(date) {
  if (!date || date === 'now') {
    date = new Date();
  }
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  };
  return date.toLocaleDateString('en-US', options);
});

Handlebars.registerHelper('joinArray', function(array) {
  if (!array) return 'N/A';
  if (Array.isArray(array)) {
    return array.length > 0 ? array.join(', ') : 'N/A';
  }
  return array.toString();
});

Handlebars.registerHelper('capitalize', function(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

/**
 * Generate PDF from PRD data and upload to Google Cloud Storage
 * @param {Object} prdData - The PRD data object
 * @returns {Promise<string>} - The public URL of the uploaded PDF
 */
const generatePRDPDF = async (prdData) => {
  let browser;
  let tempPdfPath;
  
  try {
    console.log('Starting PDF generation for PRD:', prdData.id);
    
    // Read and compile the HTML template
    const templatePath = path.join(__dirname, '../templates/prd-template.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }
    
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateHtml);
    
    // Generate HTML with PRD data
    const html = template(prdData);
    
    console.log('HTML template compiled successfully');
    
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for load
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000 
    });
    
    console.log('Page content set successfully');
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `PRD_${prdData.product_name.replace(/[^a-zA-Z0-9]/g, '_')}_${prdData.id}_${timestamp}.pdf`;
    tempPdfPath = path.join(tempDir, fileName);
    
    await page.pdf({
      path: tempPdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    console.log('PDF generated successfully:', tempPdfPath);
    
    // Upload to Google Cloud Storage
    const bucket = storage.bucket(bucketName);
    const gcsFileName = `${folderName}/${fileName}`;
    const file = bucket.file(gcsFileName);
    
    // Read the PDF file and upload
    const pdfBuffer = fs.readFileSync(tempPdfPath);
    
    // Upload with public access metadata (for uniform bucket-level access)
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=3600',
        metadata: {
          prdId: prdData.id.toString(),
          productName: prdData.product_name,
          generatedAt: new Date().toISOString(),
          documentVersion: prdData.document_version || '1.0'
        }
      }
    });
    
    console.log(`PDF uploaded to Google Cloud Storage: ${gcsFileName}`);
    
    // Generate public URL (works if bucket is public)
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
    
    console.log('PDF generation completed successfully:', publicUrl);
    
    return {
      success: true,
      url: publicUrl,
      fileName: fileName,
      gcsPath: gcsFileName
    };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    
    // Remove temporary PDF file
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try {
        fs.unlinkSync(tempPdfPath);
        console.log('Temporary PDF file cleaned up');
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up temporary file:', cleanupError.message);
      }
    }
  }
};

module.exports = {
  generatePRDPDF
};