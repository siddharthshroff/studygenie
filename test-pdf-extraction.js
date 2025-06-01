import fs from 'fs';
import path from 'path';

// Simple test to verify PDF extraction functionality
async function testPDFExtraction() {
  try {
    console.log('Testing PDF extraction with pdfreader...');
    
    const PdfReader = (await import('pdfreader')).PdfReader;
    
    // Test with a known PDF file
    const testFile = './node_modules/pdf-extraction/test/data/01-valid.pdf';
    if (fs.existsSync(testFile)) {
      console.log('Testing with file:', testFile);
        
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
      console.log('Test PDF file not found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    console.log('PDF extraction test: FAILED');
  }
}

testPDFExtraction();