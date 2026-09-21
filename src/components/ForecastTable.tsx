import React, { useState, useRef } from 'react';
import { ForecastRow } from '../types';
import { Plus, Trash2, Calculator, X, Calendar, Lock } from 'lucide-react';
import { calculateForecastTotals, MAIN_EQUIPMENT_CATEGORIES } from '../utils/calculations';
import { STANDARD_EQUIPMENTS } from '../data/initialData';
import { useAuth } from '../contexts/AuthContext';

// Helper to convert DD/MM/YYYY to YYYY-MM-DD for input[type="date"]
function toIsoDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].trim();
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return '';
}

// Helper to convert YYYY-MM-DD to DD/MM/YYYY
function toBrDate(isoStr: string): string {
  if (!isoStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoStr)) return isoStr;
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  return isoStr;
}

interface ForecastTableProps {
  rows: ForecastRow[];
  onChange: (updatedRows: ForecastRow[]) => void;
  onSelectCell?: (cellRef: string, value: string) => void;
  selectedCell?: string | null;
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

export const ForecastTable: React.FC<ForecastTableProps> = ({
  rows,
  onChange,
  onSelectCell,
  selectedCell,
  isAdmin: propIsAdmin,
  isReadOnly = false,
}) => {
  const { isAdmin: authIsAdmin } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : authIsAdmin;

  // Modal state for adding a forecast item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formChamado, setFormChamado] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formObra, setFormObra] = useState('');
  const [formEquipamento, setFormEquipamento] = useState<string>(STANDARD_EQUIPMENTS[0]);
  const [formDataPrevista, setFormDataPrevista] = useState('');
  const [formQtd, setFormQtd] = useState<number | string>(1);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleCellEdit = (index: number, field: keyof ForecastRow, value: string | number) => {
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      [field]: field === 'qtd' ? (value === '' ? 0 : Number(value)) : value,
    };
    onChange(updated);
  };

  const handleOpenAddModal = () => {
    setFormChamado('');
    setFormCliente('');
    setFormObra('');
    setFormEquipamento(STANDARD_EQUIPMENTS[0]);
    setFormDataPrevista('');
    setFormQtd(1);
    setIsModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmAddRow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newRow: ForecastRow = {
      id: `fore-${Date.now()}`,
      chamado: formChamado.trim(),
      cliente: formCliente.trim(),
      obra: formObra.trim(),
      equipamento: formEquipamento || STANDARD_EQUIPMENTS[0],
      dataPrevista: formDataPrevista.trim(),
      qtd: Number(formQtd) || 0,
    };
    onChange([...rows, newRow]);
    setIsModalOpen(false);
    setFormChamado('');
    setFormCliente('');
    setFormObra('');
    setFormDataPrevista('');
    setFormQtd(1);
  };

