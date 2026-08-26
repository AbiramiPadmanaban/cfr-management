import { LineCapStyle, PDFDocument, PDFImage, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CfrWithProject } from "../../domain/cfr.repository";
import { CFR_RATING_CRITERIA, getCfrAverageRating, toWholeRating } from "../components/cfr-rating-criteria";

type Color = ReturnType<typeof rgb>;

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN_X = 42;
const MARGIN_TOP = 38;
const FOOTER_RESERVE = 46;
const CONTENT_WIDTH = PAGE.width - MARGIN_X * 2;

const INK = rgb(0.145, 0.165, 0.2);
const MUTED = rgb(0.48, 0.52, 0.57);
const LABEL = rgb(0.52, 0.56, 0.61);
const HAIRLINE = rgb(0.9, 0.91, 0.93);
const RULE = rgb(0.82, 0.84, 0.86);
const PAPER = rgb(0.992, 0.993, 0.995);
const SURFACE = rgb(0.965, 0.97, 0.973);
const SURFACE_ALT = rgb(0.978, 0.98, 0.983);
const HEADER_FILL = rgb(0.945, 0.95, 0.953);
const TEAL = rgb(0.18, 0.45, 0.43);
const TEAL_SOFT = rgb(0.9, 0.95, 0.94);
const STAR_EMPTY = rgb(0.76, 0.79, 0.81);
const WHITE = rgb(1, 1, 1);
const INTERNAL = rgb(0.957, 0.96, 0.964);

const DOCUMENT_NO_FALLBACK = "—";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SCORES = [5, 4, 3, 2, 1] as const;
const STAR_PATH =
  "M 0 5 L 1.18 1.63 L 4.76 1.63 L 1.79 -0.65 L 2.94 -4.05 L 0 -1.76 L -2.94 -4.05 L -1.79 -0.65 L -4.76 1.63 L -1.18 1.63 Z";

const CATEGORY_LABELS: Record<(typeof CFR_RATING_CRITERIA)[number]["key"], string> = {
  quality: "Quality",
  delivery: "Delivery",
  communication: "Communication",
  technical: "Technical Competence",
  overall: "Overall Satisfaction",
};

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

interface ReportCtx {
  pdf: PDFDocument;
  page: PDFPage;
  pages: PDFPage[];
  fonts: Fonts;
  logo: PDFImage | null;
  cfr: CfrWithProject;
  y: number;
  generatedAt: string;
}

function formatDisplayDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return [];
  }
  const lines: string[] = [];
  let current = "";

  const splitWord = (word: string): string[] => {
    const chunks: string[] = [];
    let chunk = "";
    for (const character of word) {
      const next = chunk + character;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        chunk = next;
      } else {
        if (chunk) {
          chunks.push(chunk);
        }
        chunk = character;
      }
    }
    if (chunk) {
      chunks.push(chunk);
    }
    return chunks.length ? chunks : [word];
  };

  for (const word of cleaned.split(" ")) {
    const pieces = font.widthOfTextAtSize(word, size) <= maxWidth ? [word] : splitWord(word);
    for (const piece of pieces) {
      const next = current ? `${current} ${piece}` : piece;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
      } else {
        if (current) {
          lines.push(current);
        }
        current = piece;
      }
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function ratingBucket(rating: number | null): 5 | 4 | 3 | 2 | 1 | null {
  if (rating == null) {
    return null;
  }
  return toWholeRating(rating) as 5 | 4 | 3 | 2 | 1;
}

async function loadSolidProLogoPng(): Promise<Uint8Array | null> {
  try {
    if (typeof window !== "undefined") {
      const response = await fetch("/SP_Logo.png");
      if (!response.ok) {
        return null;
      }
      return new Uint8Array(await response.arrayBuffer());
    }

    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const filePath = join(process.cwd(), "public", "SP_Logo.png");
    return new Uint8Array(await readFile(filePath));
  } catch {
    return null;
  }
}

function drawLabel(page: PDFPage, text: string, x: number, y: number, font: PDFFont, color: Color = LABEL) {
  page.drawText(text, { x, y, size: 6, font, color });
}

function drawCheck(page: PDFPage, cx: number, cy: number, color: Color, scale = 1) {
  page.drawLine({
    start: { x: cx - 1.9 * scale, y: cy + 0.1 * scale },
    end: { x: cx - 0.25 * scale, y: cy - 1.7 * scale },
    thickness: 0.95 * scale,
    color,
    lineCap: LineCapStyle.Round,
  });
  page.drawLine({
    start: { x: cx - 0.25 * scale, y: cy - 1.7 * scale },
    end: { x: cx + 2.05 * scale, y: cy + 1.85 * scale },
    thickness: 0.95 * scale,
    color,
    lineCap: LineCapStyle.Round,
  });
}

function drawSelectedMark(page: PDFPage, cellX: number, cellY: number, cellW: number, cellH: number) {
  const cx = cellX + cellW / 2;
  const cy = cellY + cellH / 2;
  page.drawCircle({ x: cx, y: cy, size: 4.1, color: TEAL_SOFT });
  page.drawCircle({ x: cx, y: cy, size: 3.55, color: TEAL });
  drawCheck(page, cx, cy, WHITE, 0.82);
}

function drawChoice(page: PDFPage, x: number, y: number, label: string, selected: boolean, font: PDFFont) {
  page.drawCircle({
    x: x + 4,
    y: y + 3.2,
    size: 4.2,
    borderColor: selected ? TEAL : RULE,
    borderWidth: 0.9,
    color: selected ? TEAL : WHITE,
  });
  if (selected) {
    page.drawCircle({ x: x + 4, y: y + 3.2, size: 1.7, color: WHITE });
  }
  page.drawText(label, { x: x + 12, y: y + 0.4, size: 8, font, color: selected ? INK : MUTED });
}

function drawStar(page: PDFPage, cx: number, cy: number, filled: boolean) {
  if (filled) {
    page.drawSvgPath(STAR_PATH, { x: cx, y: cy, color: TEAL, scale: 0.78 });
  }
  page.drawSvgPath(STAR_PATH, {
    x: cx,
    y: cy,
    borderColor: filled ? TEAL : STAR_EMPTY,
    borderWidth: 0.7,
    scale: 0.78,
  });
}

function drawStars(page: PDFPage, x: number, y: number, rating: number) {
  const whole = toWholeRating(rating);
  for (let i = 1; i <= 5; i += 1) {
    drawStar(page, x + (i - 1) * 12.2, y, i <= whole);
  }
}

function drawLinesInBox(
  page: PDFPage,
  lines: string[],
  font: PDFFont,
  size: number,
  x: number,
  boxY: number,
  width: number,
  height: number,
  options?: { color?: Color; padding?: number; lineHeight?: number; align?: "left" | "center" }
) {
  if (lines.length === 0) {
    return;
  }
  const padding = options?.padding ?? 8;
  const lineHeight = options?.lineHeight ?? size + 3;
  const color = options?.color ?? INK;
  const block = lines.length * lineHeight;
  let cursorY = boxY + (height + block) / 2 - size - 1;
  for (const line of lines) {
    const lineWidth = font.widthOfTextAtSize(line, size);
    const textX = options?.align === "center" ? x + (width - lineWidth) / 2 : x + padding;
    page.drawText(line, { x: textX, y: cursorY, size, font, color });
    cursorY -= lineHeight;
  }
}

function paintPage(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE.width, height: PAGE.height, color: PAPER });
}

