"use client";

import React, { useState } from "react";

interface InventoryPanelProps {
  title: string;
  data: any[];
  columns: { label: string; key: string }[];
  onClose: () => void;
  onViewDetail?: (row: any) => void;  // <- thêm dòng này

}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ title, data, columns, onClose, onViewDetail }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg mt-24 w-full max-w-3xl max-h-[85vh] overflow-auto">
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
                {onViewDetail && <th className="px-4 py-2 border">Xem</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 border">
                      {row[col.key]}
                    </td>
                  ))}
                  {onViewDetail && (
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => onViewDetail(row)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Xem
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-6 text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PHÂN TRANG */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded disabled:opacity-50"
              >
                ◀ Trang trước
              </button>
              <span className="text-sm">
                Trang <strong>{currentPage}</strong> / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded disabled:opacity-50"
              >
                Trang sau ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
