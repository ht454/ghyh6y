import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "رقم الهاتف",
  className = '',
  error,
  required = false
}) => {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value.replace(/\D/g, ''); 
    onChange(phoneNumber);
  };

  return (
    <div className={className}>
      <div className="flex">
        {}
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          dir="ltr"
        />
      </div>
      
      {}
      {error && (
        <p className="mt-1 text-sm text-red-600 text-right">{error}</p>
      )}
    </div>
  );
};