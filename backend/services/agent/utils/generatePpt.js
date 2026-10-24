import pptxgen from "pptxgenjs";

const COLORS = {
  primary: "F97316",
  secondary: "111318",
  text: "303945",
  light: "F8FAFC",
  border: "E2E8F0",
  white: "FFFFFF",
  muted: "64748B",
  alternate: "FFF7ED",
};

export const generatePpt = async (data) => {
  const ppt = new pptxgen();

  ppt.layout = "LAYOUT_WIDE";
  ppt.author = "Akshar AI";
  ppt.title = data.title || "Akshar AI Presentation";
  ppt.subject = data.title || "Akshar AI Presentation";
  ppt.company = "Akshar AI";
  ppt.lang = "en-US";
  ppt.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-US",
  };

  addCover(ppt, data);

  data.slides.forEach((slide, index) => {
    addContentSlide(ppt, slide, index + 1, data.slides.length);
  });

  addThankYou(ppt);
  return ppt;
};

const addCover = (ppt, data) => {
  const slide = ppt.addSlide();
  slide.background = { color: COLORS.secondary };

  slide.addShape(ppt.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.16,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary, transparency: 100 },
  });

  slide.addText(data.title || "Untitled Presentation", {
    x: 0.8,
    y: 1.7,
    w: 11.75,
    h: 1.15,
    align: "center",
    valign: "mid",
    color: COLORS.white,
    bold: true,
    fontFace: "Aptos Display",
    fontSize: 30,
    breakLine: false,
    fit: "shrink",
    margin: 0.08,
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.2,
      y: 3.05,
      w: 10.95,
      h: 0.7,
      align: "center",
      valign: "mid",
      color: "CBD5E1",
      fontFace: "Aptos",
      fontSize: 16,
      fit: "shrink",
      margin: 0.06,
    });
  }

  slide.addShape(ppt.ShapeType.line, {
    x: 5.25,
    y: 4.05,
    w: 2.83,
    h: 0,
    line: { color: COLORS.primary, width: 2.5 },
  });

  slide.addText("AKSHAR AI  /  PRESENTATION", {
    x: 0.8,
    y: 6.85,
    w: 11.75,
    h: 0.25,
    align: "center",
    color: "94A3B8",
    fontFace: "Aptos",
    fontSize: 9,
    charSpacing: 1.5,
    margin: 0,
  });
};

const addContentSlide = (ppt, slideData, page, total) => {
  const slide = ppt.addSlide();
  slide.background = { color: COLORS.white };

  slide.addShape(ppt.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.12,
    h: 7.5,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary, transparency: 100 },
  });

  slide.addText(slideData.title || `Section ${page}`, {
    x: 0.65,
    y: 0.42,
    w: 11.9,
    h: 0.62,
    color: COLORS.secondary,
    bold: true,
    fontFace: "Aptos Display",
    fontSize: 25,
    fit: "shrink",
    margin: 0,
  });

  slide.addShape(ppt.ShapeType.line, {
    x: 0.68,
    y: 1.18,
    w: 11.95,
    h: 0,
    line: { color: COLORS.border, width: 1 },
  });

  const points = (Array.isArray(slideData.points) ? slideData.points : []).slice(0, 5);
  const startY = 1.48;
  const availableHeight = 5.25;
  const gap = 0.14;
  const cardHeight = Math.min(0.92, (availableHeight - gap * Math.max(points.length - 1, 0)) / Math.max(points.length, 1));

  points.forEach((point, index) => {
    const y = startY + index * (cardHeight + gap);
    const fillColor = index % 2 === 0 ? COLORS.light : COLORS.alternate;

    slide.addShape(ppt.ShapeType.roundRect, {
      x: 0.72,
      y,
      w: 11.85,
      h: cardHeight,
      rectRadius: 0.08,
      fill: { color: fillColor },
      line: { color: COLORS.border, transparency: 25, width: 0.7 },
      radius: 0.08,
    });

    slide.addShape(ppt.ShapeType.ellipse, {
      x: 0.98,
      y: y + cardHeight / 2 - 0.055,
      w: 0.11,
      h: 0.11,
      fill: { color: COLORS.primary },
      line: { color: COLORS.primary, transparency: 100 },
    });

    slide.addText(point, {
      x: 1.28,
      y: y + 0.08,
      w: 10.95,
      h: cardHeight - 0.16,
      valign: "mid",
      fontFace: "Aptos",
      fontSize: 16,
      color: COLORS.text,
      breakLine: false,
      fit: "shrink",
      margin: 0.02,
      paraSpaceAfterPt: 0,
    });
  });

  slide.addShape(ppt.ShapeType.line, {
    x: 0.7,
    y: 7.05,
    w: 11.95,
    h: 0,
    line: { color: COLORS.border, width: 0.7 },
  });

  slide.addText("AKSHAR AI", {
    x: 0.72,
    y: 7.12,
    w: 3,
    h: 0.18,
    color: COLORS.muted,
    fontFace: "Aptos",
    fontSize: 8,
    charSpacing: 1,
    margin: 0,
  });

  slide.addText(`${page} / ${total}`, {
    x: 10.8,
    y: 7.1,
    w: 1.75,
    h: 0.2,
    align: "right",
    color: COLORS.muted,
    fontFace: "Aptos",
    fontSize: 9,
    margin: 0,
  });
};

const addThankYou = (ppt) => {
  const slide = ppt.addSlide();
  slide.background = { color: COLORS.secondary };

  slide.addShape(ppt.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.16,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary, transparency: 100 },
  });

  slide.addText("Thank You", {
    x: 0.8,
    y: 2.45,
    w: 11.75,
    h: 0.9,
    align: "center",
    valign: "mid",
    color: COLORS.white,
    fontFace: "Aptos Display",
    fontSize: 36,
    bold: true,
    margin: 0,
  });

  slide.addText("AKSHAR AI", {
    x: 0.8,
    y: 3.55,
    w: 11.75,
    h: 0.3,
    align: "center",
    color: "94A3B8",
    fontFace: "Aptos",
    fontSize: 10,
    charSpacing: 2,
    margin: 0,
  });
};