function stampFooter(page: PDFPage, fonts: Fonts, generatedAt: string, index: number, total: number) {
  page.drawLine({
    start: { x: MARGIN_X, y: 32 },
    end: { x: PAGE.width - MARGIN_X, y: 32 },
    thickness: 0.5,
    color: HAIRLINE,
  });
  page.drawText("Generated from the SolidPro Customer Feedback Review System", {
    x: MARGIN_X,
    y: 20,
    size: 6.5,
    font: fonts.regular,
    color: MUTED,
  });
  page.drawText(generatedAt, {
    x: MARGIN_X,
    y: 11,
    size: 6,
    font: fonts.regular,
    color: MUTED,
  });
  const right = `Confidential  ·  Page ${index} of ${total}`;
  page.drawText(right, {
    x: PAGE.width - MARGIN_X - fonts.regular.widthOfTextAtSize(right, 6.5),
    y: 20,
    size: 6.5,
    font: fonts.regular,
    color: MUTED,
  });
}

function addPage(ctx: ReportCtx, continuation: boolean) {
  ctx.page = ctx.pdf.addPage([PAGE.width, PAGE.height]);
  ctx.pages.push(ctx.page);
  paintPage(ctx.page);
  ctx.y = PAGE.height - MARGIN_TOP;
  if (continuation) {
    drawContinuationHeader(ctx);
  }
}

function ensureSpace(ctx: ReportCtx, needed: number) {
  if (ctx.y - needed < FOOTER_RESERVE) {
    addPage(ctx, true);
  }
}

function drawContinuationHeader(ctx: ReportCtx) {
  const { page, fonts, logo } = ctx;
  let logoHeight = 18;
  if (logo) {
    const w = 110;
    logoHeight = (logo.height / logo.width) * w;
    page.drawImage(logo, { x: MARGIN_X, y: ctx.y - logoHeight + 4, width: w, height: logoHeight });
  } else {
    page.drawText("SOLIDPRO", {
      x: MARGIN_X,
      y: ctx.y - 10,
      size: 11,
      font: fonts.bold,
      color: rgb(23 / 255, 71 / 255, 158 / 255),
    });
    logoHeight = 14;
  }
  page.drawText("CUSTOMER FEEDBACK REPORT", {
    x: MARGIN_X,
    y: ctx.y - logoHeight - 8,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });
  ctx.y -= logoHeight + 18;
  page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: PAGE.width - MARGIN_X, y: ctx.y },
    thickness: 0.6,
    color: RULE,
  });
  ctx.y -= 16;
}

function drawHeader(ctx: ReportCtx) {
  const { page, fonts, logo, cfr } = ctx;
  const top = ctx.y;
  const logoWidth = 140;
  let logoHeight = 28;
  if (logo) {
    logoHeight = (logo.height / logo.width) * logoWidth;
    page.drawImage(logo, {
      x: MARGIN_X,
      y: top - logoHeight + 2,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    page.drawText("SOLIDPRO", {
      x: MARGIN_X,
      y: top - 12,
      size: 15,
      font: fonts.bold,
      color: rgb(23 / 255, 71 / 255, 158 / 255),
    });
    logoHeight = 18;
  }

  page.drawText("CUSTOMER FEEDBACK REPORT", {
    x: MARGIN_X,
    y: top - logoHeight - 10,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });

  const metaX = PAGE.width - MARGIN_X - 132;
  page.drawRectangle({ x: metaX, y: top - 36, width: 1.6, height: 38, color: TEAL });
  drawLabel(page, "DOCUMENT NO", metaX + 10, top - 4, fonts.bold);
  page.drawText(cfr.documentNo?.trim() || DOCUMENT_NO_FALLBACK, {
    x: metaX + 10,
    y: top - 15,
    size: 8,
    font: fonts.regular,
    color: INK,
  });
  drawLabel(page, "REV NO", metaX + 10, top - 26, fonts.bold);
  page.drawText(cfr.revNo?.trim() || "—", {
    x: metaX + 10,
    y: top - 36,
    size: 8,
    font: fonts.regular,
    color: INK,
  });
  drawLabel(page, "REV DATE", metaX + 72, top - 26, fonts.bold);
  page.drawText(cfr.revDate ? formatDisplayDate(cfr.revDate) : "—", {
    x: metaX + 72,
    y: top - 36,
    size: 8,
    font: fonts.regular,
    color: INK,
  });

  ctx.y = top - Math.max(logoHeight + 28, 52);
  page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: PAGE.width - MARGIN_X, y: ctx.y },
    thickness: 0.6,
    color: RULE,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - 1.6,
    width: 56,
    height: 1.6,
    color: TEAL,
  });
  ctx.y -= 18;
}

