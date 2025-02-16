'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Cục Tác Chicken',
    address: '123 Đường ABC, Quận XYZ, TP.HCM',
    phone: '1900 1234',
    email: 'info@cuctacchicken.vn',
  });

  const [deliverySettings, setDeliverySettings] = useState({
    minOrderAmount: 50000,
    deliveryFee: 15000,
    freeShippingAmount: 200000,
    maxDeliveryDistance: 10,
  });

  const handleSave = () => {
    // Xử lý lưu cài đặt
    alert('Đã lưu cài đặt thành công!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
        <Button onClick={handleSave}>
          <Save className="h-5 w-5 mr-2" />
          Lưu cài đặt
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">Thông tin chung</TabsTrigger>
            <TabsTrigger value="delivery">Vận chuyển</TabsTrigger>
            <TabsTrigger value="payment">Thanh toán</TabsTrigger>
            <TabsTrigger value="notification">Thông báo</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tên cửa hàng
                  </label>
                  <Input
                    value={generalSettings.storeName}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      storeName: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Địa chỉ
                  </label>
                  <Input
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      address: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số điện thoại
                  </label>
                  <Input
                    value={generalSettings.phone}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      phone: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      email: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delivery">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Đơn hàng tối thiểu
                  </label>
                  <Input
                    type="number"
                    value={deliverySettings.minOrderAmount}
                    onChange={(e) => setDeliverySettings({
                      ...deliverySettings,
                      minOrderAmount: Number(e.target.value)
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phí vận chuyển
                  </label>
                  <Input
                    type="number"
                    value={deliverySettings.deliveryFee}
                    onChange={(e) => setDeliverySettings({
                      ...deliverySettings,
                      deliveryFee: Number(e.target.value)
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Miễn phí vận chuyển từ
                  </label>
                  <Input
                    type="number"
                    value={deliverySettings.freeShippingAmount}
                    onChange={(e) => setDeliverySettings({
                      ...deliverySettings,
                      freeShippingAmount: Number(e.target.value)
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Khoảng cách giao hàng tối đa (km)
                  </label>
                  <Input
                    type="number"
                    value={deliverySettings.maxDeliveryDistance}
                    onChange={(e) => setDeliverySettings({
                      ...deliverySettings,
                      maxDeliveryDistance: Number(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Phương thức thanh toán</h3>
              {/* Thêm cài đặt thanh toán */}
            </div>
          </TabsContent>

          <TabsContent value="notification">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Cài đặt thông báo</h3>
              {/* Thêm cài đặt thông báo */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
