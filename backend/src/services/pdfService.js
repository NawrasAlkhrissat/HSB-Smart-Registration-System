const pdfExtraction = require("pdf-extraction");

const extractTextFromPDF = async (dataBuffer) => {
  try {
    const data = await pdfExtraction(dataBuffer);
    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error(
        "Failed to extract text from PDF. Please check the PDF file.",
      );
    }

    return data.text;
  } catch (error) {
    console.error("PDF-Extraction Error:", error);
    throw new Error("Failed to extract text from PDF: " + error.message);
  }
};

module.exports = { extractTextFromPDF };
