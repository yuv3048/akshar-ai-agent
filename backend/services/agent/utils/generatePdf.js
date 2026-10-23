import PDFDocument from "pdfkit";

export const generatePdf = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 58,
          bottom: 55,
          left: 58,
          right: 58,
        },
        bufferPages: true,
        info: {
          Title: data.title || "Akshar AI Document",
          Author: "Akshar AI",
          Creator: "Akshar AI",
        },
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const colors = {
        navy: "#294B70",
        blue: "#477DA8",
        text: "#303945",
        muted: "#778394",
        line: "#D7DEE6",
        bullet: "#477DA8",
        footer: "#8993A0",
      };

      const left = () => doc.page.margins.left;
      const right = () =>
        doc.page.width - doc.page.margins.right;
      const width = () => right() - left();
      const bottom = () =>
        doc.page.height - doc.page.margins.bottom;

      const ensureSpace = (height) => {
        if (doc.y + height > bottom()) {
          doc.addPage();
        }
      };

      const drawLine = (y, color = colors.line, thickness = 0.7) => {
        doc
          .save()
          .moveTo(left(), y)
          .lineTo(right(), y)
          .lineWidth(thickness)
          .strokeColor(color)
          .stroke()
          .restore();
      };

      // ── DOCUMENT TITLE ───────────────────────────

      // No decorative line above the title.
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor(colors.navy)
        .text(data.title || "Untitled Document", {
          width: width(),
          align: "center",
          lineGap: 2,
        });

      // Subtitle directly below the title.
      if (data.subtitle) {
        doc.y += 6;

        doc
          .font("Helvetica-Oblique")
          .fontSize(10.5)
          .fillColor(colors.muted)
          .text(data.subtitle, {
            width: width(),
            align: "center",
            lineGap: 2,
          });
      }

      // One subtle divider below the complete title block.
      doc.y += 16;
      drawLine(doc.y, colors.line, 0.8);
      doc.y += 25;

      // ── SECTIONS ─────────────────────────────────

      for (const section of data.sections || []) {
        const heading = section.heading || "Section";

        doc
          .font("Helvetica-Bold")
          .fontSize(14);

        const headingHeight = doc.heightOfString(heading, {
          width: width(),
          lineGap: 2,
        });

        // Avoid leaving a heading alone at the bottom of a page.
        ensureSpace(headingHeight + 48);

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .fillColor(colors.navy)
          .text(heading, {
            width: width(),
            lineGap: 2,
          });

        // Section divider goes BELOW its heading.
        doc.y += 4;
        drawLine(doc.y, colors.line, 0.75);
        doc.y += 10;

        // ── BULLET POINTS ──────────────────────────

        for (const point of section.points || []) {
          const text = String(point);
          const bulletIndent = 16;
          const textX = left() + bulletIndent;
          const textWidth = right() - textX;

          doc
            .font("Helvetica")
            .fontSize(10.5);

          const pointHeight = doc.heightOfString(text, {
            width: textWidth,
            lineGap: 3,
          });

          ensureSpace(pointHeight + 8);

          const startY = doc.y;

          // Draw the bullet separately for consistent rendering.
          doc
            .save()
            .circle(left() + 4, startY + 6, 2)
            .fillColor(colors.bullet)
            .fill()
            .restore();

          doc
            .font("Helvetica")
            .fontSize(10.5)
            .fillColor(colors.text)
            .text(text, textX, startY, {
              width: textWidth,
              lineGap: 3,
            });

          // Comfortable but compact spacing between points.
          doc.y += 5;
        }

        // Consistent separation between sections.
        doc.y += 12;
      }

      // ── FOOTERS ──────────────────────────────────

     
        const pages = doc.bufferedPageRange();
      
        for (
          let i = pages.start;
          i < pages.start + pages.count;
          i++
        ) {
          doc.switchToPage(i);
        
          const originalBottomMargin = doc.page.margins.bottom;
        
          // Temporarily allow text inside the footer area.
          doc.page.margins.bottom = 18;
        
          const footerY = doc.page.height - 34;
          const halfWidth = width() / 2;
        
          // Footer divider.
          drawLine(footerY - 9, colors.line, 0.5);
        
        
          // Right footer.
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(colors.footer)
            .text(
              `Page ${i + 1} of ${pages.count}`,
              left() + halfWidth,
              footerY,
              {
                width: halfWidth,
                align: "right",
                lineBreak: false,
              }
            );
        
          // Restore the original margin.
          doc.page.margins.bottom = originalBottomMargin;
        }


      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
