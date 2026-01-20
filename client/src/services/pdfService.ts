import jsPDF from 'jspdf';

interface PDFGeneratorProps {
  lotteryName: string;
  games: number[][];
  participants: string[];
  strategy: string;
  logoUrl: string;
}

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = error => reject(error);
    img.src = url;
  });
};

export const generatePDF = async ({
  lotteryName,
  games,
  participants,
  strategy,
  logoUrl,
}: PDFGeneratorProps) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR');

  // Header Color Bar
  let headerColor = [25, 118, 210]; // Default Blue
  if (lotteryName === 'Mega-Sena') headerColor = [32, 152, 105]; // Green
  if (lotteryName === 'Lotofácil') headerColor = [147, 0, 137]; // Purple
  if (lotteryName === 'Quina') headerColor = [40, 53, 131]; // Dark Blue
  if (lotteryName === 'Lotomania') headerColor = [247, 139, 31]; // Orange

  // Title Section
  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.rect(0, 0, 210, 35, 'F');

  // Add Logo
  try {
    const logoBase64 = await getBase64ImageFromURL(logoUrl);
    // x, y, w, h
    doc.addImage(logoBase64, 'PNG', 14, 5, 25, 25);
  } catch (err) {
    console.warn('Could not load logo for PDF', err);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  // Adjusted X position to accomodate logo
  doc.text(lotteryName.toUpperCase(), 45, 22);

  doc.setFontSize(10);
  doc.text('Loterias AI - Bolão Inteligente', 45, 10);

  doc.setFontSize(12);
  doc.text(`${date} - ${time}`, 195, 22, { align: 'right' });

  let startY = 40;

  // Header Info
  doc.setTextColor(50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Estratégia utilizada: ${
      strategy === 'balanced' ? 'Equilíbrio' : strategy === 'frequency' ? 'Frequência' : 'Atraso'
    }`,
    14,
    startY
  );

  // Participants Section
  if (participants.length > 0) {
    startY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Participantes do Bolão:', 14, startY);

    startY += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(participants.join(', '), 14, startY);
  }

  // Games Table
  startY += 15;

  // Manual Drawing of Games to create Ball Effect (simulating frontend look)

  // Calculate grid
  const pageWidth = 210;
  const margin = 14;

  // Constants for balls
  const ballSize = 8;
  const ballGap = 2;
  const rowGap = 5; // Extra gap between rows

  // Draw customized table-like structure
  doc.setDrawColor(200);
  doc.setLineWidth(0.1);

  let currentY = startY;

  // Table Header
  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('#', margin + 5, currentY + 5.5);
  doc.text('Dezenas Sorteadas', margin + 70, currentY + 5.5);

  currentY += 12;

  games.forEach((game, index) => {
    // Check page break
    if (currentY + 15 > 280) {
      doc.addPage();
      currentY = 20;
    }

    // Row Container
    doc.setFillColor(255, 255, 255);

    // Label "Jogo X"
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'bold');
    doc.text(`Jogo ${index + 1}`, margin + 2, currentY + 6);

    // Draw Balls
    // Start X position for balls (align right-ish or center)
    const startX = margin + 35;

    // Adjust startX if it overflows
    // For Lotomania (many numbers), we might need multilines or smaller balls.
    // Simplifying: If too wide, wrap is complex. Let's assume standard games fit.
    // If lotomania (50 numbers), this will break. Let's fix for Lotomania.

    // Simple Lotomania fix: smaller balls if total > 20
    const effectiveBallSize = game.length > 20 ? 5 : ballSize;
    const effectiveFontSize = game.length > 20 ? 6 : 9;

    game.forEach((num, nIndex) => {
      // Multi-line logic for very large sets (like 50)
      const maxPerRow = 20; // fit ~20 balls per row
      const rowOffset = Math.floor(nIndex / maxPerRow);
      const colOffset = nIndex % maxPerRow;

      const ballX = startX + colOffset * (effectiveBallSize + ballGap);
      const ballY = currentY + rowOffset * (effectiveBallSize + ballGap);

      // Draw Ball Circle (Base Color)
      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.circle(
        ballX + effectiveBallSize / 2,
        ballY + effectiveBallSize / 2,
        effectiveBallSize / 2,
        'F'
      );

      // Pseudo-3D Effect (Lighter Gradient - simplified as a small white circle/shine)
      doc.setFillColor(255, 255, 255);

      // Draw Number
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(effectiveFontSize);
      doc.setFont('helvetica', 'bold');
      const numStr = num.toString().padStart(2, '0');

      // Center text
      doc.text(
        numStr,
        ballX + effectiveBallSize / 2,
        ballY + effectiveBallSize / 2 + effectiveFontSize * 0.1, // Adjusted small offset, rely on baseline: middle
        { align: 'center', baseline: 'middle' }
      );
    });

    // Bottom border for row
    const rowsNeeded = Math.ceil(game.length / 20);
    const rowHeight = rowsNeeded * (effectiveBallSize + ballGap);

    doc.setDrawColor(230);
    doc.line(margin, currentY + rowHeight + 4, pageWidth - margin, currentY + rowHeight + 4);

    currentY += rowHeight + rowGap + 4;
  });

  // Footer

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Boa Sorte! Lembre-se: Jogue com responsabilidade.', 105, 290, { align: 'center' });

  doc.save(`bolao_${lotteryName.toLowerCase().replace(/\s/g, '')}_${date.replace(/\//g, '-')}.pdf`);
};
