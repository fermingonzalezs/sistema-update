const Tarjeta = ({ icon: Icon, titulo, valor }) => (
  <div className="bg-slate-800 p-5 rounded border border-slate-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-300 text-md">{titulo}</p>
        <p className="text-3xl font-semibold text-white">{valor}</p>
      </div>
      <div className="bg-slate-600 p-2 rounded-full">
        {Icon && <Icon className="w-8 h-8 text-emerald-600" />}
      </div>
    </div>
  </div>
);

export default Tarjeta;
