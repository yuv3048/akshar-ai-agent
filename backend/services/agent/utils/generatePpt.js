import pptxgen from "pptxgenjs";

const C = {
  ink: "111318",
  orange: "F97316",
  red: "DC2626",
  text: "263244",
  muted: "64748B",
  white: "FFFFFF",
  paper: "F8FAFC",
  border: "E2E8F0",
  paleOrange: "FFF7ED",
  paleRed: "FEF2F2",
  darkMuted: "CBD5E1",
};

const W = 13.333;
const H = 7.5;
const FONT_HEAD = "Aptos Display";
const FONT_BODY = "Aptos";

export const generatePpt = async (data) => {
  const ppt = new pptxgen();
  ppt.layout = "LAYOUT_WIDE";
  ppt.author = "Akshar AI";
  ppt.subject = data.title || "Akshar AI Presentation";
  ppt.title = data.title || "Akshar AI Presentation";
  ppt.company = "Akshar AI";
  ppt.lang = "en-US";
  ppt.theme = {
    headFontFace: FONT_HEAD,
    bodyFontFace: FONT_BODY,
    lang: "en-US",
  };

  addCover(ppt, data);

  data.slides.forEach((slide, index) => {
    addContentSlide(ppt, slide, index + 1, data.slides.length);
  });

  addClosing(ppt, data);
  return ppt;
};

function addTopRule(ppt, slide, dark = false) {
  slide.addShape(ppt.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: 0.12,
    fill: { color: C.orange },
    line: { color: C.orange, transparency: 100 },
  });
  if (dark) {
    slide.addShape(ppt.ShapeType.rect, {
      x: 0,
      y: 0.12,
      w: 0.1,
      h: H - 0.12,
      fill: { color: C.red },
      line: { color: C.red, transparency: 100 },
    });
  }
}

function addCover(ppt, data) {
  const slide = ppt.addSlide();
  slide.background = { color: C.ink };
  addTopRule(ppt, slide, true);

  slide.addShape(ppt.ShapeType.ellipse, {
    x: 9.3,
    y: 0.9,
    w: 3.2,
    h: 3.2,
    fill: { color: C.orange, transparency: 88 },
    line: { color: C.orange, transparency: 100 },
  });
  slide.addShape(ppt.ShapeType.ellipse, {
    x: 10.1,
    y: 1.7,
    w: 1.6,
    h: 1.6,
    fill: { color: C.red, transparency: 70 },
    line: { color: C.red, transparency: 100 },
  });

  slide.addText("AKSHAR AI  /  PRESENTATION", {
    x: 0.9,
    y: 1.1,
    w: 6.5,
    h: 0.3,
    color: C.orange,
    fontFace: FONT_BODY,
    fontSize: 10,
    bold: true,
    charSpacing: 2,
    margin: 0,
  });

  slide.addText(data.title || "Untitled Presentation", {
    x: 0.85,
    y: 1.75,
    w: 10.9,
    h: 1.6,
    color: C.white,
    fontFace: FONT_HEAD,
    fontSize: 36,
    bold: true,
    breakLine: false,
    valign: "mid",
    fit: "shrink",
    margin: 0.02,
    paraSpaceAfterPt: 0,
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.9,
      y: 3.62,
      w: 8.7,
      h: 0.85,
      color: C.darkMuted,
      fontFace: FONT_BODY,
      fontSize: 18,
      breakLine: false,
      valign: "top",
      fit: "shrink",
      margin: 0,
    });
  }

  slide.addShape(ppt.ShapeType.line, {
    x: 0.9,
    y: 4.85,
    w: 1.15,
    h: 0,
    line: { color: C.orange, width: 3 },
  });

  slide.addText("IDEAS, CLEARLY PRESENTED.", {
    x: 0.9,
    y: 5.1,
    w: 5.8,
    h: 0.25,
    color: "94A3B8",
    fontFace: FONT_BODY,
    fontSize: 9,
    charSpacing: 1.5,
    margin: 0,
  });

  slide.addText(new Date().getFullYear().toString(), {
    x: 11.1,
    y: 6.9,
    w: 1.2,
    h: 0.22,
    color: "64748B",
    fontFace: FONT_BODY,
    fontSize: 9,
    align: "right",
    margin: 0,
  });
}

