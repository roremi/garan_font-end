// components/InventoryPanel.tsx
"use client";

import React from "react";

interface InventoryPanelProps {
  title: string;
  data: any[];
  columns: { label: string; key: string }[];
  onClose: () => void;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ title, data, columns, onClose }) => {
  return (
   <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg mt-24 w-full max-w-3xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-sm font-semibold"
          >
            ✕ Đóng
          </button>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200">
            <thead className="bg-gray-100 text-left">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-2 border">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 border">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-6 text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
