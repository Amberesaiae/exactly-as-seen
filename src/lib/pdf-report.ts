/**
 * pdf-report.ts — jsPDF batch report generator
 * Produces a polished, branded PDF with cover page, summary table,
 * feed log, health tasks, and financials for any selected batch(es).
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// ── Typed aliases from generated types ────────────────────────────────────────
type MortalityRow   = Database['public']['Tables']['mortality_records']['Row'];
type FeedRow        = Database['public']['Tables']['feed_schedules']['Row'];
type HealthRow      = Database['public']['Tables']['health_tasks']['Row'];
type ExpenseRow     = Database['public']['Tables']['expenses']['Row'];
type RevenueRow     = Database['public']['Tables']['revenue']['Row'];

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  primary: [21, 128, 61]   as [number, number, number],
  dark:    [15, 23, 42]    as [number, number, number],
  muted:   [100, 116, 139] as [number, number, number],
  light:   [241, 245, 249] as [number, number, number],
  white:   [255, 255, 255] as [number, number, number],
  red:     [220, 38, 38]   as [number, number, number],
};

interface ReportOptions {
  currency?: string;
  maskFinancials?: boolean;
  farmName?: string;
}

interface BatchRow {
  id: string;
  name: string;
  species: string;
  status: string;
  initial_quantity: number;
  current_population: number;
  start_date: string;
  end_date: string | null;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateBatchPDF(
  batchIds: string[],
  batches: BatchRow[],
  opts: ReportOptions = {}
): Promise<void> {
  const { currency = 'GHS', maskFinancials = false, farmName = 'LampFarms' } = opts;
  const selected = batches.filter(b => batchIds.includes(b.id));
  if (selected.length === 0) return;

  const [mortRes, feedRes, taskRes, expRes, revRes] = await Promise.all([
    supabase.from('mortality_records').select('*').in('batch_id', batchIds).order('recorded_at'),
    supabase.from('feed_schedules').select('*').in('batch_id', batchIds).order('week').order('day'),
    supabase.from('health_tasks').select('*').in('batch_id', batchIds).order('scheduled_date'),
    supabase.from('expenses').select('*').in('batch_id', batchIds).order('date'),
    supabase.from('revenue').select('*').in('batch_id', batchIds).order('date'),
  ]);

  const mortality = (mortRes.data ?? []) as MortalityRow[];
  const feeds     = (feedRes.data ?? []) as FeedRow[];
  const tasks     = (taskRes.data ?? []) as HealthRow[];
  const expenses  = (expRes.data  ?? []) as ExpenseRow[];
  const revenues  = (revRes.data  ?? []) as RevenueRow[];

  // ── Instantiate PDF ──────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  function sectionHeader(title: string, y: number): number {
    doc.setFillColor(...C.primary);
    doc.rect(margin, y, pageW - margin * 2, 7, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, y + 5);
    doc.setTextColor(...C.dark);
    return y + 10;
  }

  function addFooter(page: number) {
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`${farmName} — Confidential Poultry Ledger`, margin, pageH - 6);
    doc.text(
      `Page ${page} | Generated ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      pageW - margin, pageH - 6, { align: 'right' }
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setFillColor(...C.primary);
  doc.rect(0, 60, pageW, 4, 'F');

  doc.setTextColor(...C.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('LampFarms', margin, 28);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Poultry Operations Ledger', margin, 36);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(farmName, margin, 44);
  doc.text(`Exported: ${format(new Date(), 'MMMM d, yyyy')}`, margin, 50);

  doc.setFillColor(...C.light);
  doc.rect(margin, 72, pageW - margin * 2, 40, 'F');
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.5);
  doc.rect(margin, 72, pageW - margin * 2, 40);

  doc.setTextColor(...C.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Summary', margin + 4, 80);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Batches included: ${selected.length}`, margin + 4, 88);
  doc.text(`Currency: ${currency}${maskFinancials ? ' (Financials Masked)' : ''}`, margin + 4, 95);
  doc.text(`Total mortality records: ${mortality.length}`, margin + 4, 102);
  doc.text(`Total feed entries: ${feeds.length}`, pageW / 2, 88);
  doc.text(`Health tasks: ${tasks.length}`, pageW / 2, 95);

  addFooter(1);

  // ══════════════════════════════════════════════════════════════════════════
  // PER-BATCH PAGES
  // ══════════════════════════════════════════════════════════════════════════
  let pageNum = 2;

  for (const batch of selected) {
    doc.addPage();

    doc.setFillColor(...C.dark);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(batch.name, margin, 13);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${batch.species} · ${batch.status} · Started ${format(new Date(batch.start_date), 'dd MMM yyyy')}`,
      margin, 19
    );

    let y = 28;

    // ── KPI calculation ────────────────────────────────────────────────
    const bMort = mortality.filter(m => m.batch_id === batch.id);
    const bFeed = feeds.filter(f => f.batch_id === batch.id);
    const bExp  = expenses.filter(e => e.batch_id === batch.id);
    const bRev  = revenues.filter(r => r.batch_id === batch.id);
    const bTask = tasks.filter(t => t.batch_id === batch.id);

    const totalMort    = bMort.reduce((s, m) => s + (m.count ?? 0), 0);
    const mortalityPct = batch.initial_quantity > 0
      ? ((totalMort / batch.initial_quantity) * 100).toFixed(1) : '0.0';
    // feed_schedules uses total_amount_kg per entry
    const totalFeedKg  = bFeed.reduce((s, f) => s + (f.total_amount_kg ?? 0), 0);
    const totalExpGHS  = bExp.reduce((s, e) => s + (Number(e.amount_pesewas ?? 0) / 100), 0);
    const totalRevGHS  = bRev.reduce((s, r) => s + (Number(r.amount_pesewas ?? 0) / 100), 0);
    const netGHS       = totalRevGHS - totalExpGHS;
    const completedTasks = bTask.filter(t => t.completed).length;

    const kpis = [
      ['Initial Birds', batch.initial_quantity.toLocaleString()],
      ['Current Pop.', batch.current_population.toLocaleString()],
      ['Mortality', `${totalMort} (${mortalityPct}%)`],
      ['Total Feed', `${totalFeedKg.toFixed(1)} kg`],
      ['Tasks Done', `${completedTasks}/${bTask.length}`],
      ...(!maskFinancials ? [
        ['Revenue', `${currency} ${totalRevGHS.toFixed(2)}`],
        ['Expenses', `${currency} ${totalExpGHS.toFixed(2)}`],
        ['Net Margin', `${currency} ${netGHS.toFixed(2)}`],
      ] : []),
    ];

    const colW = (pageW - margin * 2) / Math.min(kpis.length, 4);
    kpis.forEach((kpi, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x   = margin + col * colW;
      const ky  = y + row * 16;

      doc.setFillColor(...C.light);
      doc.rect(x + 0.5, ky, colW - 1, 14, 'F');

      doc.setFontSize(7);
      doc.setTextColor(...C.muted);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi[0], x + colW / 2, ky + 4.5, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      if (kpi[0] === 'Net Margin' && netGHS < 0) {
        doc.setTextColor(...C.red);
      } else {
        doc.setTextColor(...C.dark);
      }
      doc.text(kpi[1], x + colW / 2, ky + 11, { align: 'center' });
    });

    const kpiRows = Math.ceil(kpis.length / 4);
    y += kpiRows * 16 + 6;

    // ── Mortality table ────────────────────────────────────────────────
    if (bMort.length > 0) {
      y = sectionHeader('Mortality Records', y);
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Count', 'Cause', 'Notes']],
        body: bMort.slice(0, 20).map(m => [
          format(new Date(m.recorded_at), 'dd MMM yyyy'),
          m.count ?? 0,
          m.cause ?? '—',
          (m.notes ?? '').substring(0, 50),
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: C.light },
        theme: 'plain',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── Feed schedule table (week/day/total_amount_kg/completed) ──────
    if (bFeed.length > 0 && y < pageH - 50) {
      y = sectionHeader('Feed Schedule Log', y);
      autoTable(doc, {
        startY: y,
        head: [['Week', 'Day', 'Total (kg)', 'Per Bird (g)', 'Completed']],
        body: bFeed.slice(0, 15).map(f => [
          `W${f.week}`,
          `D${f.day}`,
          f.total_amount_kg?.toFixed(1) ?? '—',
          f.amount_per_bird_g?.toFixed(1) ?? '—',
          f.completed ? '✓ Yes' : '✗ No',
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: C.light },
        theme: 'plain',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── Health tasks table (scheduled_date, task_type, product_name) ──
    if (bTask.length > 0) {
      if (y > pageH - 60) { doc.addPage(); pageNum++; y = 14; }
      y = sectionHeader('Health Tasks', y);
      autoTable(doc, {
        startY: y,
        head: [['Task Type', 'Product', 'Scheduled', 'Duration', 'Done']],
        body: bTask.slice(0, 15).map(t => [
          t.task_type ?? '—',
          t.product_name ?? '—',
          t.scheduled_date ? format(new Date(t.scheduled_date), 'dd MMM yyyy') : '—',
          `${t.duration_days ?? 1}d`,
          t.completed ? '✓ Yes' : '✗ No',
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: C.light },
        theme: 'plain',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── Financial tables ───────────────────────────────────────────────
    if (!maskFinancials) {
      if (bExp.length > 0) {
        if (y > pageH - 60) { doc.addPage(); pageNum++; y = 14; }
        y = sectionHeader('Expense Ledger', y);
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Category', `Amount (${currency})`, 'Description']],
          body: bExp.slice(0, 15).map(e => [
            format(new Date(e.date), 'dd MMM yyyy'),
            e.category ?? '—',
            (Number(e.amount_pesewas ?? 0) / 100).toFixed(2),
            (e.description ?? '').substring(0, 40),
          ]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: C.light },
          theme: 'plain',
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      if (bRev.length > 0) {
        if (y > pageH - 60) { doc.addPage(); pageNum++; y = 14; }
        y = sectionHeader('Revenue Records', y);
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Category', `Amount (${currency})`, 'Buyer', 'Source']],
          body: bRev.slice(0, 15).map(r => [
            format(new Date(r.date), 'dd MMM yyyy'),
            r.category ?? '—',
            (Number(r.amount_pesewas ?? 0) / 100).toFixed(2),
            (r.buyer ?? '—').substring(0, 20),
            r.source ?? '—',
          ]),
          margin: { left: margin, right: margin },
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: C.light },
          theme: 'plain',
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }
    }

    addFooter(pageNum);
    pageNum++;
  }

  doc.save(`lampfarms_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
