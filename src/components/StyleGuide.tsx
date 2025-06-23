"use client";

import React from "react";

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 p-8 text-gray-100 font-sans">
      <div className="max-w-4xl mx-auto bg-white bg-opacity-90 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center text-blue-900 mb-8">Guía de Estilos – CircleSfera</h1>

        {/* Paleta de colores */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Paleta de Colores</h2>
          <div className="flex flex-wrap gap-4 mb-2">
            <div className="w-28 h-16 rounded-lg bg-blue-900 flex items-center justify-center text-white font-bold">blue-900</div>
            <div className="w-28 h-16 rounded-lg bg-purple-900 flex items-center justify-center text-white font-bold">purple-900</div>
            <div className="w-28 h-16 rounded-lg bg-pink-900 flex items-center justify-center text-white font-bold">pink-900</div>
            <div className="w-28 h-16 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-800 font-bold">white</div>
            <div className="w-28 h-16 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-800 font-bold">gray-100</div>
            <div className="w-28 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-white font-bold">gray-800</div>
          </div>
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-bold">Gradiente principal:</span> <span className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white px-2 py-1 rounded">from-blue-900 via-purple-900 to-pink-900</span>
          </div>
        </section>

        {/* Tipografía */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Tipografía</h2>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-blue-900">Título Principal (text-4xl font-bold)</div>
            <div className="text-2xl font-medium text-purple-900">Subtítulo (text-2xl font-medium)</div>
            <div className="text-base text-gray-800">Texto normal (text-base)</div>
            <div className="text-sm text-gray-600">Texto secundario (text-sm)</div>
          </div>
        </section>

        {/* Botones */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Botones</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <button className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform hover:scale-105">Botón Primario</button>
            <button className="bg-white text-blue-900 font-bold py-3 px-6 rounded-lg border-2 border-blue-900 shadow transition hover:bg-gray-100">Botón Secundario</button>
            <button className="bg-gray-100 text-purple-900 font-medium py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-200">Botón Terciario</button>
          </div>
        </section>

        {/* Tarjetas */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Tarjetas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-blue-900 mb-2">Título de Tarjeta</h3>
              <p className="text-gray-700">Contenido de la tarjeta. Ejemplo de uso para paneles, dashboards o información destacada.</p>
            </div>
            <div className="bg-gray-100 rounded-xl shadow p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-purple-900 mb-2">Otra Tarjeta</h3>
              <p className="text-gray-700">Tarjeta alternativa con fondo gris claro y acentos en púrpura.</p>
            </div>
          </div>
        </section>

        {/* Badges y Chips */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Badges y Chips</h2>
          <div className="flex flex-wrap gap-4">
            <span className="bg-purple-900 text-white rounded-full px-4 py-1 text-sm font-semibold">Badge Púrpura</span>
            <span className="bg-pink-900 text-white rounded-full px-4 py-1 text-sm font-semibold">Badge Rosa</span>
            <span className="bg-blue-900 text-white rounded-full px-4 py-1 text-sm font-semibold">Badge Azul</span>
            <span className="bg-gray-100 text-blue-900 rounded-full px-4 py-1 text-sm font-semibold border border-blue-900">Badge Claro</span>
          </div>
        </section>

        {/* Inputs y Formularios */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Inputs y Formularios</h2>
          <form className="space-y-4 max-w-md">
            <input className="w-full p-3 rounded-md border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-900 transition" placeholder="Input de ejemplo" />
            <button className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white font-bold py-2 px-6 rounded-lg shadow hover:scale-105 transition-transform">Enviar</button>
          </form>
        </section>

        {/* Microinteracciones */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Microinteracciones</h2>
          <div className="flex gap-6 items-center">
            <button className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl">Hover me</button>
            <span className="inline-block animate-bounce bg-pink-900 text-white px-4 py-1 rounded-full">¡Animación!</span>
          </div>
        </section>

        {/* Responsive */}
        <section>
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Responsive</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4 text-center text-blue-900 font-bold">Columna 1</div>
            <div className="bg-white rounded-xl shadow p-4 text-center text-purple-900 font-bold">Columna 2</div>
            <div className="bg-white rounded-xl shadow p-4 text-center text-pink-900 font-bold">Columna 3</div>
          </div>
          <p className="mt-2 text-gray-700 text-sm">Redimensiona la ventana para ver el comportamiento responsivo.</p>
        </section>
      </div>
    </div>
  );
} 