function drawInfoCard(ctx: ReportCtx, cfr: CfrWithProject) {
  const { page, fonts } = ctx;
  const leftW = CONTENT_WIDTH * 0.58;
  const pad = 12;
  const customer = wrapText(displayValue(cfr.client), fonts.regular, 10, leftW - pad * 2);
  const project = wrapText(displayValue(cfr.project.projectName), fonts.regular, 10, leftW - pad * 2);
  const period = wrapText(displayValue(cfr.reviewPeriod), fonts.regular, 10, CONTENT_WIDTH - pad * 2);
  const row1 = Math.max(36, 20 + customer.length * 12);
  const row2 = Math.max(36, 20 + project.length * 12);
  const row3 = Math.max(34, 20 + period.length * 12);
  const cardH = row1 + row2 + row3;
  ensureSpace(ctx, cardH + 4);

  const top = ctx.y;
  page.drawRectangle({
    x: MARGIN_X,
    y: top - cardH,
    width: CONTENT_WIDTH,
    height: cardH,
    color: SURFACE,
  });

  const field = (x: number, rowTop: number, label: string, lines: string[]) => {
    drawLabel(page, label, x + pad, rowTop - 12, fonts.bold);
    let textY = rowTop - 25;
    for (const line of lines.length ? lines : ["—"]) {
      page.drawText(line, { x: x + pad, y: textY, size: 10, font: fonts.regular, color: INK });
      textY -= 12;
    }
  };

  field(MARGIN_X, top, "CUSTOMER NAME", customer);
  field(MARGIN_X + leftW, top, "DATE", [displayValue(formatDisplayDate(cfr.reviewedAt))]);
  field(MARGIN_X, top - row1, "PROJECT NAME", project);
  field(MARGIN_X + leftW, top - row1, "PROJECT NUMBER", [displayValue(cfr.projectNumber)]);
  field(MARGIN_X, top - row1 - row2, "REVIEW PERIOD", period);

  ctx.y = top - cardH - 16;
}

function drawLegend(ctx: ReportCtx) {
  ensureSpace(ctx, 18);
  const { page, fonts } = ctx;
  drawLabel(page, "EVALUATION", MARGIN_X, ctx.y, fonts.bold, TEAL);
  ctx.y -= 12;
  const items = ["Excellent = 5", "Good = 4", "Average = 3", "Fair = 2", "Poor = 1"];
  let x = MARGIN_X;
  items.forEach((item, index) => {
    page.drawText(item, { x, y: ctx.y, size: 7, font: fonts.regular, color: MUTED });
    x += fonts.regular.widthOfTextAtSize(item, 7) + 8;
    if (index < items.length - 1) {
      page.drawText("·", { x, y: ctx.y, size: 7, font: fonts.regular, color: RULE });
      x += 10;
    }
  });
  ctx.y -= 12;
}

function getTableColumns() {
  const cols = {
    no: 20,
    category: 84,
    remarks: 98,
    score: 26,
    criteria: 0,
  };
  cols.criteria = CONTENT_WIDTH - cols.no - cols.category - cols.remarks - cols.score * 5;
  const widths = [cols.no, cols.category, cols.criteria, cols.remarks, ...SCORES.map(() => cols.score)];
  const xs: number[] = [];
  let x = MARGIN_X;
  for (const width of widths) {
    xs.push(x);
    x += width;
  }
  return { cols, widths, xs };
}