  const handleDeleteRow = (index: number) => {
    if (!isAdmin) {
      alert('Apenas usuários administradores têm permissão para excluir obras e previsões.');
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Dynamic calculations
  const totals = calculateForecastTotals(rows);
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Datalist for Quick Equipment Autocomplete */}
      <datalist id="forecast-equipment-options">
        {STANDARD_EQUIPMENTS.map((eq) => (
          <option key={eq} value={eq} />
        ))}
      </datalist>

      {/* 1. Main Forecast Table */}
      <div className="bg-white border-2 border-black rounded shadow-sm overflow-hidden text-xs">
        <div className="bg-[#b8cce4] border-b-2 border-black px-3.5 py-2 flex items-center justify-between font-bold text-black uppercase tracking-wide">
          <span className="text-[13px] font-extrabold flex items-center gap-2">
            <span>PREVISÃO DE NOVAS INSTALAÇÕES NO MÊS</span>
            <span className="text-[11px] font-semibold text-slate-700 bg-white/70 px-2 py-0.5 rounded border border-black/20 normal-case">
              {rows.length} ordens de serviço
            </span>
          </span>
          {isReadOnly ? (
            <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-bold">
              <Lock className="w-3 h-3 text-amber-700" /> Apenas Consulta
            </span>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-black text-white hover:bg-slate-800 px-3 py-1 rounded text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          )}
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
          <table className="w-full border-collapse border border-slate-300">
            <thead className="sticky top-0 z-10 bg-[#f7f7f7] shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              <tr className="border-b border-black font-semibold text-slate-900 text-[11px]">
                <th className="w-8 border-r border-slate-300 px-1 py-1.5 text-center text-slate-500 font-mono text-[10px]">#</th>
                <th className="w-20 border-r border-slate-300 px-2 py-1.5 text-center min-w-[70px]">CHAMADO</th>
                <th className="border-r border-slate-300 px-2.5 py-1.5 text-left min-w-[130px]">CLIENTE</th>
                <th className="border-r border-slate-300 px-2.5 py-1.5 text-left min-w-[140px]">OBRA</th>
                <th className="border-r border-slate-300 px-2.5 py-1.5 text-left min-w-[170px]">EQUIPAMENTO</th>
                <th className="border-r border-slate-300 px-2 py-1.5 text-center min-w-[125px] bg-blue-50/40">DATA PREVISTA</th>
                <th className="w-16 border-r border-slate-300 px-2 py-1.5 text-center min-w-[60px]">QTD</th>
                <th className="w-8 px-1 py-1.5 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-200 hover:bg-blue-50/40 group transition-colors"
                >
                  <td className="border-r border-slate-300 px-1 py-1 text-center text-slate-400 font-mono text-[10px] select-none bg-slate-50">
                    {index + 1}
                  </td>
                  <td
                    className={`border-r border-slate-300 p-0 text-center font-mono ${
                      selectedCell === `F_CH_${index + 1}` ? 'outline-2 outline-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => onSelectCell?.(`F_CH_${index + 1}`, row.chamado)}
                  >
                    <input
                      type="text"
                      value={row.chamado}
                      onChange={(e) => handleCellEdit(index, 'chamado', e.target.value)}
                      placeholder="-"
                      className="w-full h-full px-1.5 py-1 text-center bg-transparent outline-none focus:bg-white text-slate-800"
                    />
                  </td>
                  <td
                    className={`border-r border-slate-300 p-0 ${
                      selectedCell === `F_CL_${index + 1}` ? 'outline-2 outline-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => onSelectCell?.(`F_CL_${index + 1}`, row.cliente)}
                  >
                    <input
                      type="text"
                      value={row.cliente}
                      onChange={(e) => handleCellEdit(index, 'cliente', e.target.value)}
                      className="w-full h-full px-2 py-1 bg-transparent outline-none focus:bg-white text-slate-800 uppercase"
                    />
                  </td>
                  <td
                    className={`border-r border-slate-300 p-0 ${
                      selectedCell === `F_OB_${index + 1}` ? 'outline-2 outline-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => onSelectCell?.(`F_OB_${index + 1}`, row.obra)}
                  >
                    <input
                      type="text"
                      value={row.obra}
                      onChange={(e) => handleCellEdit(index, 'obra', e.target.value)}
                      className="w-full h-full px-2 py-1 bg-transparent outline-none focus:bg-white text-slate-800 uppercase"
                    />
                  </td>
                  <td
                    className={`border-r border-slate-300 p-0 ${
                      selectedCell === `F_EQ_${index + 1}` ? 'outline-2 outline-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => onSelectCell?.(`F_EQ_${index + 1}`, row.equipamento)}
                  >
                    <input
                      type="text"
                      list="forecast-equipment-options"
                      value={row.equipamento}
                      onChange={(e) => handleCellEdit(index, 'equipamento', e.target.value)}
                      placeholder="Selecione ou digite..."
                      className="w-full h-full px-2 py-1 bg-transparent outline-none focus:bg-white text-slate-900"
                    />
                  </td>
                  <td
                    className={`border-r border-slate-300 p-0 text-center ${
                      selectedCell === `F_DP_${index + 1}` ? 'outline-2 outline-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => onSelectCell?.(`F_DP_${index + 1}`, row.dataPrevista || '')}
                  >
                    <input
                      type="date"
                      value={toIsoDate(row.dataPrevista || '')}
                      onChange={(e) => handleCellEdit(index, 'dataPrevista', toBrDate(e.target.value))}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker?.();
                        } catch {}
                      }}
                      className="w-full h-full px-1.5 py-1 text-center bg-transparent outline-none focus:bg-white text-slate-800 font-mono text-[11px] cursor-pointer"
                    />
                  </td>
                  <td
                    className={`border-r border-slate-300 p-0 text-center font-bold ${
                      selectedCell === `F_QT_${index + 1}` ? 'outline-2 outline-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => onSelectCell?.(`F_QT_${index + 1}`, String(row.qtd))}
                  >
                    <input
                      type="number"
                      value={row.qtd === 0 ? '' : row.qtd}
                      onChange={(e) => handleCellEdit(index, 'qtd', e.target.value)}
                      placeholder="0"
                      className="w-full h-full px-1 py-1 text-center bg-transparent outline-none focus:bg-white text-slate-900 font-bold"
                    />
                  </td>
                  <td className="p-0 text-center">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 rounded transition-opacity cursor-pointer"
                        title="Excluir obra/previsão (Administrador)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span
                        className="opacity-0 group-hover:opacity-50 p-1 inline-flex items-center justify-center text-slate-400 cursor-not-allowed transition-opacity"
                        title="Apenas administradores podem excluir obras"
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Linhas vazias de preenchimento */}
              {Array.from({ length: Math.max(0, 10 - rows.length) }).map((_, i) => {
                const rowNum = rows.length + i + 1;
                return (
                  <tr
                    key={`empty-fore-${i}`}
                    onClick={handleOpenAddModal}
                    className="border-b border-slate-200/70 hover:bg-slate-50 cursor-pointer h-[28px] transition-colors"
                    title="Clique para adicionar uma nova previsão"
                  >
                    <td className="border-r border-slate-300 px-1 py-1 text-center text-slate-300 font-mono text-[10px] select-none bg-slate-50/40">
                      {rowNum}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-1 text-slate-300 text-center text-[10px]">-</td>
                    <td className="border-r border-slate-300 px-2 py-1"></td>
                    <td className="border-r border-slate-300 px-2 py-1"></td>
                    <td className="border-r border-slate-300 px-2 py-1"></td>
                    <td className="border-r border-slate-300 px-2 py-1 text-center text-slate-300 text-[10px]">-</td>
                    <td className="border-r border-slate-300 px-1 py-1 text-center text-slate-300 text-[10px] font-bold">0</td>
                    <td className="px-1 py-1 text-center"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Sub-table: QUANTIDADE TOTAL A INSTALAR (Dynamic auto-sum in red font) */}
      <div className="bg-white border-2 border-black rounded shadow-sm overflow-hidden text-xs">
        <div className="bg-[#f2f2f2] border-b-2 border-black px-3.5 py-1.5 flex items-center justify-between font-extrabold text-black uppercase text-[12px] tracking-wide">
          <span className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-blue-700" />
            QUANTIDADE TOTAL A INSTALAR NO MÊS
          </span>
          <span className="text-[12px] text-slate-800 font-bold normal-case bg-white px-2 py-0.5 rounded border border-black/20">
            Total Geral Previsto: <span className="text-[#ff0000] font-black text-[13px]">{grandTotal} unidades</span>
          </span>
        </div>

        {/* 4-column balanced card strip on wider screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-300">
          {MAIN_EQUIPMENT_CATEGORIES.map((cat) => {
            const totalVal = totals[cat.key] || 0;
            return (
              <div key={cat.key} className="p-2.5 text-center bg-white hover:bg-slate-50 transition-colors">
                <div className="text-[11px] font-semibold text-slate-700 leading-tight min-h-[28px] flex items-center justify-center">
                  {cat.labelSummary}
                </div>
                <div className="text-[20px] font-black text-[#ff0000] mt-1 font-mono tracking-tight">
                  {totalVal}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP / MODAL: ADICIONAR PREVISÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-2xl border-2 border-black w-full max-w-md overflow-hidden text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#b8cce4] border-b-2 border-black px-4 py-3 flex items-center justify-between font-extrabold text-black uppercase tracking-wider text-[13px]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-black stroke-[3]" />
                <span>Adicionar Previsão de Instalação</span>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1 hover:bg-black/10 rounded transition-colors text-black cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmAddRow} className="p-4 space-y-3.5">
              {/* Número do Chamado */}
              <div>
                <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1">
                  Número do Chamado
                </label>
                <input
                  type="text"
                  value={formChamado}
                  onChange={(e) => setFormChamado(e.target.value)}
                  placeholder="Ex: 4890"
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 font-mono focus:border-black focus:ring-1 focus:ring-black outline-none"
                  autoFocus
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={formCliente}
                  onChange={(e) => setFormCliente(e.target.value)}
                  placeholder="Ex: TRISUL"
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 uppercase font-medium focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              {/* Obra */}
              <div>
                <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1">
                  Obra
                </label>
                <input
                  type="text"
                  value={formObra}
                  onChange={(e) => setFormObra(e.target.value)}
                  placeholder="Ex: ALTO DA LAPA"
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 uppercase font-medium focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              {/* Equipamento (Seleção) */}
              <div>
                <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1">
                  Equipamento <span className="text-red-600">*</span>
                </label>
                <select
                  value={formEquipamento}
                  onChange={(e) => setFormEquipamento(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900 bg-white font-medium focus:border-black focus:ring-1 focus:ring-black outline-none cursor-pointer"
                >
                  {STANDARD_EQUIPMENTS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Prevista e Quantidade lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                {/* Data Prevista */}
                <div>
                  <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1">
                    Data Prevista
                  </label>
                  <div className="relative">
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={toIsoDate(formDataPrevista)}
                      onChange={(e) => setFormDataPrevista(toBrDate(e.target.value))}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker?.();
                        } catch {}
                      }}
                      onFocus={(e) => {
                        try {
                          e.currentTarget.showPicker?.();
                        } catch {}
                      }}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900 font-mono focus:border-black focus:ring-1 focus:ring-black outline-none cursor-pointer bg-white"
                    />
                  </div>
                </div>

                {/* Quantidade */}
                <div>
                  <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1">
                    Quantidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQtd}
                    onChange={(e) => setFormQtd(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900 font-bold font-mono text-center focus:border-black focus:ring-1 focus:ring-black outline-none"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-3.5 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-black text-white hover:bg-slate-800 px-4 py-2 rounded text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  Adicionar à Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
