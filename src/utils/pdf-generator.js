const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Initialize Google Cloud Storage with environment-aware configuration
let storage;

if (process.env.NODE_ENV === 'production') {
  // In production (Cloud Run), use default credentials
  console.log('Using default Google Cloud credentials for production');
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
  });
} else {
  // In development, use service account key file
  console.log('Using service account key file for development');
  const keyFilename = process.env.GCP_STORAGE_KEYFILE;
  
  if (keyFilename && fs.existsSync(keyFilename)) {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: keyFilename, 
    });
  } else {
    // Fallback to default credentials even in development
    console.warn('Service account key file not found, using default credentials');
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }
}

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

// Add new helper for timeline period formatting
Handlebars.registerHelper('formatTimelinePeriod', function(timelinePeriod) {
  if (!timelinePeriod) return 'N/A';
  
  // Check if it's already in the correct format (contains month names)
  if (timelinePeriod.includes('January') || timelinePeriod.includes('February') || 
      timelinePeriod.includes('March') || timelinePeriod.includes('April') ||
      timelinePeriod.includes('May') || timelinePeriod.includes('June') ||
      timelinePeriod.includes('July') || timelinePeriod.includes('August') ||
      timelinePeriod.includes('September') || timelinePeriod.includes('October') ||
      timelinePeriod.includes('November') || timelinePeriod.includes('December')) {
    return timelinePeriod;
  }
  
  // Try to parse date ranges like "2025-06-15 - 2025-07-31"
  const dateRangeMatch = timelinePeriod.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/);
  if (dateRangeMatch) {
    const startDate = new Date(dateRangeMatch[1]);
    const endDate = new Date(dateRangeMatch[2]);
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    
    const formattedStart = startDate.toLocaleDateString('en-US', options);
    const formattedEnd = endDate.toLocaleDateString('en-US', options);
    
    return `${formattedStart} - ${formattedEnd}`;
  }
  
  // Try to parse single date like "2025-06-15"
  const singleDateMatch = timelinePeriod.match(/^\d{4}-\d{2}-\d{2}$/);
  if (singleDateMatch) {
    const date = new Date(timelinePeriod);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Return as-is if no date pattern matches
  return timelinePeriod;
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
    
    // Configure Puppeteer for different environments
    const puppeteerConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    };

    // In production (Cloud Run), use the installed Chrome
    if (process.env.NODE_ENV === 'production') {
      puppeteerConfig.executablePath = '/usr/bin/google-chrome-stable';
      console.log('Using system Chrome for production');
    } else {
      console.log('Using bundled Chromium for development');
    }
    
    // Launch Puppeteer
    browser = await puppeteer.launch(puppeteerConfig);
    
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
      try {
        await browser.close();
      } catch (closeError) {
        console.warn('Warning: Could not close browser:', closeError.message);
      }
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