import fs from 'fs';
import path from 'path';

// Simple test to verify PDF extraction functionality
async function testPDFExtraction() {
  try {
    console.log('Testing PDF extraction with pdfreader...');
    
    const PdfReader = (await import('pdfreader')).PdfReader;
    
    // Check if we have any existing PDF file to test with
    const uploadsDir = './uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
      
      if (pdfFiles.length > 0) {
        const testFile = path.join(uploadsDir, pdfFiles[0]);
        console.log('Testing with existing file:', testFile);
        
        const reader = new PdfReader();
        let text = '';
        let lastY = 0;
        
        const extractedText = await new Promise((resolve, reject) => {
          reader.parseFileItems(testFile, (err, item) => {
            if (err) {
              reject(new Error(`PDF parsing failed: ${err.message}`));
              return;
            }
            
            if (!item) {
              // End of file
              const cleanText = text.replace(/\s+/g, ' ').trim();
              resolve(cleanText);
              return;
            }
            
            if (item.text) {
              if (item.y > lastY + 1) {
                text += '\n';
              }
              text += item.text + ' ';
              lastY = item.y;
            }
          });
        });
        
        console.log('Extracted text length:', extractedText.length);
        console.log('Text preview:', extractedText.substring(0, 200) + '...');
        console.log('PDF extraction test: SUCCESS');
        
      } else {
        console.log('No PDF files found in uploads directory for testing');
      }
    } else {
      console.log('Uploads directory does not exist');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    console.log('PDF extraction test: FAILED');
  }
}

testPDFExtraction();