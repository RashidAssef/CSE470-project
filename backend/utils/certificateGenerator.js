import PDFDocument from 'pdfkit';

/**
 * Generate a high-resolution, beautifully formatted landscape Certificate of Completion PDF
 * 
 * @param {Object} options
 * @param {string} options.studentName - Full name of the student
 * @param {string} options.courseTitle - Title of the course
 * @param {string} options.instructorName - Lead instructor name
 * @param {string} options.certificateId - Unique certificate ID (e.g. CERT-2026-ABCD-1234)
 * @param {Date|string} options.issueDate - Date certificate was issued
 * @param {number} options.averageScore - Average score across all passed quizzes
 * @param {number} options.quizzesCount - Number of quizzes passed
 * @param {stream.Writable} outputStream - Writable stream (e.g. Express res)
 */
export const generateCertificatePDFStream = (
  {
    studentName = 'Valued Student',
    courseTitle = 'Course of Excellence',
    instructorName = 'Pathway Lead Instructor',
    certificateId = 'CERT-2026-XXXX-XXXX',
    issueDate = new Date(),
    averageScore = 100,
    quizzesCount = 1,
  },
  outputStream
) => {
  // Landscape A4 dimensions: 841.89 x 595.28 points
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    info: {
      Title: `Certificate of Completion - ${courseTitle}`,
      Author: 'Pathway Interactive Learning Platform',
      Subject: 'Certificate of Achievement',
      Keywords: 'certificate, learning, graduation, completion, accreditation',
    },
  });

  doc.pipe(outputStream);

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // Background cream tone
  doc.rect(0, 0, pageWidth, pageHeight).fill('#FBFBFA');

  // ==========================================
  // DECORATIVE BORDERS
  // ==========================================
  // Outer Border (Navy / Charcoal)
  doc
    .rect(20, 20, pageWidth - 40, pageHeight - 40)
    .lineWidth(3)
    .stroke('#0F172A');

  // Inner Border (Warm Gold / Bronze)
  doc
    .rect(28, 28, pageWidth - 56, pageHeight - 56)
    .lineWidth(1.2)
    .stroke('#B45309');

  // Third subtle thin border
  doc
    .rect(32, 32, pageWidth - 64, pageHeight - 64)
    .lineWidth(0.5)
    .stroke('#E2E8F0');

  // Corner Ornaments
  const drawCorner = (x, y, angle) => {
    doc.save();
    doc.translate(x, y);
    doc.rotate(angle);
    doc.lineWidth(1.5).strokeColor('#B45309');
    doc.moveTo(0, 0).lineTo(18, 0).stroke();
    doc.moveTo(0, 0).lineTo(0, 18).stroke();
    doc.circle(9, 9, 2.5).fillAndStroke('#B45309', '#B45309');
    doc.restore();
  };

  drawCorner(36, 36, 0);
  drawCorner(pageWidth - 36, 36, 90);
  drawCorner(pageWidth - 36, pageHeight - 36, 180);
  drawCorner(36, pageHeight - 36, 270);

  // Top header decoration line
  doc.lineWidth(0.75).strokeColor('#D97706');
  doc.moveTo(pageWidth / 2 - 120, 52).lineTo(pageWidth / 2 + 120, 52).stroke();

  // ==========================================
  // HEADER
  // ==========================================
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#475569')
    .text('PATHWAY INTERACTIVE LEARNING PLATFORM', 0, 58, {
      align: 'center',
      characterSpacing: 2,
    });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#94A3B8')
    .text('OFFICIAL VERIFIED ACADEMIC ACCREDITATION', 0, 74, {
      align: 'center',
      characterSpacing: 1.5,
    });

  // Certificate Title
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor('#0F172A')
    .text('CERTIFICATE OF COMPLETION', 0, 102, {
      align: 'center',
      characterSpacing: 1.5,
    });

  // Decorative Ribbon / Diamond
  doc.lineWidth(1).strokeColor('#D97706');
  doc.moveTo(pageWidth / 2 - 140, 140).lineTo(pageWidth / 2 - 20, 140).stroke();
  doc.moveTo(pageWidth / 2 + 20, 140).lineTo(pageWidth / 2 + 140, 140).stroke();

  // Diamond in center of divider
  doc.save();
  doc.translate(pageWidth / 2, 140);
  doc.rotate(45);
  doc.rect(-4, -4, 8, 8).fillAndStroke('#D97706', '#92400E');
  doc.restore();

  // "PROUDLY PRESENTED TO"
  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor('#64748B')
    .text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', 0, 158, {
      align: 'center',
      characterSpacing: 1.8,
    });

  // ==========================================
  // RECIPIENT NAME
  // ==========================================
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor('#0D9488') // Teal brand color
    .text(studentName, 0, 180, {
      align: 'center',
    });

  // Underline beneath name
  doc.lineWidth(1).strokeColor('#CBD5E1');
  doc.moveTo(pageWidth / 2 - 180, 218).lineTo(pageWidth / 2 + 180, 218).stroke();
  doc.lineWidth(0.5).strokeColor('#D97706');
  doc.moveTo(pageWidth / 2 - 120, 221).lineTo(pageWidth / 2 + 120, 221).stroke();

  // Narrative
  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('#334155')
    .text(
      'for successfully mastering the comprehensive curriculum, demonstrating academic excellence,',
      0,
      236,
      { align: 'center', lineHeight: 14 }
    );

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('#334155')
    .text(
      `and passing all required course assessments and quizzes for:`,
      0,
      252,
      { align: 'center' }
    );

  // ==========================================
  // COURSE TITLE
  // ==========================================
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#0F172A')
    .text(`"${courseTitle}"`, 50, 280, {
      align: 'center',
      width: pageWidth - 100,
    });

  // ==========================================
  // METRICS / ACHIEVEMENTS PILLS
  // ==========================================
  const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const badgeY = 340;
  const badgeWidth = 160;
  const badgeHeight = 36;
  const startX = (pageWidth - (badgeWidth * 3 + 40)) / 2;

  // Helper for metrics card
  const drawMetric = (x, label, val) => {
    doc
      .roundedRect(x, badgeY, badgeWidth, badgeHeight, 6)
      .fillAndStroke('#F1F5F9', '#E2E8F0');

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#64748B')
      .text(label.toUpperCase(), x, badgeY + 6, {
        width: badgeWidth,
        align: 'center',
        characterSpacing: 0.8,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0F172A')
      .text(val, x, badgeY + 18, {
        width: badgeWidth,
        align: 'center',
      });
  };

  drawMetric(startX, 'Quiz Grade Average', `${averageScore}%`);
  drawMetric(startX + badgeWidth + 20, 'Assessments Passed', `${quizzesCount} / ${quizzesCount} Passed`);
  drawMetric(startX + (badgeWidth + 20) * 2, 'Completion Date', formattedDate);

  // ==========================================
  // SIGNATURES & OFFICIAL SEAL
  // ==========================================
  const footerBaseY = 445;

  // Left Signature (Instructor)
  const leftSigX = 100;
  doc.lineWidth(1).strokeColor('#64748B');
  doc.moveTo(leftSigX, footerBaseY).lineTo(leftSigX + 180, footerBaseY).stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0F172A')
    .text(instructorName, leftSigX, footerBaseY + 6, {
      width: 180,
      align: 'center',
    });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#64748B')
    .text('Lead Course Instructor', leftSigX, footerBaseY + 20, {
      width: 180,
      align: 'center',
    });

  // Center Gold Seal (Vector-drawn official rosette & seal)
  const sealCenterX = pageWidth / 2;
  const sealCenterY = footerBaseY + 6;

  // Outer starburst/sunburst points
  doc.save();
  doc.translate(sealCenterX, sealCenterY);
  for (let i = 0; i < 24; i++) {
    doc.rotate(15);
    doc.rect(-25, -25, 50, 50).lineWidth(0.5).strokeColor('#F59E0B');
  }
  doc.restore();

  // Seal Circles
  doc.circle(sealCenterX, sealCenterY, 32).fillAndStroke('#FEF3C7', '#D97706');
  doc.circle(sealCenterX, sealCenterY, 28).lineWidth(1).stroke('#B45309');
  doc.circle(sealCenterX, sealCenterY, 25).lineWidth(0.5).stroke('#D97706');

  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor('#92400E')
    .text('VERIFIED', sealCenterX - 25, sealCenterY - 11, {
      width: 50,
      align: 'center',
      characterSpacing: 1,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#B45309')
    .text('EXCELLENCE', sealCenterX - 30, sealCenterY - 2, {
      width: 60,
      align: 'center',
      characterSpacing: 0.5,
    });

  doc
    .font('Helvetica')
    .fontSize(6)
    .fillColor('#92400E')
    .text('ACADEMIC SEAL', sealCenterX - 25, sealCenterY + 9, {
      width: 50,
      align: 'center',
      characterSpacing: 0.5,
    });

  // Right Signature (Academic Director)
  const rightSigX = pageWidth - 280;
  doc.lineWidth(1).strokeColor('#64748B');
  doc.moveTo(rightSigX, footerBaseY).lineTo(rightSigX + 180, footerBaseY).stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0F172A')
    .text('Pathway Academic Board', rightSigX, footerBaseY + 6, {
      width: 180,
      align: 'center',
    });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#64748B')
    .text('Accreditation & Certification', rightSigX, footerBaseY + 20, {
      width: 180,
      align: 'center',
    });

  // ==========================================
  // FOOTER & VERIFICATION ID
  // ==========================================
  doc.lineWidth(0.5).strokeColor('#E2E8F0');
  doc.moveTo(40, 520).lineTo(pageWidth - 40, 520).stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#475569')
    .text(`Certificate ID: ${certificateId}`, 50, 532, {
      align: 'left',
      characterSpacing: 0.8,
    });

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor('#94A3B8')
    .text(
      `Secure Digital Credential • Issued by Pathway Interactive Learning Platform • Validated via Assessment Mastery`,
      pageWidth / 2 - 200,
      532,
      {
        width: 400,
        align: 'center',
      }
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#0D9488')
    .text(`Status: VERIFIED VALID`, pageWidth - 230, 532, {
      align: 'right',
      width: 180,
    });

  doc.end();
};
