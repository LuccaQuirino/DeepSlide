import React, { useEffect, useRef } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value = '',
  onChange,
  onFocus,
  className = '',
  rows = 1,
  placeholder,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(textarea.scrollHeight, rows > 1 ? rows * 22 : 36);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
    const timer = setTimeout(adjustHeight, 20);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value ?? ''}
      onChange={(e) => {
        adjustHeight();
        if (onChange) onChange(e);
      }}
      onFocus={(e) => {
        adjustHeight();
        if (onFocus) onFocus(e);
      }}
      rows={rows}
      placeholder={placeholder}
      className={`resize-none overflow-hidden transition-all duration-100 ${className}`}
      {...props}
    />
  );
};