function drawTableHeader(ctx: ReportCtx, cols: ReturnType<typeof getTableColumns>, headerH: number) {
  const { page, fonts } = ctx;
  const top = ctx.y;
  page.drawRectangle({
    x: MARGIN_X,
    y: top - headerH,
    width: CONTENT_WIDTH,
    height: headerH,
    color: HEADER_FILL,
  });
  const titles = ["No", "Category", "Evaluation Criteria", "Remarks"];
  titles.forEach((title, index) => {
    const width = cols.widths[index];
    const textWidth = fonts.bold.widthOfTextAtSize(title, 6.5);
    page.drawText(title, {
      x: cols.xs[index] + (index === 0 ? (width - textWidth) / 2 : 8),
      y: top - 14,
      size: 6.5,
      font: fonts.bold,
      color: MUTED,
    });
  });
  SCORES.forEach((score, index) => {
    const cellX = cols.xs[4 + index];
    const label = String(score);
    page.drawText(label, {
      x: cellX + (cols.cols.score - fonts.bold.widthOfTextAtSize(label, 8)) / 2,
      y: top - 15,
      size: 8,
      font: fonts.bold,
      color: INK,
    });
  });
  page.drawLine({
    start: { x: MARGIN_X, y: top - headerH },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: top - headerH },
    thickness: 1.1,
    color: TEAL,
  });
  ctx.y = top - headerH;
}

function drawEvaluationTable(ctx: ReportCtx, cfr: CfrWithProject) {
  const { fonts } = ctx;
  const cols = getTableColumns();
  const headerH = 22;
  const rows = CFR_RATING_CRITERIA.map((criterion, index) => {
    const rating = cfr[criterion.ratingField];
    const remarks = displayValue(cfr[criterion.remarksField]);
    const criteriaLines = wrapText(criterion.description, fonts.regular, 7.5, cols.cols.criteria - 16);
    const remarksLines = wrapText(remarks, fonts.regular, 7.5, cols.cols.remarks - 14);
    const categoryLines = wrapText(CATEGORY_LABELS[criterion.key], fonts.bold, 8, cols.cols.category - 14);
    const rowH = Math.max(38, 16 + Math.max(criteriaLines.length, remarksLines.length, categoryLines.length) * 10.5);
    return {
      index: index + 1,
      rating,
      remarksLines,
      criteriaLines,
      categoryLines,
      rowH,
      bucket: ratingBucket(rating ?? null),
    };
  });

  ensureSpace(ctx, headerH + rows[0].rowH);
  drawTableHeader(ctx, cols, headerH);

  rows.forEach((row, rowIndex) => {
    if (ctx.y - row.rowH < FOOTER_RESERVE) {
      addPage(ctx, true);
      drawTableHeader(ctx, cols, headerH);
    }
    const { page } = ctx;
    const rowY = ctx.y - row.rowH;
    page.drawRectangle({
      x: MARGIN_X,
      y: rowY,
      width: CONTENT_WIDTH,
      height: row.rowH,
      color: rowIndex % 2 === 1 ? SURFACE_ALT : WHITE,
    });
    drawLinesInBox(page, [String(row.index)], fonts.regular, 8, cols.xs[0], rowY, cols.cols.no, row.rowH, {
      align: "center",
      color: MUTED,
      padding: 0,
    });
    drawLinesInBox(page, row.categoryLines, fonts.bold, 8, cols.xs[1], rowY, cols.cols.category, row.rowH, {
      padding: 8,
      lineHeight: 10.5,
      color: INK,
    });
    drawLinesInBox(page, row.criteriaLines, fonts.regular, 7.5, cols.xs[2], rowY, cols.cols.criteria, row.rowH, {
      padding: 8,
      lineHeight: 10.5,
      color: rgb(0.28, 0.32, 0.36),
    });
    drawLinesInBox(page, row.remarksLines, fonts.regular, 7.5, cols.xs[3], rowY, cols.cols.remarks, row.rowH, {
      padding: 8,
      lineHeight: 10.5,
    });
    SCORES.forEach((score, scoreIndex) => {
      if (row.bucket === score) {
        drawSelectedMark(page, cols.xs[4 + scoreIndex], rowY, cols.cols.score, row.rowH);
      }
    });
    page.drawLine({
      start: { x: cols.xs[4], y: rowY },
      end: { x: cols.xs[4], y: rowY + row.rowH },
      thickness: 0.4,
      color: HAIRLINE,
    });
    page.drawLine({
      start: { x: MARGIN_X, y: rowY },
      end: { x: MARGIN_X + CONTENT_WIDTH, y: rowY },
      thickness: 0.4,
      color: HAIRLINE,
    });
    ctx.y = rowY;
  });
  ctx.y -= 16;
}