function addContentSlide(ppt, item, page, total) {
  const slide = ppt.addSlide();
  const layout = item.layout || "bullets";
  const points = (Array.isArray(item.points) ? item.points : []).slice(0, 5);
  slide.background = { color: C.paper };

  slide.addShape(ppt.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.11,
    h: H,
    fill: { color: C.orange },
    line: { color: C.orange, transparency: 100 },
  });

  slide.addText(String(item.eyebrow || "KEY IDEAS").toUpperCase(), {
    x: 0.72,
    y: 0.42,
    w: 8.8,
    h: 0.22,
    color: C.orange,
    fontFace: FONT_BODY,
    fontSize: 9,
    bold: true,
    charSpacing: 1.5,
    margin: 0,
  });

  slide.addText(item.title || `Section ${page}`, {
    x: 0.7,
    y: 0.78,
    w: 11.95,
    h: 0.66,
    color: C.ink,
    bold: true,
    fontFace: FONT_HEAD,
    fontSize: 26,
    fit: "shrink",
    margin: 0,
    breakLine: false,
  });

  slide.addShape(ppt.ShapeType.line, {
    x: 0.72,
    y: 1.58,
    w: 11.88,
    h: 0,
    line: { color: C.border, width: 1 },
  });

  if (layout === "steps") {
    addSteps(slide, ppt, points);
  } else if (layout === "split" && points.length >= 2) {
    addSplit(slide, ppt, points);
  } else if (layout === "quote" && points.length >= 2) {
    addQuote(slide, ppt, points);
  } else if (layout === "stat" && points.length >= 2) {
    addStat(slide, ppt, points);
  } else {
    addBullets(slide, ppt, points);
  }

  if (item.takeaway) {
    slide.addShape(ppt.ShapeType.roundRect, {
      x: 0.74,
      y: 6.36,
      w: 11.82,
      h: 0.48,
      rectRadius: 0.06,
      fill: { color: C.paleOrange },
      line: { color: "FED7AA", width: 0.6 },
      radius: 0.06,
    });
    slide.addText(item.takeaway, {
      x: 0.95,
      y: 6.43,
      w: 11.4,
      h: 0.3,
      fontFace: FONT_BODY,
      fontSize: 11,
      bold: true,
      color: C.ink,
      fit: "shrink",
      valign: "mid",
      margin: 0,
    });
  }

  slide.addShape(ppt.ShapeType.line, {
    x: 0.72,
    y: 7.04,
    w: 11.88,
    h: 0,
    line: { color: C.border, width: 0.7 },
  });
  slide.addText("AKSHAR AI", {
    x: 0.73,
    y: 7.12,
    w: 3,
    h: 0.18,
    color: C.muted,
    fontFace: FONT_BODY,
    fontSize: 8,
    charSpacing: 1.2,
    margin: 0,
  });
  slide.addText(`${page.toString().padStart(2, "0")}  /  ${total.toString().padStart(2, "0")}`, {
    x: 10.8,
    y: 7.1,
    w: 1.8,
    h: 0.2,
    align: "right",
    color: C.muted,
    fontFace: FONT_BODY,
    fontSize: 9,
    margin: 0,
  });
}

