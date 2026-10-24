import PDFDocument from "pdfkit";

const COLORS = {
  ink: "#17191F",
  orange: "#F97316",
  red: "#DC2626",
  text: "#303846",
  muted: "#667085",
  line: "#E2E5EA",
  paper: "#FFFFFF",
  pale: "#FFF7ED",
  footer: "#8A93A1",
};

export const generatePdf = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 58, bottom: 58, left: 58, right: 58 },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: data.title || "Akshar AI Document",
          Author: "Akshar AI",
          Creator: "Akshar AI",
          Subject: data.subtitle || data.title || "Akshar AI Document",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const left = () => doc.page.margins.left;
      const right = () => doc.page.width - doc.page.margins.right;
      const width = () => right() - left();
      const contentBottom = () => doc.page.height - doc.page.margins.bottom;

      const line = (y, color = COLORS.line, thickness = 0.7) => {
        doc.save()
          .moveTo(left(), y)
          .lineTo(right(), y)
          .lineWidth(thickness)
          .strokeColor(color)
          .stroke()
          .restore();
      };

      const ensureSpace = (height, topGap = 0) => {
        if (doc.y + topGap + height > contentBottom()) {
          doc.addPage();
        }
      };

      const drawHeader = () => {
        doc.save()
          .rect(0, 0, doc.page.width, 6)
          .fill(COLORS.orange)
          .restore();
      };

      drawHeader();

      // Cover/title block
      doc.y = 84;
      doc.font("Helvetica-Bold")
        .fontSize(25)
        .fillColor(COLORS.ink)
        .text(data.title || "Untitled Document", left(), doc.y, {
          width: width(),
          align: "left",
          lineGap: 3,
        });

      if (data.subtitle) {
        doc.moveDown(0.65);
        doc.font("Helvetica")
          .fontSize(11)
          .fillColor(COLORS.muted)
          .text(data.subtitle, left(), doc.y, {
            width: width(),
            lineGap: 3,
          });
      }

      doc.moveDown(1.1);
      const accentY = doc.y;
      doc.save()
        .moveTo(left(), accentY)
        .lineTo(left() + 56, accentY)
        .lineWidth(3)
        .strokeColor(COLORS.orange)
        .stroke()
        .restore();
      doc.y = accentY + 26;

      // Content sections
      for (const [sectionIndex, section] of (data.sections || []).entries()) {
        const heading = String(section.heading || `Section ${sectionIndex + 1}`);
        doc.font("Helvetica-Bold").fontSize(15);
        const headingHeight = doc.heightOfString(heading, { width: width(), lineGap: 2 });

        const points = Array.isArray(section.points) ? section.points : [];
        const firstPointHeight = points.length
          ? doc.heightOfString(String(points[0]), {
              width: width() - 19,
              font: "Helvetica",
              fontSize: 10.5,
              lineGap: 3,
            })
          : 0;

        // Keep the heading and at least the start of its first point together.
        ensureSpace(headingHeight + 12 + Math.min(firstPointHeight, 42), 4);

        doc.font("Helvetica-Bold")
          .fontSize(15)
          .fillColor(COLORS.ink)
          .text(heading, left(), doc.y, { width: width(), lineGap: 2 });

        doc.moveDown(0.25);
        line(doc.y, COLORS.line, 0.65);
        doc.y += 11;

        for (const rawPoint of points) {
          const point = String(rawPoint);
          const textX = left() + 17;
          const textWidth = right() - textX;

          doc.font("Helvetica").fontSize(10.5);
          const textHeight = doc.heightOfString(point, {
            width: textWidth,
            lineGap: 3,
          });
          ensureSpace(textHeight + 10);

          const startY = doc.y;
          doc.save()
            .circle(left() + 4, startY + 6, 2.1)
            .fillColor(COLORS.orange)
            .fill()
            .restore();

          doc.font("Helvetica")
            .fontSize(10.5)
            .fillColor(COLORS.text)
            .text(point, textX, startY, {
              width: textWidth,
              lineGap: 3,
              paragraphGap: 2,
            });

          doc.y += 7;
        }

        doc.y += 10;
      }

      // Add a restrained footer to every buffered page.
      const pages = doc.bufferedPageRange();
      for (let index = pages.start; index < pages.start + pages.count; index += 1) {
        doc.switchToPage(index);
        const page = doc.page;
        const footerY = page.height - 39;

        doc.save()
          .moveTo(page.margins.left, footerY - 8)
          .lineTo(page.width - page.margins.right, footerY - 8)
          .lineWidth(0.5)
          .strokeColor(COLORS.line)
          .stroke()
          .restore();

        // Footer text must not trigger PDFKit's automatic page-break logic.
        // Reset the cursor to the footer position and restore it afterwards;
        // otherwise PDFKit can append blank pages while finalizing buffered pages.
        doc.save();
        doc.y = footerY;
        doc.font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.footer)
          .text("AKSHAR AI", page.margins.left, footerY, {
            width: 160,
            height: 10,
            lineBreak: false,
          });

        doc.y = footerY;
        doc.text(`Page ${index + 1} of ${pages.count}`, page.margins.left, footerY, {
          width: page.width - page.margins.left - page.margins.right,
          height: 10,
          align: "right",
          lineBreak: false,
        });
        doc.restore();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