function drawOverallCard(ctx: ReportCtx, cfr: CfrWithProject) {
  const cardH = 44;
  ensureSpace(ctx, cardH + 4);
  const { page, fonts } = ctx;
  const top = ctx.y;
  page.drawRectangle({
    x: MARGIN_X,
    y: top - cardH,
    width: CONTENT_WIDTH,
    height: cardH,
    color: SURFACE,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: top - cardH,
    width: 3,
    height: cardH,
    color: TEAL,
  });
  drawLabel(page, "OVERALL RATING", MARGIN_X + 16, top - 14, fonts.bold, TEAL);
  const averageRating = getCfrAverageRating(cfr);
  if (averageRating != null) {
    page.drawText(`${averageRating.toFixed(1)} / 5`, {
      x: MARGIN_X + 16,
      y: top - 32,
      size: 14,
      font: fonts.bold,
      color: INK,
    });
    drawStars(page, PAGE.width - MARGIN_X - 82, top - 22, Math.round(averageRating));
  } else {
    page.drawText("—", { x: MARGIN_X + 16, y: top - 32, size: 14, font: fonts.bold, color: MUTED });
  }
  ctx.y = top - cardH - 16;
}

function drawComments(ctx: ReportCtx, cfr: CfrWithProject) {
  const { fonts } = ctx;
  const comments = cfr.comments?.trim() || "";
  const lines = comments
    ? wrapText(comments, fonts.regular, 8.5, CONTENT_WIDTH - 28)
    : ["No additional comments provided"];
  const lineHeight = 11.5;
  const pad = 12;

  ensureSpace(ctx, 28);
  drawLabel(ctx.page, "OVERALL COMMENTS / AREA OF IMPROVEMENT", MARGIN_X, ctx.y, fonts.bold);
  ctx.y -= 10;

  let remaining = [...lines];
  while (remaining.length > 0) {
    const available = ctx.y - FOOTER_RESERVE - pad;
    const maxLines = Math.max(2, Math.floor((available - pad) / lineHeight));
    const chunk = remaining.slice(0, maxLines);
    remaining = remaining.slice(chunk.length);
    const boxH = pad * 2 + chunk.length * lineHeight;
    ensureSpace(ctx, boxH);
    const top = ctx.y;
    ctx.page.drawRectangle({
      x: MARGIN_X,
      y: top - boxH,
      width: CONTENT_WIDTH,
      height: boxH,
      color: SURFACE,
    });
    let textY = top - pad - 8;
    for (const line of chunk) {
      ctx.page.drawText(line, {
        x: MARGIN_X + 12,
        y: textY,
        size: 8.5,
        font: comments ? fonts.regular : fonts.italic,
        color: comments ? INK : MUTED,
      });
      textY -= lineHeight;
    }
    ctx.y = top - boxH - 8;
    if (remaining.length > 0) {
      addPage(ctx, true);
      drawLabel(ctx.page, "OVERALL COMMENTS / AREA OF IMPROVEMENT  ·  CONTINUED", MARGIN_X, ctx.y, fonts.bold);
      ctx.y -= 10;
    }
  }
  ctx.y -= 8;
}

