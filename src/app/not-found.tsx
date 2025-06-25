export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff] text-white p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/20 flex flex-col items-center gap-6 max-w-md mx-auto">
        <div className="text-8xl font-bold mb-4 animate-pulse">404</div>
        <h2 className="text-3xl font-bold mb-4 text-center">Página no encontrada</h2>
        <p className="text-lg text-white/80 text-center mb-8">Lo sentimos, la página que buscas no existe.</p>
        <a 
          href="/" 
          className="bg-gradient-to-r from-[#6a3093] to-[#a044ff] hover:from-[#a044ff] hover:to-[#6a3093] text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/20"
        >
          🏠 Volver al inicio
        </a>
      </div>
    </div>
  );
} 