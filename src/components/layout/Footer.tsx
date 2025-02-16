import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Cục tác Chicken</h3>
            <p className="text-gray-400">Thương hiệu gà rán số 1 Việt Nam</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Liên hệ</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span>1900 1234</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span>info@cuctacchicken.vn</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Theo dõi chúng tôi</h4>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Đăng ký nhận tin</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                className="px-4 py-2 rounded-lg bg-gray-800 text-white w-full"
              />
              <Button>Gửi</Button>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 CucTacChicken. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
