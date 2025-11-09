import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FormData {
  clientName: string;
  gender: string;
  age: string;
  weight: string;
  height: string;
  goal: string;
  dietType: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  startDate: string;
  trainerName: string;
  waterIntake: string;
  supplements: string;
  notes: string;
}

interface MealData {
  earlyMorning: string;
  preWorkout: string;
  postWorkout: string;
  breakfast: string;
  midMorning: string;
  lunch: string;
  eveningSnack: string;
  dinner: string;
  bedtime: string;
}

const LIME_GREEN: [number, number, number] = [164, 255, 46];
const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

async function loadSvgAsPngDataUrl(src: string, pixelWidth: number, pixelHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.clearRect(0, 0, pixelWidth, pixelHeight);
      ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Load a raster image and apply global alpha to create a light watermark-like PNG
async function loadImageAsPngDataUrl(src: string, opacity = 0.70): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = Math.max(0, Math.min(opacity, 1));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export const generateDietPlanPDF = async (formData: FormData, meals: MealData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 30; // left+right margins = 15+15
  let yPosition = 20;

  // Preload logo (convert SVG to PNG data URL for jsPDF)
  // Served from public/ as /Asset 41.svg
  const logoPngDataUrl = await loadSvgAsPngDataUrl("/Asset 41.svg", 800, 160);
  const logoProps = doc.getImageProperties(logoPngDataUrl);
  const desiredLogoHeight = 16; // mm, fits in header bar comfortably
  const logoAspect = logoProps.width / logoProps.height;
  const desiredLogoWidth = desiredLogoHeight * logoAspect;

  // Preload light background image (served from public/)
  const bgImagePngDataUrl = await loadImageAsPngDataUrl("/Screenshot 2025-11-01 at 2.06.24 PM.png", 0.12);
  const bgProps = doc.getImageProperties(bgImagePngDataUrl);
  const bgAspect = bgProps.width / bgProps.height;
  const pageAspect = pageWidth / pageHeight;
  // Cover-fit calculation
  const bgWidth = bgAspect >= pageAspect ? pageHeight * bgAspect : pageWidth;
  const bgHeight = bgAspect >= pageAspect ? pageHeight : pageWidth / bgAspect;
  const bgX = (pageWidth - bgWidth) / 2;
  const bgY = (pageHeight - bgHeight) / 2;

  // Track which pages we've painted (background + header), to avoid duplicates with multiple tables
  const backgroundPaintedPages = new Set<number>();
  const headerPaintedPages = new Set<number>();

  // Helper to write long paragraphs across pages cleanly
  const writeParagraph = (text: string, x: number, y: number, maxWidth: number) => {
    const sanitized = sanitizeTextForPdf(text);
    const lines = doc.splitTextToSize(sanitized, maxWidth);
    const lineHeight = 5; // consistent visual rhythm
    for (const line of lines) {
      if (y > pageHeight - 30) {
        doc.addPage();
        paintPageBackgroundIfNeeded();
        paintHeaderIfNeeded();
        y = 20;
      }
      doc.text(line, x, y);
      y += lineHeight;
    }
    return y;
  };

  // Replace emojis and unsupported glyphs with ASCII-safe text, normalize bullets/dashes
  function sanitizeTextForPdf(text: string): string {
    if (!text) return "";
    let t = text;
    // Common replacements
    t = t.replace(/✅/g, "[OK]");
    t = t.replace(/🍞/g, "[Bread]");
    t = t.replace(/≈/g, "~");
    // Normalize bullets/dashes
    t = t.replace(/\u2022/g, "- "); // •
    t = t.replace(/\u2013/g, "-");  // –
    t = t.replace(/\u2014/g, "-");  // —
    // Normalize quotes
    t = t.replace(/[\u2018\u2019]/g, "'"); // ‘ ’
    t = t.replace(/[\u201C\u201D]/g, '"'); // “ ”
    // Normalize spaces: no-break, thin, em/en spaces, zero-width
    t = t.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ");
    // Remove remaining emoji/symbol ranges (monochrome only fallback; jsPDF helvetica cannot render)
    t = t.replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
    // Collapse spaces
    t = t.replace(/\t/g, " ");
    t = t.replace(/ {2,}/g, " ");
    return t;
  }
  
  // Add safe line breaks at pipe separators to prevent horizontal overflow in dense metric lines
  function formatCellText(text: string): string {
    const sanitized = sanitizeTextForPdf(text);
    // Break at pipes so each metric goes on its own line
    return sanitized.replace(/\s*\|\s*/g, " |\n");
  }

  const paintPageBackgroundIfNeeded = () => {
    const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber as number;
    if (backgroundPaintedPages.has(currentPage)) return;
    doc.setFillColor(...BLACK);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    // Light background image (watermark style), behind content
    try {
      doc.addImage(bgImagePngDataUrl, "PNG", bgX, bgY, bgWidth, bgHeight);
    } catch {
      // ignore if image fails; keep solid background
    }
    backgroundPaintedPages.add(currentPage);
  };

  const paintHeaderIfNeeded = () => {
    const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber as number;
    if (headerPaintedPages.has(currentPage)) return;
    // Header bar
    doc.setFillColor(...BLACK);
    doc.rect(0, 0, pageWidth, 45, "F");
    // Centered logo only on first page
    if (currentPage === 1) {
      const logoX = (pageWidth - desiredLogoWidth) / 2;
      const logoY = 14; // visually centered in header bar
      doc.addImage(logoPngDataUrl, "PNG", logoX, logoY, desiredLogoWidth, desiredLogoHeight);
      // Subtitle below logo
      doc.setFontSize(12);
      doc.setTextColor(...LIME_GREEN);
      doc.setFont("helvetica", "bold");
      doc.text("Your Personalized G-FORCE Diet Plan.", pageWidth / 2, 36, { align: "center" });
    }
    headerPaintedPages.add(currentPage);
  };

  // Full black background
  paintPageBackgroundIfNeeded();

  // Header with G-FORCE Branding
  paintHeaderIfNeeded();

  yPosition = 55;

  // Client Information Section
  doc.setDrawColor(...LIME_GREEN);
  doc.setLineWidth(0.5);
  doc.line(10, yPosition, pageWidth - 10, yPosition);
  
  yPosition += 5;
  
  doc.setFontSize(12);
  doc.setTextColor(...LIME_GREEN);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT INFORMATION", 15, yPosition);
  
  yPosition += 8;

  const clientInfo = [
    ["Name", sanitizeTextForPdf(formData.clientName)],
    ["Gender", sanitizeTextForPdf(formData.gender || "N/A")],
    ["Age", sanitizeTextForPdf(formData.age)],
    ["Weight", sanitizeTextForPdf(formData.weight ? `${formData.weight} kg` : "N/A")],
    ["Height", sanitizeTextForPdf(formData.height ? `${formData.height} cm` : "N/A")],
    ["Goal", sanitizeTextForPdf(formData.goal || "N/A")],
    ["Diet Type", sanitizeTextForPdf(formData.dietType || "N/A")],
    ["Start Date", sanitizeTextForPdf(formData.startDate || "N/A")],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: clientInfo,
    theme: "plain",
    styles: {
      fontSize: 10,
      textColor: WHITE,
      cellPadding: 4,
      valign: "top",
      halign: "left",
      overflow: "linebreak",
      lineColor: LIME_GREEN,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: LIME_GREEN, cellWidth: 50 },
      1: { cellWidth: contentWidth - 50 },
    },
    tableWidth: contentWidth,
    margin: { left: 15, right: 15, top: 55 },
    // Ensure background/header are painted on any new pages the table creates
    willDrawCell: () => {
      paintPageBackgroundIfNeeded();
    },
    didDrawPage: () => {
      paintHeaderIfNeeded();
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Macros Section
  doc.setDrawColor(...LIME_GREEN);
  doc.line(10, yPosition, pageWidth - 10, yPosition);
  
  yPosition += 5;
  
  doc.setFontSize(12);
  doc.setTextColor(...LIME_GREEN);
  doc.text("DAILY MACROS TARGET", 15, yPosition);
  
  yPosition += 8;

  const macrosInfo = [
    ["Calories", sanitizeTextForPdf(formData.calories ? `${formData.calories} kcal` : "N/A")],
    ["Protein", sanitizeTextForPdf(formData.protein ? `${formData.protein}g` : "N/A")],
    ["Carbs", sanitizeTextForPdf(formData.carbs ? `${formData.carbs}g` : "N/A")],
    ["Fat", sanitizeTextForPdf(formData.fat ? `${formData.fat}g` : "N/A")],
    ["Water Intake", sanitizeTextForPdf(formData.waterIntake ? `${formData.waterIntake}L/day` : "N/A")],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: macrosInfo,
    theme: "plain",
    styles: {
      fontSize: 10,
      textColor: WHITE,
      cellPadding: 4,
      valign: "top",
      halign: "left",
      overflow: "linebreak",
      lineColor: LIME_GREEN,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: LIME_GREEN, cellWidth: 50 },
      1: { cellWidth: contentWidth - 50 },
    },
    tableWidth: contentWidth,
    margin: { left: 15, right: 15, top: 55 },
    willDrawCell: () => {
      paintPageBackgroundIfNeeded();
    },
    didDrawPage: () => {
      paintHeaderIfNeeded();
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    // Add black background to new page
    paintPageBackgroundIfNeeded();
    paintHeaderIfNeeded();
    yPosition = 20;
  }

  // Meal Plan Section
  doc.setDrawColor(...LIME_GREEN);
  doc.line(10, yPosition, pageWidth - 10, yPosition);
  
  yPosition += 5;
  
  doc.setFontSize(12);
  doc.setTextColor(...LIME_GREEN);
  doc.text("DAILY MEAL SCHEDULE", 15, yPosition);
  
  yPosition += 8;

  const mealSchedule = [
    ["Early Morning", formatCellText(meals.earlyMorning || "Not specified")],
    ["Pre-Workout", formatCellText(meals.preWorkout || "Not specified")],
    ["Post-Workout", formatCellText(meals.postWorkout || "Not specified")],
    ["Breakfast", formatCellText(meals.breakfast || "Not specified")],
    ["Mid-Morning Snack", formatCellText(meals.midMorning || "Not specified")],
    ["Lunch", formatCellText(meals.lunch || "Not specified")],
    ["Evening Snack", formatCellText(meals.eveningSnack || "Not specified")],
    ["Dinner", formatCellText(meals.dinner || "Not specified")],
    ["Bedtime", formatCellText(meals.bedtime || "Not specified")],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: mealSchedule,
    theme: "plain",
    styles: {
      fontSize: 9,
      textColor: WHITE,
      cellPadding: 5,
      overflow: "linebreak",
      valign: "top",
      halign: "left",
      lineColor: LIME_GREEN,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: LIME_GREEN, cellWidth: 50 },
      1: { cellWidth: contentWidth - 50 },
    },
    tableWidth: contentWidth,
    margin: { left: 15, right: 15, top: 55 },
    willDrawCell: () => {
      paintPageBackgroundIfNeeded();
    },
    didDrawPage: () => {
      paintHeaderIfNeeded();
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page for supplements and notes
  if (yPosition > 240) {
    doc.addPage();
    // Add black background to new page
    paintPageBackgroundIfNeeded();
    paintHeaderIfNeeded();
    yPosition = 20;
  }

  // Supplements Section
  if (formData.supplements) {
    doc.setDrawColor(...LIME_GREEN);
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    
    yPosition += 5;
    
    doc.setFontSize(12);
    doc.setTextColor(...LIME_GREEN);
    doc.text("SUPPLEMENTS", 15, yPosition);
    
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    yPosition = writeParagraph(formData.supplements, 15, yPosition, pageWidth - 30);
    yPosition += 10;
  }

  // Notes Section
  if (formData.notes) {
    if (yPosition > 240) {
      doc.addPage();
      // Add black background to new page
      paintPageBackgroundIfNeeded();
      paintHeaderIfNeeded();
      yPosition = 20;
    }

    doc.setDrawColor(...LIME_GREEN);
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    
    yPosition += 5;
    
    doc.setFontSize(12);
    doc.setTextColor(...LIME_GREEN);
    doc.text("TIPS & GUIDELINES", 15, yPosition);
    
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    yPosition = writeParagraph(formData.notes, 15, yPosition, pageWidth - 30);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LIME_GREEN);
    doc.line(10, doc.internal.pageSize.getHeight() - 20, pageWidth - 10, doc.internal.pageSize.getHeight() - 20);
    
    doc.setFontSize(9);
    doc.setTextColor(...LIME_GREEN);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Prepared by ${formData.trainerName} | Fuel Your Power`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 12,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `${formData.clientName.replace(/\s+/g, "_")}_DietPlan_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
};
