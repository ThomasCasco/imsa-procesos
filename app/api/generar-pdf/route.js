import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request) {
  const { documento, aprobaciones } = await request.json();

  // Log para depurar los datos recibidos
  console.log("Datos recibidos - documento:", documento);
  console.log("Datos recibidos - aprobaciones:", aprobaciones);

  const today = new Date();
  const fecha = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${today.getFullYear()}`;

  let descripcionContent = documento.descripcion || "No completado";
  let descripcionHTML = `<p>${descripcionContent}</p>`;
  if (descripcionContent && descripcionContent !== "No completado") {
    const lineas = descripcionContent.split(". ").filter((linea) => linea.trim());
    descripcionHTML = `<ul>${lineas
      .map((linea) => `<li>${linea}${linea.endsWith(".") ? "" : "."}</li>`)
      .join("")}</ul>`;
  }

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://tu-proyecto.vercel.app"
      : "http://localhost:4000"; // Ajusta el puerto si lo cambiaste

  const htmlContent = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px 40px 60px 40px;
            font-size: 12pt;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid black;
            padding-bottom: 5px;
            margin-bottom: 20px;
          }
          .header-left {
            font-weight: bold;
          }
          .header-left img {
            height: 30px;
            vertical-align: middle;
          }
          .header-center {
            font-weight: bold;
            text-align: center;
            flex: 1;
          }
          .header-right {
            text-align: right;
            font-size: 10pt;
          }
          .title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin: 20px 0;
            line-height: 1.2;
          }
          .section {
            margin-bottom: 15px;
            page-break-inside: auto;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          ul {
            margin: 0;
            padding-left: 20px;
            list-style-type: disc;
            page-break-inside: auto;
          }
          li {
            page-break-inside: avoid;
            margin-bottom: 5px;
          }
          .additional-text {
            margin: 10px 0;
            font-style: italic;
            font-size: 10pt;
          }
          p {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="${baseUrl}/logo.png" alt="I.M.S.A." />
          </div>
          <div class="header-center">
            PROCEDIMIENTO
          </div>
          <div class="header-right">
            PA 009<br />
            Página <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>
        </div>
        <div class="title">
          IMSA PROCESOS - CAMBIAR TITULO<br />
          para subir imagenes a este pdf use: https://www.canva.com/
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

  // Llamada a Browserless
  try {
    const pdfResponse = await axios.post(
      `https://chrome.browserless.io/pdf?token=${process.env.BROWSERLESS_TOKEN}`,
      {
        html: htmlContent,
        options: {
          format: "A4",
          printBackground: true,
          margin: {
            top: "20mm",
            right: "15mm",
            bottom: "40mm",
            left: "15mm",
          },
          displayHeaderFooter: true,
          headerTemplate: "<span></span>",
          footerTemplate: footerTemplate,
        },
      },
      { responseType: "arraybuffer" }
    );

    return new NextResponse(pdfResponse.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=procedimiento.pdf",
      },
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate PDF", details: error.message }),
      { status: 500 }
    );
  }
}