function addBullets(slide, ppt, points) {
  const list = points.length ? points : ["Explore the core ideas and practical implications."];
  const startY = 1.9;
  const gap = 0.16;
  const availableH = 4.25;
  const cardH = Math.min(1.02, (availableH - gap * (list.length - 1)) / list.length);

  list.forEach((point, index) => {
    const y = startY + index * (cardH + gap);
    slide.addShape(ppt.ShapeType.roundRect, {
      x: 0.78,
      y,
      w: 11.75,
      h: cardH,
      rectRadius: 0.08,
      fill: { color: index % 2 === 0 ? C.white : "FFF9F4" },
      line: { color: C.border, width: 0.6 },
      radius: 0.08,
      shadow: { type: "outer", color: "CBD5E1", blur: 1, angle: 45, distance: 1, opacity: 0.08 },
    });
    slide.addShape(ppt.ShapeType.ellipse, {
      x: 1.03,
      y: y + cardH / 2 - 0.055,
      w: 0.11,
      h: 0.11,
      fill: { color: index === 0 ? C.orange : C.red },
      line: { color: C.orange, transparency: 100 },
    });
    slide.addText(point, {
      x: 1.32,
      y: y + 0.08,
      w: 10.9,
      h: cardH - 0.16,
      valign: "mid",
      fontFace: FONT_BODY,
      fontSize: 17,
      color: C.text,
      breakLine: false,
      fit: "shrink",
      margin: 0.02,
      paraSpaceAfterPt: 0,
    });
  });
}

function addSteps(slide, ppt, points) {
  const list = points.length ? points : ["Define the goal", "Work through the process"];
  const gap = 0.13;
  const cardH = Math.min(0.82, (4.25 - gap * (list.length - 1)) / list.length);
  list.forEach((point, index) => {
    const y = 1.92 + index * (cardH + gap);
    slide.addShape(ppt.ShapeType.roundRect, {
      x: 0.86,
      y,
      w: 11.55,
      h: cardH,
      rectRadius: 0.06,
      fill: { color: index % 2 ? C.white : C.paleOrange },
      line: { color: C.border, width: 0.6 },
      radius: 0.06,
    });
    slide.addShape(ppt.ShapeType.ellipse, {
      x: 1.1,
      y: y + cardH / 2 - 0.19,
      w: 0.38,
      h: 0.38,
      fill: { color: C.ink },
      line: { color: C.ink, transparency: 100 },
    });
    slide.addText(String(index + 1).padStart(2, "0"), {
      x: 1.1,
      y: y + cardH / 2 - 0.12,
      w: 0.38,
      h: 0.16,
      align: "center",
      valign: "mid",
      color: C.white,
      fontFace: FONT_BODY,
      fontSize: 9,
      bold: true,
      margin: 0,
    });
    slide.addText(point, {
      x: 1.72,
      y: y + 0.06,
      w: 10.35,
      h: cardH - 0.12,
      valign: "mid",
      color: C.text,
      fontFace: FONT_BODY,
      fontSize: 16,
      fit: "shrink",
      margin: 0.02,
    });
  });
}

function addSplit(slide, ppt, points) {
  const cards = points.slice(0, 4);
  const gapX = 0.2;
  const cardW = (11.75 - gapX) / 2;
  const cardH = 1.82;
  cards.forEach((point, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.8 + col * (cardW + gapX);
    const y = 1.95 + row * (cardH + 0.2);
    slide.addShape(ppt.ShapeType.roundRect, {
      x, y, w: cardW, h: cardH,
      rectRadius: 0.08,
      fill: { color: index % 2 === 0 ? C.white : C.paleOrange },
      line: { color: C.border, width: 0.7 },
      radius: 0.08,
    });
    slide.addShape(ppt.ShapeType.rect, {
      x, y, w: 0.07, h: cardH,
      fill: { color: index % 2 === 0 ? C.orange : C.red },
      line: { color: C.orange, transparency: 100 },
    });
    slide.addText(String(index + 1).padStart(2, "0"), {
      x: x + 0.25, y: y + 0.22, w: 0.5, h: 0.25,
      color: C.orange, fontFace: FONT_BODY, fontSize: 10, bold: true, margin: 0,
    });
    slide.addText(point, {
      x: x + 0.25, y: y + 0.62, w: cardW - 0.5, h: 0.92,
      color: C.text, fontFace: FONT_BODY, fontSize: 16, fit: "shrink",
      valign: "mid", margin: 0.02,
    });
  });
}