function drawReviewRow(ctx: ReportCtx, cfr: CfrWithProject) {
  const h = 38;
  ensureSpace(ctx, h + 4);
  const { page, fonts } = ctx;
  const top = ctx.y;
  const split = CONTENT_WIDTH * 0.62;
  drawLabel(page, "REVIEWED BY", MARGIN_X, top - 8, fonts.bold);
  page.drawText(displayValue(cfr.reviewedBy), {
    x: MARGIN_X,
    y: top - 24,
    size: 10,
    font: fonts.regular,
    color: INK,
  });
  drawLabel(page, "REVIEW DATE", MARGIN_X + split, top - 8, fonts.bold);
  page.drawText(displayValue(formatDisplayDate(cfr.reviewedAt)), {
    x: MARGIN_X + split,
    y: top - 24,
    size: 10,
    font: fonts.regular,
    color: INK,
  });
  ctx.y = top - h - 10;
}

function drawInternal(ctx: ReportCtx, cfr: CfrWithProject) {
  const h = 52;
  ensureSpace(ctx, h + 16);
  const { page, fonts } = ctx;
  drawLabel(page, "FOR INTERNAL USE", MARGIN_X, ctx.y, fonts.bold);
  ctx.y -= 10;
  const top = ctx.y;
  page.drawRectangle({
    x: MARGIN_X,
    y: top - h,
    width: CONTENT_WIDTH,
    height: h,
    color: INTERNAL,
    borderColor: RULE,
    borderWidth: 0.55,
    borderDashArray: [3, 2.2],
  });
  drawLabel(page, "DATE RECEIVED", MARGIN_X + 12, top - 14, fonts.bold);
  page.drawText(displayValue(formatDisplayDate(cfr.feedbackSubmittedAt)), {
    x: MARGIN_X + 12,
    y: top - 26,
    size: 9,
    font: fonts.regular,
    color: INK,
  });
  drawLabel(page, "RECEIVED BY", MARGIN_X + 176, top - 14, fonts.bold);
  const receivedBy = wrapText(displayValue(cfr.reviewedBy), fonts.regular, 9, 160)[0] || "—";
  page.drawText(receivedBy, { x: MARGIN_X + 176, y: top - 26, size: 9, font: fonts.regular, color: INK });
  drawLabel(page, "ACTION NEEDS TO BE TAKEN", MARGIN_X + 12, top - 40, fonts.bold);
  drawChoice(page, MARGIN_X + 168, top - 43, "Yes", cfr.actionNeeded === true, fonts.regular);
  drawChoice(page, MARGIN_X + 214, top - 43, "No", cfr.actionNeeded === false, fonts.regular);
  ctx.y = top - h - 8;
}

export async function buildCfrFeedbackPdf(cfr: CfrWithProject): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };
  const logoBytes = await loadSolidProLogoPng();
  const logo = logoBytes ? await pdf.embedPng(logoBytes) : null;
  const first = pdf.addPage([PAGE.width, PAGE.height]);
  paintPage(first);

  const ctx: ReportCtx = {
    pdf,
    page: first,
    pages: [first],
    fonts,
    logo,
    cfr,
    y: PAGE.height - MARGIN_TOP,
    generatedAt: formatDisplayDate(new Date()),
  };

  drawHeader(ctx);
  drawInfoCard(ctx, cfr);
  drawLegend(ctx);
  drawEvaluationTable(ctx, cfr);
  drawOverallCard(ctx, cfr);
  drawComments(ctx, cfr);
  drawReviewRow(ctx, cfr);
  drawInternal(ctx, cfr);

  ctx.pages.forEach((page, index) => {
    stampFooter(page, fonts, ctx.generatedAt, index + 1, ctx.pages.length);
  });

  return pdf.save();
}

export async function downloadCfrFeedbackPdf(cfr: CfrWithProject): Promise<void> {
  if (cfr.status !== "SUBMITTED") {
    throw new Error("The report is available after the client submits feedback");
  }
  const bytes = await buildCfrFeedbackPdf(cfr);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = (cfr.projectNumber || `CFR-${cfr.id}`).replace(/[^\w.-]+/g, "_");
  link.href = url;
  link.download = `Customer-Feedback-Report_${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
