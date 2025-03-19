import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(request) {
  const { documento, aprobaciones } = await request.json();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Fecha actual
  const today = new Date();
  const fecha = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${today.getFullYear()}`;

  // Convertimos el texto de "Descripción" en viñetas si tiene contenido
  let descripcionContent = documento.descripcion || "No completado";
  let descripcionHTML = `<p>${descripcionContent}</p>`;
  if (descripcionContent && descripcionContent !== "No completado") {
    const lineas = descripcionContent.split(". ").filter((linea) => linea.trim());
    descripcionHTML = `<ul>${lineas
      .map((linea) => `<li>${linea}${linea.endsWith(".") ? "" : "."}</li>`)
      .join("")}</ul>`;
  }

  // HTML del contenido principal
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px 40px 60px 40px; font-size: 12pt; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 20px; }
          .header-left { font-weight: bold; }
          .header-left img { height: 30px; }
          .header-right { text-align: right; }
          .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; }
          .section { margin-bottom: 15px; page-break-inside: auto; }
          .section-title { font-weight: bold; margin-bottom: 5px; }
          ul { margin: 0; padding-left: 20px; list-style-type: disc; page-break-inside: auto; }
          li { page-break-inside: avoid; }
          .additional-text { margin: 10px 0; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="https://imsa.com.ar/wp-content/uploads/2020/06/IMSA_Logo_rojo_02.png" alt="I.M.S.A." />
          </div>
          <div>PROCEDIMIENTO</div>
          <div class="header-right">
            PA 009<br />
            Página <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>
        </div>
        <div class="title">
          DOCUMENTACIÓN OBLIGATORIA PARA INGRESAR A REALIZAR TAREAS<br />
          (Terceros o Sub contratados)
        </div>
        <div class="section">
          <div class="section-title">1. OBJETO</div>
          <p>${documento.objeto || "No completado"}</p>
        </div>
        <div class="section">
          <div class="section-title">2. ALCANCE</div>
          <p>${documento.alcance || "No completado"}</p>
        </div>
        <div class="section">
          <div class="section-title">3. ABREVIATURAS Y DEFINICIONES</div>
          <p>${documento.abreviaturas || "No completado"}</p>
        </div>
        <div class="section">
          <div class="section-title">4. RESPONSABILIDADES</div>
          <p>${documento.responsabilidades || "No completado"}</p>
        </div>
        <div class="section">
          <div class="section-title">5. DESCRIPCIÓN</div>
          ${descripcionHTML}
        </div>
        <div class="additional-text">
          Solicitar esta documentación con anticipación para evitar demoras en Portería.
        </div>
      </body>
    </html>
  `;

  // HTML del pie de página (tabla de aprobaciones)
  const footerTemplate = `
    <div style="font-size: 10pt; width: 100%; margin: 0 40px; padding-top: 5px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="border: 1px solid black; padding: 5px; text-align: center;">Preparado por:</th>
          <th style="border: 1px solid black; padding: 5px; text-align: center;">Revisado por:</th>
          <th style="border: 1px solid black; padding: 5px; text-align: center;">Aprobado por:</th>
          <th style="border: 1px solid black; padding: 5px; text-align: center;">Revisión N°:</th>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${
            aprobaciones.preparadoPor
          }<br />Fecha: ${fecha}</td>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${
            aprobaciones.revisadoPor
          }<br />Fecha: ${fecha}</td>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${
            aprobaciones.aprobadoPor
          }<br />Fecha: ${fecha}</td>
          <td style="border: 1px solid black; padding: 5px; text-align: center;">${
            aprobaciones.revision
          }</td>
        </tr>
      </table>
    </div>
  `;

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      right: "15mm",
      bottom: "40mm", // Espacio para el pie de página
      left: "15mm",
    },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>", // No usamos encabezado adicional
    footerTemplate: footerTemplate,
  });

  await browser.close();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=procedimiento.pdf",
    },
  });
}