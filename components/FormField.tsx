"use client";

import React from "react";

type BaseProps = {
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
  required?: boolean;
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & BaseProps;
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & BaseProps;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps;

export function Input({
  label,
  helperText,
  error,
  className = "",
  required,
  ...props
}: InputProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <input
        {...props}
        className={`w-full border px-3 py-2 rounded outline-none text-gray-900 bg-white
        placeholder:text-gray-400
        ${error ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-blue-200"}
        `}
      />
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-600">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  helperText,
  error,
  className = "",
  required,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <select
        {...props}
        className={`w-full border px-3 py-2 rounded text-gray-900 bg-white
        ${error ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-blue-200"}
        `}
      >
        {children}
      </select>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-600">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  helperText,
  error,
  className = "",
  required,
  ...props
}: TextareaProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full border px-3 py-2 rounded outline-none text-gray-900 bg-white min-h-[100px]
        placeholder:text-gray-400
        ${error ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-blue-200"}
        `}
      />
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-600">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}