import React from 'react';

interface Props {
  label: string;
  children: React.ReactNode;
  description?: string;
}

export const InputGroup: React.FC<Props> = ({ label, children, description }) => {
  return (
    <div className="print-break-inside-avoid">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
};