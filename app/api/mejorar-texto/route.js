import { NextResponse } from "next/server";
import axios from "axios";
  
  export async function POST(request) {
    const { texto, seccion } = await request.json();
  
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    //const MISTRAL_API_KEY = "A3PSYm7YSpYR0bDZACljU7YpZMq6NQGg"; // Reemplazá con tu clave de Mistral
  
    let prompt = "";
    if (seccion === "objeto") {
      prompt = `Corrige y formatea este texto como la sección 'Objeto' de un procedimiento ISO, siendo claro y formal: "${texto}"`;
    } else if (seccion === "alcance") {
      prompt = `Corrige y formatea este texto como la sección 'Alcance' de un procedimiento ISO, siendo conciso: "${texto}"`;
    } else if (seccion === "abreviaturas") {
      prompt = `Corrige y formatea este texto como la sección 'Abreviaturas y Definiciones' de un procedimiento ISO: "${texto}"`;
    } else if (seccion === "responsabilidades") {
      prompt = `Corrige y formatea este texto como la sección 'Responsabilidades' de un procedimiento ISO, siendo claro: "${texto}"`;
    } else if (seccion === "descripcion") {
      prompt = `Corrige y formatea este texto como la sección 'Descripción' de un procedimiento ISO, siendo detallado: "${texto}"`;
    }
  
    try {
      const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: "mistral-small-latest",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${MISTRAL_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );
  
      const textoMejorado = response.data.choices[0]?.message.content || texto;
      return NextResponse.json({ resultado: textoMejorado });
    } catch (error) {
      console.error("Error con Mistral API:", error.message);
      let textoFallback = texto.trim();
      if (seccion === "objeto") textoFallback = `Objeto: ${textoFallback.replace(/^el propósito es/i, "").trim()}.`;
      else if (seccion === "alcance") textoFallback = `Alcance: ${textoFallback.trim()}.`;
      else if (seccion === "abreviaturas") textoFallback = `Abreviaturas y Definiciones: ${textoFallback.trim()}.`;
      else if (seccion === "responsabilidades") textoFallback = `Responsabilidades: ${textoFallback.trim()}.`;
      else if (seccion === "descripcion") textoFallback = `Descripción: ${textoFallback.trim()}.`;
      return NextResponse.json({ resultado: textoFallback });
    }
  }