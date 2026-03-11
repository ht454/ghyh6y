import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface CountryCode {
  code: string;
  name: string;
  nameAr: string;
  dialCode: string;
  flag: string;
}

interface CountryCodeSelectorProps {
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  className?: string;
}


const countryCodes: CountryCode[] = [
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', nameAr: 'عمان', dialCode: '+968', flag: '🇴🇲' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', dialCode: '+20', flag: '🇪🇬' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', dialCode: '+962', flag: '🇯🇴' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', dialCode: '+964', flag: '🇮🇶' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', dialCode: '+961', flag: '🇱🇧' },
  { code: 'YE', name: 'Yemen', nameAr: 'اليمن', dialCode: '+967', flag: '🇾🇪' },
  { code: 'PS', name: 'Palestine', nameAr: 'فلسطين', dialCode: '+970', flag: '🇵🇸' },
  { code: 'SY', name: 'Syria', nameAr: 'سوريا', dialCode: '+963', flag: '🇸🇾' },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان', dialCode: '+249', flag: '🇸🇩' },
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا', dialCode: '+218', flag: '🇱🇾' },
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', dialCode: '+212', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', dialCode: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', dialCode: '+213', flag: '🇩🇿' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', dialCode: '+44', flag: '🇬🇧' }
];

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  selectedCountry,
  onCountryChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCountries = countryCodes.filter(country =>
    country.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  const handleCountrySelect = (country: CountryCode) => {
    onCountryChange(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm font-medium text-gray-700">
          {selectedCountry.dialCode}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن دولة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          {}
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right ${
                    selectedCountry.code === country.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1 text-right">
                    <div className="font-medium">{country.nameAr}</div>
                    <div className="text-sm text-gray-500">{country.name}</div>
                  </div>
                  <span className="text-sm font-mono text-gray-600">
                    {country.dialCode}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>لم يتم العثور على نتائج</p>
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};