function addQuote(slide, ppt, points) {
  slide.addShape(ppt.ShapeType.roundRect, {
    x: 1.0, y: 2.05, w: 11.1, h: 2.65,
    rectRadius: 0.12,
    fill: { color: C.ink },
    line: { color: C.ink, transparency: 100 },
    radius: 0.12,
  });
  slide.addText("“", {
    x: 1.35, y: 2.1, w: 0.8, h: 0.8,
    color: C.orange, fontFace: FONT_HEAD, fontSize: 58, bold: true, margin: 0,
  });
  slide.addText(points[0], {
    x: 2.0, y: 2.55, w: 9.2, h: 1.35,
    color: C.white, fontFace: FONT_HEAD, fontSize: 24, bold: true,
    align: "center", valign: "mid", fit: "shrink", margin: 0.02,
  });
  slide.addText(points[1], {
    x: 1.7, y: 4.95, w: 9.9, h: 0.7,
    color: C.muted, fontFace: FONT_BODY, fontSize: 15,
    align: "center", valign: "mid", fit: "shrink", margin: 0.02,
  });
}

function addStat(slide, ppt, points) {
  const cards = points.slice(0, 3);
  const cardW = 3.65;
  const gap = 0.25;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  const startX = (W - totalW) / 2;
  cards.forEach((point, index) => {
    const x = startX + index * (cardW + gap);
    slide.addShape(ppt.ShapeType.roundRect, {
      x, y: 2.25, w: cardW, h: 2.55,
      rectRadius: 0.1,
      fill: { color: index === 1 ? C.ink : C.white },
      line: { color: C.border, width: 0.8 },
      radius: 0.1,
    });
    slide.addText(point, {
      x: x + 0.2, y: 2.6, w: cardW - 0.4, h: 1.8,
      color: index === 1 ? C.white : C.text,
      fontFace: FONT_HEAD,
      fontSize: 21,
      bold: true,
      align: "center",
      valign: "mid",
      fit: "shrink",
      margin: 0.05,
    });
  });
  slide.addText("Key figures and signals", {
    x: 2, y: 5.1, w: 9.3, h: 0.35,
    color: C.muted, fontFace: FONT_BODY, fontSize: 12,
    align: "center", margin: 0,
  });
}

function addClosing(ppt, data) {
  const slide = ppt.addSlide();
  slide.background = { color: C.ink };
  addTopRule(ppt, slide, true);

  slide.addText("THE TAKEAWAY", {
    x: 0.9, y: 1.75, w: 11.5, h: 0.3,
    color: C.orange, fontFace: FONT_BODY, fontSize: 10,
    bold: true, charSpacing: 2, align: "center", margin: 0,
  });
  slide.addText("Thank You", {
    x: 0.9, y: 2.45, w: 11.5, h: 0.9,
    color: C.white, fontFace: FONT_HEAD, fontSize: 38,
    bold: true, align: "center", valign: "mid", margin: 0,
  });
  slide.addText(data.title || "Akshar AI Presentation", {
    x: 1.5, y: 3.6, w: 10.3, h: 0.55,
    color: C.darkMuted, fontFace: FONT_BODY, fontSize: 16,
    align: "center", valign: "mid", fit: "shrink", margin: 0,
  });
  slide.addShape(ppt.ShapeType.line, {
    x: 5.85, y: 4.55, w: 1.65, h: 0,
    line: { color: C.orange, width: 2.5 },
  });
  slide.addText("AKSHAR AI", {
    x: 1.0, y: 6.8, w: 11.3, h: 0.25,
    color: "64748B", fontFace: FONT_BODY, fontSize: 9,
    charSpacing: 2, align: "center", margin: 0,
  });
}
