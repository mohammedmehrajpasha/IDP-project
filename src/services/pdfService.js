const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { checklistSchema, sectionLabels } = require('../data/inspectionCategories');

class PDFService {
  static async generateInspectionReportPDF(reportData) {
    return new Promise((resolve, reject) => {
      // Read the HTML template
      const templatePath = path.join(__dirname, '../view/templates/reportTemplate.ejs');
      const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
      
      // Render the template with data
      const renderedHTML = ejs.render(htmlTemplate, {
        ...reportData,
        checklistSchema,
        sectionLabels,
        scoreColor: this.getScoreColor(reportData.report.hygiene_score)
      });

      const options = {
        format: 'A4',
        border: {
          top: '20mm',
          right: '10mm',
          bottom: '20mm',
          left: '10mm'
        },
        header: {
          height: '15mm',
          contents: '<div style="text-align: center; font-size: 10px;">Food Hygiene Inspection Report</div>'
        },
        footer: {
          height: '15mm',
          contents: {
            default: '<div style="text-align: center; font-size: 10px; color: #666;">Page {{page}} of {{pages}}</div>'
          }
        }
      };

      pdf.create(renderedHTML, options).toBuffer((err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });
    });
  }

  static getScoreColor(score) {
    return score >= 4 ? 'green' : score >= 3 ? 'orange' : 'red';
  }
}

module.exports = PDFService;