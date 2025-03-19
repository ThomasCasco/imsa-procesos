"use client";

import { useState } from "react";

export default function Transcribir() {
  const [seccionActual, setSeccionActual] = useState(0);
  const [documento, setDocumento] = useState({
    objeto: "",
    alcance: "",
    abreviaturas: "",
    responsabilidades: "",
    descripcion: "",
  });
  const [grabando, setGrabando] = useState(false);
  const [textoTemporal, setTextoTemporal] = useState("");
  const [aprobaciones, setAprobaciones] = useState({
    preparadoPor: "Roberto Francucci",
    revisadoPor: "Pablo Ottaviano",
    aprobadoPor: "Pablo Ottaviano",
    revision: "000",
  });

  const secciones = [
    { nombre: "Objeto", clave: "objeto" },
    { nombre: "Alcance", clave: "alcance" },
    { nombre: "Abreviaturas y Definiciones", clave: "abreviaturas" },
    { nombre: "Responsabilidades", clave: "responsabilidades" },
    { nombre: "Descripción", clave: "descripcion" },
  ];

  const empezarGrabacion = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "es-ES";
    recognition.onresult = (event) => {
      const transcripcion = event.results[0][0].transcript;
      setTextoTemporal(transcripcion);
    };
    recognition.onend = () => setGrabando(false);
    recognition.start();
    setGrabando(true);
  };

  const mejorarConIA = async () => {
    if (!textoTemporal) return;

    const response = await fetch("/api/mejorar-texto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto: textoTemporal,
        seccion: secciones[seccionActual].clave,
      }),
    });
    const data = await response.json();
    setTextoTemporal(data.resultado);
  };

  const guardarTexto = () => {
    if (!textoTemporal) return;
    setDocumento((prev) => ({
      ...prev,
      [secciones[seccionActual].clave]: textoTemporal,
    }));
    setTextoTemporal("");
  };

  const generarPDF = async () => {
    const response = await fetch("/api/generar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documento, aprobaciones }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "procedimiento.pdf";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const siguienteSeccion = () => {
    if (seccionActual < secciones.length - 1) {
      setSeccionActual(seccionActual + 1);
      setTextoTemporal("");
    }
  };

  const seccionAnterior = () => {
    if (seccionActual > 0) {
      setSeccionActual(seccionActual - 1);
      setTextoTemporal("");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Crear Procedimiento</h1>
      <h2>Paso {seccionActual + 1}: {secciones[seccionActual].nombre}</h2>
      <button onClick={empezarGrabacion} disabled={grabando}>
        {grabando ? "Grabando..." : "Hablar"}
      </button>
      <div style={{ marginTop: "10px" }}>
        <textarea
          value={textoTemporal}
          onChange={(e) => setTextoTemporal(e.target.value)}
          placeholder="Habla o escribe aquí"
          style={{ width: "300px", height: "100px", margin: "10px" }}
        />
      </div>
      <button onClick={mejorarConIA} disabled={!textoTemporal}>
        Mejorar con IA
      </button>
      <button onClick={guardarTexto} disabled={!textoTemporal} style={{ marginLeft: "10px" }}>
        Guardar
      </button>
      <div style={{ marginTop: "20px" }}>
        <button onClick={seccionAnterior} disabled={seccionActual === 0}>
          Anterior
        </button>
        <button
          onClick={siguienteSeccion}
          disabled={seccionActual === secciones.length - 1}
          style={{ marginLeft: "10px" }}
        >
          Siguiente
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>Resumen del Documento</h3>
        {secciones.map((seccion, index) => (
          <p key={index}>
            <strong>{seccion.nombre}:</strong> {documento[seccion.clave] || "No completado"}
          </p>
        ))}
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>Datos de Aprobación</h3>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div>
            <label>Preparado por: </label>
            <input
              type="text"
              value={aprobaciones.preparadoPor}
              onChange={(e) =>
                setAprobaciones((prev) => ({ ...prev, preparadoPor: e.target.value }))
              }
              style={{ width: "200px" }}
            />
          </div>
          <div>
            <label>Revisado por: </label>
            <input
              type="text"
              value={aprobaciones.revisadoPor}
              onChange={(e) =>
                setAprobaciones((prev) => ({ ...prev, revisadoPor: e.target.value }))
              }
              style={{ width: "200px" }}
            />
          </div>
          <div>
            <label>Aprobado por: </label>
            <input
              type="text"
              value={aprobaciones.aprobadoPor}
              onChange={(e) =>
                setAprobaciones((prev) => ({ ...prev, aprobadoPor: e.target.value }))
              }
              style={{ width: "200px" }}
            />
          </div>
          <div>
            <label>Revisión N°: </label>
            <input
              type="text"
              value={aprobaciones.revision}
              onChange={(e) =>
                setAprobaciones((prev) => ({ ...prev, revision: e.target.value }))
              }
              style={{ width: "200px" }}
            />
          </div>
        </div>
      </div>
      <div style={{ marginTop: "20px" }}>
        <button onClick={generarPDF}>Generar PDF</button>
      </div>
    </div>
  );
}