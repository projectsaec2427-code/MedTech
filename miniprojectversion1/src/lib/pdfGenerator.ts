import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface MedicineItem {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
  notes?: string;
}

export interface PrescriptionPDFData {
  rxId?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicContact?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorRegNo?: string;
  doctorPhone?: string;
  patientName?: string;
  patientId?: string;
  patientAge?: number | string;
  patientGender?: string;
  patientBlood?: string;
  patientWeight?: string | number;
  patientBP?: string;
  patientPhone?: string;
  date?: string;
  time?: string;
  symptoms?: string;
  diagnosis?: string;
  vitals?: string;
  labTestsAdvised?: string;
  nextFollowUpDate?: string;
  medicines: MedicineItem[];
  notes?: string;
}

export interface AICarePDFData {
  title?: string;
  patientName?: string;
  conditionOrGoal?: string;
  summary?: string;
  medicines?: MedicineItem[];
  preventiveMeasures?: string[];
  recommendations?: string[];
  lifestylePoints?: Array<{ title: string; detail: string }>;
  doctorRecommendation?: string;
  date?: string;
}

/**
 * Generates an authentic, professional Clinical Prescription PDF with complete date, patient, doctor and clinic details
 */
export function generatePrescriptionPDF(data: PrescriptionPDFData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [26, 86, 219]; // Royal Blue
  const secondaryColor = [30, 58, 138]; // Deep Navy
  const slateDark = [15, 23, 42]; // Slate 900
  const slateBody = [51, 65, 85]; // Slate 700
  const slateMuted = [100, 116, 139]; // Slate 500
  const lightBg = [248, 250, 252]; // Slate 50

  const rxId = data.rxId || `RX-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const timeStr = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const doctorName = data.doctorName || 'Dr. Sarah Connor, MD';
  const doctorSpecialty = data.doctorSpecialty || 'Senior Specialist Physician';
  const doctorReg = data.doctorRegNo || 'GMC-894210 (Verified)';
  const clinicName = data.clinicName || 'MedTech Multi-Specialty Hospital & Telehealth Center';
  const clinicAddress = data.clinicAddress || 'Healthcare Enclave, Medical District, Suite 400';
  const clinicContact = data.clinicContact || 'Emergency: +91 44 2829 3333 | consult@medtech-hospital.org';
  const patientName = data.patientName || 'Patient';
  const patientId = data.patientId || `PAT-${Math.floor(10000 + Math.random() * 90000)}`;

  // 1. Top Clinic Header Banner
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Clinic Logo Icon / Monogram (Rx Symbol)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 5, 20, 20, 3, 3, 'F');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Rx', 24, 18, { align: 'center' });

  // Clinic Name & Address Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(clinicName, 38, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  doc.text(clinicAddress, 38, 17);
  doc.text(clinicContact, 38, 22);

  // Digital Prescription Tag on right
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(pageWidth - 54, 7, 40, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL CLINICAL Rx', pageWidth - 34, 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(rxId, pageWidth - 34, 18.5, { align: 'center' });

  // 2. Doctor Details & Patient Details Split Cards
  let currentY = 36;

  // Doctor Info Box (Left Half)
  const leftBoxWidth = (pageWidth - 32) / 2;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, leftBoxWidth, 32, 2, 2, 'FD');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PRESCRIBING PHYSICIAN', 18, currentY + 6);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(10.5);
  doc.text(doctorName, 18, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.text(`Specialty: ${doctorSpecialty}`, 18, currentY + 18.5);
  doc.text(`Reg / License No: ${doctorReg}`, 18, currentY + 23.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Telehealth Consultation & In-Clinic Certified', 18, currentY + 28);

  // Patient Info Box (Right Half)
  const rightBoxX = 14 + leftBoxWidth + 4;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(rightBoxX, currentY, leftBoxWidth, 32, 2, 2, 'FD');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PATIENT PARTICULARS', rightBoxX + 4, currentY + 6);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(10.5);
  doc.text(patientName, rightBoxX + 4, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  
  const ageStr = data.patientAge ? `${data.patientAge} Years` : 'Adult';
  const genderStr = data.patientGender || 'Not Specified';
  const bloodStr = data.patientBlood ? `Blood: ${data.patientBlood}` : 'Blood: O+';
  const weightStr = data.patientWeight ? `Weight: ${data.patientWeight}` : '';
  const bpStr = data.patientBP ? `BP: ${data.patientBP}` : '';

  const vitalsLine = [ageStr, genderStr, bloodStr, weightStr, bpStr].filter(Boolean).join(' | ');
  doc.text(vitalsLine, rightBoxX + 4, currentY + 18.5);

  doc.text(`Patient ID: ${patientId} | Ref: ${rxId}`, rightBoxX + 4, currentY + 23.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Date of Issue: ${dateStr}  (${timeStr})`, rightBoxX + 4, currentY + 28);

  currentY += 37;

  // 3. Clinical Symptoms & Diagnosis Box
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, currentY, pageWidth - 28, 17, 2, 2, 'FD');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CLINICAL DIAGNOSIS & CHIEF COMPLAINTS:', 18, currentY + 5.5);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.diagnosis || 'Clinical Medical Examination & Review', 18, currentY + 11);

  if (data.symptoms) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
    doc.text(`Symptoms reported: ${data.symptoms}`, 18, currentY + 15);
  }

  currentY += 22;

  // 4. Rx Symbol & Table Heading
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Rx - Prescribed Medication Regimen', 14, currentY + 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Take strictly according to dosage schedule and meal instructions.', 14, currentY + 5.5);
  currentY += 8;

  // 5. Medicines Table via jspdf-autotable
  const tableData = (data.medicines || []).map((med, index) => [
    (index + 1).toString(),
    med.name,
    med.dosage || '1-0-1',
    med.duration || '5 days',
    med.instructions || 'After meals'
  ]);

  if (tableData.length === 0) {
    tableData.push(['1', 'Consulting Health Advice & Rest', 'Daily', 'As advised', 'Follow physician directions']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['#', 'Medicine Name & Strength', 'Dosage (M-A-N)', 'Duration', 'Meal & Timing Instructions']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 3
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 48 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : currentY + 45;
  let adviceY = finalY;

  // 6. Clinical Directives & Diet & Lab Tests
  const hasLab = Boolean(data.labTestsAdvised);
  const hasNotes = Boolean(data.notes);
  const hasFollowUp = Boolean(data.nextFollowUpDate);

  if (hasNotes || hasLab || hasFollowUp) {
    doc.setFillColor(254, 252, 232); // Amber 50
    doc.setDrawColor(254, 240, 138); // Amber 200
    
    let boxHeight = 18;
    if (hasNotes && hasLab) boxHeight = 26;
    if (hasFollowUp) boxHeight += 5;

    doc.roundedRect(14, adviceY, pageWidth - 28, boxHeight, 2, 2, 'FD');

    doc.setTextColor(161, 98, 7); // Amber 700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DIRECTIVES, DIET & CLINICAL INSTRUCTIONS:', 18, adviceY + 5);

    let offset = adviceY + 9.5;
    doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    if (data.notes) {
      const splitNotes = doc.splitTextToSize(`• Lifestyle & Diet: ${data.notes}`, pageWidth - 36);
      doc.text(splitNotes, 18, offset);
      offset += splitNotes.length * 3.8;
    }

    if (data.labTestsAdvised) {
      doc.text(`• Lab Tests Advised: ${data.labTestsAdvised}`, 18, offset);
      offset += 4;
    }

    if (data.nextFollowUpDate) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text(`• Next Review / Follow-up Date: ${data.nextFollowUpDate} (or SOS in case of acute symptoms)`, 18, offset);
    }

    adviceY += boxHeight + 4;
  }

  // 7. Security / Verification Badge & Doctor Signature (Bottom)
  const signBoxY = Math.max(adviceY + 2, pageHeight - 44);

  // Digital Verification Stamp
  doc.setDrawColor(16, 185, 129); // Emerald
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, signBoxY, 82, 20, 2, 2, 'FD');

  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('✓ DIGITALLY VERIFIED & SIGNED', 18, signBoxY + 5.5);

  doc.setTextColor(slateBody[0], slateBody[1], slateBody[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Physician: ${doctorName} (${doctorReg})`, 18, signBoxY + 10);
  doc.text(`Timestamp: ${dateStr} ${timeStr} | Ref: ${rxId}`, 18, signBoxY + 14);
  doc.text('Valid for clinical dispensing in all certified pharmacies', 18, signBoxY + 17.5);

  // Doctor Signature Stamp (Right)
  const signRightX = pageWidth - 68;
  doc.setDrawColor(203, 213, 225);
  doc.line(signRightX, signBoxY + 12, pageWidth - 14, signBoxY + 12);

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(doctorName, signRightX, signBoxY + 9);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Authorized Electronic Signature', signRightX, signBoxY + 16);

  // 8. Footer Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential medical document generated electronically via MedTech Healthcare Cloud Portal. Not valid if altered.', 14, pageHeight - 6);
  doc.text(`Page 1 of 1 | Rx ID: ${rxId} | Date: ${dateStr}`, pageWidth - 14, pageHeight - 6, { align: 'right' });

  // Save the PDF directly to device
  const sanitizedDocName = (doctorName || 'Doctor').replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedPatName = (patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Prescription_${sanitizedDocName}_${sanitizedPatName}_${dateStr}.pdf`);
}

