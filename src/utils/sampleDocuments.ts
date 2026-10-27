export interface PreloadedSampleDoc {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedOutcome: string;
  type: 'image/png';
  generate: () => Promise<string>;
}

/**
 * Creates high-fidelity canvas-rendered sample documents
 */
export const SAMPLE_DOCUMENTS: PreloadedSampleDoc[] = [
  {
    id: 'sample-tampered-bank-statement',
    name: 'Altered Bank Statement (Financial Tamper)',
    category: 'Forensic Detection',
    description: 'A bank statement with account balance modified from $4,500 to $124,500 using secondary digital insertion.',
    expectedOutcome: 'ELA Forensics will light up the balance row with acute luminescence; edge detector reveals splice boundary.',
    type: 'image/png',
    generate: async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1500;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // Crisp textured paper background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 1200, 1500);

      // Header Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(60, 60, 1080, 110);

      // Bank Brand
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 28px sans-serif';
      ctx.fillText('APEX MERIDIAN BANK', 95, 115);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 14px sans-serif';
      ctx.fillText('GLOBAL PRIVATE WEALTH MANAGEMENT • STATEMENT OF ASSETS', 95, 142);

      // Customer Info
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 18px sans-serif';
      ctx.fillText('ACCOUNT HOLDER: ALEXANDER M. VANCE', 80, 230);
      ctx.font = '500 15px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Account Number: **** **** 8821', 80, 260);
      ctx.fillText('Statement Period: October 01 - October 31, 2026', 80, 285);
      ctx.fillText('Currency: USD ($)', 80, 310);

      // Table Header
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(80, 360, 1040, 48);
      ctx.fillStyle = '#334155';
      ctx.font = '700 15px sans-serif';
      ctx.fillText('DATE', 105, 390);
      ctx.fillText('TRANSACTION DESCRIPTION', 240, 390);
      ctx.fillText('CATEGORY', 660, 390);
      ctx.fillText('AMOUNT', 950, 390);

      // Rows
      const rows = [
        { date: '10/04/2026', desc: 'Direct Deposit - Global Tech Inc Payroll', cat: 'Income', amt: '+$4,250.00' },
        { date: '10/08/2026', desc: 'Wire Transfer - Apex Commercial Realty', cat: 'Investment', amt: '-$1,820.00' },
        { date: '10/12/2026', desc: 'Dividend Reinvestment Q3 Distribution', cat: 'Securities', amt: '+$640.50' },
        { date: '10/19/2026', desc: 'Executive Health & Medical Retainer', cat: 'Healthcare', amt: '-$350.00' },
        { date: '10/24/2026', desc: 'Venture Capital Capital Call Series B', cat: 'Investment', amt: '-$2,100.00' }
      ];

      rows.forEach((r, idx) => {
        const y = 445 + idx * 60;
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f1f5f9';
        ctx.fillRect(80, y - 32, 1040, 52);
        ctx.fillStyle = '#334155';
        ctx.font = '500 15px monospace';
        ctx.fillText(r.date, 105, y);
        ctx.fillText(r.desc, 240, y);
        ctx.fillText(r.cat, 660, y);
        ctx.font = '700 15px monospace';
        ctx.fillStyle = r.amt.startsWith('+') ? '#059669' : '#dc2626';
        ctx.fillText(r.amt, 950, y);
      });

      // BALANCE SUMMARY BOX
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.fillRect(80, 820, 1040, 180);
      ctx.strokeRect(80, 820, 1040, 180);

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 20px sans-serif';
      ctx.fillText('ACCOUNT LIQUIDITY SUMMARY', 115, 870);

      ctx.fillStyle = '#475569';
      ctx.font = '500 16px sans-serif';
      ctx.fillText('Total Beginning Liquid Ledger: $5,879.50', 115, 910);
      ctx.fillText('Total Outflows & Debits: -$4,270.00', 115, 945);

      // *** THE TAMPERED SECTION (Simulate digital splice) ***
      // Pasted block rectangle with different compression artifact noise
      const spliceX = 720;
      const spliceY = 880;
      const spliceW = 340;
      const spliceH = 75;

      // Noticeable slight pixel mismatch background (like pasted white box)
      ctx.fillStyle = '#fefefe';
      ctx.fillRect(spliceX, spliceY, spliceW, spliceH);

      // High-contrast sharp artificial boundary
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(spliceX - 2, spliceY - 2, spliceW + 4, spliceH + 4);

      // Artificial injected text with high frequency contrast
      ctx.fillStyle = '#020617';
      ctx.font = '900 32px "Courier New", monospace'; // font discrepancy
      ctx.fillText('$124,500.00', spliceX + 35, spliceY + 48);

      // Label
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 17px sans-serif';
      ctx.fillText('VERIFIED ENDING BALANCE:', spliceX + 30, spliceY - 12);

      // Add compression micro-noise specifically in the tampered box
      const spliceData = ctx.getImageData(spliceX, spliceY, spliceW, spliceH);
      for (let i = 0; i < spliceData.data.length; i += 4) {
        // High frequency quantization noise delta
        const noise = Math.random() > 0.85 ? (Math.random() - 0.5) * 45 : 0;
        spliceData.data[i] = Math.max(0, Math.min(255, spliceData.data[i] + noise));
        spliceData.data[i + 1] = Math.max(0, Math.min(255, spliceData.data[i + 1] + noise));
        spliceData.data[i + 2] = Math.max(0, Math.min(255, spliceData.data[i + 2] + noise));
      }
      ctx.putImageData(spliceData, spliceX, spliceY);

      // Legal disclaimer footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 13px sans-serif';
      ctx.fillText('This document is electronically generated by Apex Meridian Core Banking Ledger Server #AP-881.', 80, 1420);
      ctx.fillText('Any unauthorized alteration, splicing, or duplication constitutes federal banking fraud.', 80, 1445);

      return canvas.toDataURL('image/png');
    }
  },
  {
    id: 'sample-confidential-contract',
    name: 'Executive Employment Agreement (PII Rich)',
    category: 'Privacy & Redaction',
    description: 'An executive contract containing sensitive employee SSN, salary, personal email, and confidential terms.',
    expectedOutcome: 'DocuGuard PII engine will automatically discover sensitive fields and highlight them for instant blackout or blur.',
    type: 'image/png',
    generate: async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1500;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1500);

      // Document Border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 50, 1100, 1400);

      // Title
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXECUTIVE EMPLOYMENT & NON-DISCLOSURE AGREEMENT', 600, 120);

      ctx.font = '600 14px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('CONFIDENTIAL & PRIVILEGED • INTERNAL HR COPY ONLY', 600, 150);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#1e293b';
      ctx.font = '500 15px sans-serif';

      const paragraphs = [
        'This Agreement is entered into as of November 1, 2026, between SYNTHESIS BIOTECH INC. ("Company") and the individual designated below ("Executive").',
        'SECTION 1: APPOINTMENT & IDENTIFICATION',
        'Full Legal Name: Eleanor Beatrice Sterling',
        'Social Security Number (SSN): 482-91-8840',
        'Direct Private Email: eleanor.sterling.personal@protonmail.com',
        'Confidential Mobile: (415) 890-4421',
        'Residential Address: 742 Evergreen Terrace, San Francisco, CA 94107',
        'SECTION 2: EXECUTIVE COMPENSATION & EQUITY INCENTIVES',
        'Base Annual Salary: $185,000.00 payable bi-weekly in accordance with standard payroll procedures.',
        'Target Annual Performance Bonus: $45,000.00 upon achievement of milestone OKRs.',
        'Signing Incentive Grant: 25,000 Restricted Stock Units (RSUs) vesting over 48 months with a 1-year cliff.',
        'Corporate Credit Card Provisioned: Visa Infinite 4128-9920-3341-8890',
        'SECTION 3: CONFIDENTIALITY OBLIGATIONS',
        'Executive agrees to maintain the confidentiality of all proprietary source algorithms, trade secrets, patented molecule sequences, and internal customer lists.',
        'Breach of this confidentiality covenant shall result in immediate termination, forfeiture of unvested equity, and injunctive damages up to $1,000,000.00.'
      ];

      let curY = 220;
      paragraphs.forEach((p) => {
        if (p.startsWith('SECTION')) {
          curY += 24;
          ctx.font = '700 17px sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(p, 90, curY);
          curY += 32;
        } else if (p.includes(':')) {
          ctx.font = '600 15px sans-serif';
          ctx.fillStyle = '#334155';
          ctx.fillText(p, 90, curY);
          curY += 34;
        } else {
          ctx.font = '400 14px sans-serif';
          ctx.fillStyle = '#475569';
          ctx.fillText(p, 90, curY);
          curY += 30;
        }
      });

      // Signature area
      const sigY = 1150;
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(90, sigY);
      ctx.lineTo(450, sigY);
      ctx.moveTo(680, sigY);
      ctx.lineTo(1040, sigY);
      ctx.stroke();

      ctx.font = '600 14px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Authorized Signature: Eleanor B. Sterling', 90, sigY + 28);
      ctx.fillText('Authorized Officer: Marcus Reed, CEO', 680, sigY + 28);

      // Script signature
      ctx.font = 'italic 28px serif';
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText('Eleanor B. Sterling', 120, sigY - 14);
      ctx.fillText('Marcus Reed', 720, sigY - 14);

      return canvas.toDataURL('image/png');
    }
  },
  {
    id: 'sample-government-certificate',
    name: 'Official State Patent & Property Deed',
    category: 'Watermark & Certification',
    description: 'An official patent assignment certificate suited for applying cryptographic integrity hashes, verification QR badges, and tamper-resistant watermarks.',
    expectedOutcome: 'Apply dynamic grid watermarking, embed digital SHA-256 integrity seal, and export certified PDF.',
    type: 'image/png',
    generate: async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1500;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // Parchment cream tone
      ctx.fillStyle = '#fffdfa';
      ctx.fillRect(0, 0, 1200, 1500);

      // Double ornamental border
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 1120, 1420);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(55, 55, 1090, 1390);

      // Header
      ctx.fillStyle = '#78350f';
      ctx.font = '800 32px serif';
      ctx.textAlign = 'center';
      ctx.fillText('UNITED STATES PATENT & INTELLECTUAL PROPERTY OFFICE', 600, 140);

      ctx.fillStyle = '#92400e';
      ctx.font = '600 18px serif';
      ctx.fillText('CERTIFICATE OF REGISTRATION AND LEGAL TITLE', 600, 185);

      // Gold Seal
      const sealX = 600;
      const sealY = 320;
      ctx.beginPath();
      ctx.arc(sealX, sealY, 75, 0, Math.PI * 2);
      ctx.fillStyle = '#fef3c7';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#b45309';
      ctx.stroke();

      ctx.fillStyle = '#92400e';
      ctx.font = '800 13px sans-serif';
      ctx.fillText('OFFICIAL REGISTRATION', sealX, sealY - 10);
      ctx.fillText('★ 2026 SEAL ★', sealX, sealY + 12);
      ctx.font = '700 11px monospace';
      ctx.fillText('REG-NO: #US-99482-B2', sealX, sealY + 32);

      // Body text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1c1917';
      ctx.font = '500 18px serif';
      ctx.fillText('Be it known to all persons present that pursuant to Title 35 of the United States Code,', 600, 470);
      ctx.fillText('Letters Patent have been granted and officially entered into the federal register for:', 600, 505);

      ctx.font = '800 24px serif';
      ctx.fillStyle = '#78350f';
      ctx.fillText('"CRYPTO-VERIFIABLE DECENTRALIZED DOCUMENT INTEGRITY PROTOCOL"', 600, 570);

      ctx.font = '500 17px serif';
      ctx.fillStyle = '#292524';
      ctx.fillText('Inventor & Assignee: DR. JULIAN K. MERCER & DOCUGUARD RESEARCH LABS', 600, 630);
      ctx.fillText('Effective Filing Date: April 14, 2026 • Term of Grant: 20 Years', 600, 665);

      ctx.textAlign = 'left';
      ctx.font = '400 15px serif';
      ctx.fillText('The specification and claims hereto annexed and made a part hereof set forth the legal boundaries and protections.', 120, 750);
      ctx.fillText('This document carries absolute evidentiary presumption of validity under federal statute.', 120, 785);

      // Large ornamental signature
      ctx.strokeStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(350, 1080);
      ctx.lineTo(850, 1080);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'italic 34px serif';
      ctx.fillStyle = '#451a03';
      ctx.fillText('Julian K. Mercer, Commissioner of Patents', 600, 1055);
      ctx.font = '600 14px sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.fillText('AUTHENTICATED BY THE CHIEF EXAMINER', 600, 1115);

      return canvas.toDataURL('image/png');
    }
  }
];
