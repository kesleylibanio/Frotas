import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  label: string;
  value: string | number;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Selecione...', label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="space-y-1" ref={wrapperRef}>
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <button
          type="button"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-red-500 outline-none transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${value === option.value ? 'bg-red-50 text-red-700' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-4 py-2 text-sm text-slate-400 italic">Nenhuma opção encontrada</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
