// components/VoucherSelector.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Voucher } from "@/types/voucher";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Ticket, CheckCircle, Circle } from "lucide-react";

interface Props {
  subtotal: number;
  onSelect: (voucher: { discount?: Voucher; shipping?: Voucher }) => void;
  onIdChange?: (ids: { idVoucherDiscount?: string; idVoucherShipping?: string }) => void;
}



export default function 

({ subtotal, onSelect, onIdChange }: Props) {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState<{ discount?: Voucher; shipping?: Voucher }>({});

  useEffect(() => {
    if (user?.id) {
      api.getUserVouchers(user.id)
        .then((data) => {
          setVouchers(data); // data chỉ là danh sách voucher chưa dùng
        })
        .catch(err => {
          console.error("Lỗi lấy voucher chưa dùng:", err);
        });
    }
  }, [user?.id]);

  const handleSelect = (voucher: Voucher) => {
    const isShipping = voucher.type === "Shipping";
    const alreadySelected = isShipping ? selected.shipping?.id === voucher.id : selected.discount?.id === voucher.id;

    const updated = {
      ...selected,
      [isShipping ? "shipping" : "discount"]: alreadySelected ? undefined : voucher
    };
    setSelected(updated);
    onSelect(updated);

    if (onIdChange) {
      const ids = {
        idVoucherDiscount: updated.discount?.id,
        idVoucherShipping: updated.shipping?.id
      };
      console.log("🧾 Voucher IDs Selected:", ids); // ✅ LOG NÀY SẼ HIỂN THỊ KẾT QUẢ
      onIdChange(ids);
    }
  };

  const grouped = {
    discount: vouchers.filter(v => v.type !== 'Shipping'),
    shipping: vouchers.filter(v => v.type === 'Shipping')
  };

  const isVoucherEligible = (v: Voucher) => {
    return subtotal >= (v.minimumOrderValue || 0);
  };
  

  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 border rounded shadow-sm mb-4">
      <div className="flex items-center space-x-2">
        <Ticket className="text-orange-500" />
        <span className="text-lg font-medium">Cục Tác Voucher</span>
      </div>
      <Button type="button" variant="link" className="text-blue-600" onClick={() => setShowDialog(true)}>
        Chọn Voucher
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chọn Voucher</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-4">
  {grouped.discount.length === 0 && grouped.shipping.length === 0 ? (
    <p className="text-center text-gray-600 mt-4">
      Bạn chưa có voucher nào. Vui lòng đến <a href="/voucher" className="text-blue-600 underline">trang voucher</a> để tìm kiếm những voucher nhé.
    </p>
  ) : (
    (['discount', 'shipping'] as const).map(type => (
      <div key={type}>
        <h3 className="text-orange-500 font-semibold mb-2">
          {type === 'discount' ? 'Voucher Giảm Giá' : 'Voucher Miễn Phí Vận Chuyển'}
        </h3>
        <div className="space-y-4">
          {grouped[type].map((v) => {
            const isSelected = (type === 'shipping' ? selected.shipping?.id : selected.discount?.id) === v.id;
            const isEligible = isVoucherEligible(v);

            return (
              <div
                key={v.id}
                className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer hover:border-orange-500
                  ${isSelected ? 'border-orange-500' : 'bg-white shadow-sm'}
                  ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => {
                  if (!isEligible) return;
                  handleSelect(v);
                }}
              >
                <div>
                  <p className="font-semibold text-orange-600">
                    {v.type === 'Shipping' ? 'Miễn phí vận chuyển' : v.type === 'Percent' ? `Giảm ${v.discountPercent}%` : `Giảm ${v.discountValue?.toLocaleString()}₫`}
                  </p>
                  <p className="text-sm text-gray-600">
                    Đơn tối thiểu {v.minimumOrderValue.toLocaleString()}₫
                  </p>
                  <p className="text-sm text-gray-500">
                    HSD: {new Date(v.expirationDate).toLocaleString("vi-VN")}
                  </p>
                  {!isEligible && (
                    <p className="text-sm text-red-500 mt-1">Không đủ điều kiện áp dụng</p>
                  )}
                </div>
                {isSelected && isEligible ? (
                  <CheckCircle className="text-green-600 w-6 h-6" />
                ) : (
                  <Circle className="text-gray-400 w-6 h-6" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    ))
  )}
</div>

        </DialogContent>
      </Dialog>
    </div>
  );
}