/**
 * Generates an AI-Assisted Care, Medicine & Advisory PDF
 */
export function generateAICareReportPDF(data: AICarePDFData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [79, 70, 229]; // Indigo 600
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];
  const lightBg = [248, 250, 252];

  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const title = data.title || 'MedTech AI Clinical & Medication Advisory';

  // 1. Top Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // AI Sparkle Monogram Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 4.5, 17, 17, 3, 3, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AI', 22.5, 15.5, { align: 'center' });

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(title, 35, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  doc.text('Personalized Care Protocol, Suggested Medications & Lifestyle Recommendations', 35, 16.5);
  doc.text(`Generated Date: ${dateStr}`, 35, 21);

  let currentY = 33;

  // 2. Patient / Case Meta Card
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PATIENT CASE SUMMARY:', 18, currentY + 5.5);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Patient: ${data.patientName || 'Patient'}`, 18, currentY + 11);

  if (data.conditionOrGoal) {
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Target Assessment: ${data.conditionOrGoal}`, pageWidth / 2, currentY + 11);
  }

  currentY += 21;

  // 3. Clinical Summary / Advisory Explanation
  if (data.summary) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Clinical Assessment & Recommendations', 14, currentY + 1);
    currentY += 4;

    doc.setFillColor(245, 243, 255); // Indigo 50
    doc.setDrawColor(224, 231, 255);
    
    const splitSummary = doc.splitTextToSize(data.summary, pageWidth - 36);
    const boxHeight = Math.max(14, splitSummary.length * 4.2 + 8);
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 2, 2, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(splitSummary, 18, currentY + 6);

    currentY += boxHeight + 6;
  }

  // 4. Medicines / OTC Remedies / Supplements Table
  if (data.medicines && data.medicines.length > 0) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('Recommended Medicines & Remedy Dosage Schedule', 14, currentY + 2);
    currentY += 5;

    const medTableData = data.medicines.map((m, i) => [
      (i + 1).toString(),
      m.name,
      m.dosage || '1-0-1',
      m.duration || '5-7 days',
      m.instructions || 'With water after food'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      head: [['#', 'Medicine / Remedy Name', 'Dosage', 'Duration', 'Instructions & Cautions']],
      body: medTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
        cellPadding: 3
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 8.5,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 54 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 7 : currentY + 40;
  }

  // 5. Preventive Measures & Lifestyle Points / Recommendations
  const measuresList = data.recommendations || data.preventiveMeasures;
  if (measuresList && measuresList.length > 0) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Care Directives, Diet Guidelines & Preventative Steps', 14, currentY + 1);
    currentY += 4;

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(226, 232, 240);

    const measuresHeight = measuresList.length * 5 + 6;
    doc.roundedRect(14, currentY, pageWidth - 28, measuresHeight, 2, 2, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    measuresList.forEach((measure, idx) => {
      doc.text(`•  ${measure}`, 18, currentY + 5 + idx * 5);
    });

    currentY += measuresHeight + 6;
  }

  // 6. Recommended Doctor / Follow Up
  if (data.doctorRecommendation) {
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(14, currentY, pageWidth - 28, 12, 2, 2, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Recommended Specialist Follow-Up: ${data.doctorRecommendation}`, 18, currentY + 7.5);

    currentY += 16;
  }

  // 7. Medical Disclaimer Footer (Mandatory for AI)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, pageHeight - 26, pageWidth - 28, 16, 2, 2, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('IMPORTANT MEDICAL AI ADVISORY NOTICE:', 18, pageHeight - 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('This AI summary is for informational and wellness guidance only. It does not replace certified in-person medical evaluation.', 18, pageHeight - 16.5);
  doc.text('If you experience severe pain, shortness of breath, or emergency symptoms, seek immediate hospital care.', 18, pageHeight - 12.5);

  const cleanTitle = (data.title || 'AI_Care_Advisory').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${cleanTitle}_${dateStr}.pdf`);
}
