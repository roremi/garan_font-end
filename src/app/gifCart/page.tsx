"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import "./GiftCard.css";
import { useRouter } from "next/navigation";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface GiftPoint {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  points: number;
  spinCount: number;
  rank: string;
  lastUpdated: string;
}

const GiftPointDashboard: React.FC = () => {
  const [userPoints, setUserPoints] = useState<GiftPoint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.id) {
            const data = await api.getUserPoints(user.id);
            setUserPoints(data);
          } else {
            setError("Không tìm thấy ID người dùng.");
          }
        } catch (err) {
          setError("Lỗi khi lấy dữ liệu người dùng.");
        } finally {
          setLoading(false);
        }
      } else {
        setError("Không có thông tin người dùng trong localStorage.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header /> 

      <main className="flex-grow flex flex-col items-center pt-28 pb-16 space-y-6">
        {loading && <p className="text-lg font-body font-medium">Đang tải dữ liệu...</p>}

        {error && (
          <div className="p-4 bg-red-100 text-red-600 rounded-md shadow-md font-body">
            {error}
          </div>
        )}

        {userPoints && (
          <>
            <div
              className="w-[560px] h-[320px] rounded-xl shadow-2xl flex flex-col justify-between p-6 text-white relative"
              style={{
                background: "linear-gradient(135deg, #cba135, #e6cd7f)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {/* Header trên thẻ */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-title embossed-text tracking-wide">KF CUC TAC</h3>
                  <p className="text-sm font-title embossed-text uppercase">GIF-POINT-CARD</p>
                </div>
                <div className="text-right">
                  <p className="text-sm embossed-text font-title">POINT</p>
                  <p className="text-[10px] embossed-text font-body -mt-1">CART</p>
                </div>
              </div>

              {/* Thân thẻ */}
              <div className="text-base space-y-1 mt-4">
                <p className="embossed-text font-body">Họ Tên: {userPoints.userFullName}</p>
                <p className="embossed-text font-body">Email: {userPoints.userEmail}</p>
                <p className="embossed-text font-body">GP: {userPoints.points}</p>
                <p className="embossed-text font-body">Số Lượt Quay: {userPoints.spinCount}</p>
                <p className="embossed-text font-body">Hạng: {userPoints.rank}</p>
              </div>

              {/* Footer trong thẻ */}
              <div className="text-right text-sm text-white/70 mt-2 font-body">
                Powered by KF CUC TAC
              </div>
            </div>

            {/* Nút chuyển trang */}
            <button
              onClick={() => router.push('/SpinReward')}
              className="mt-4 mb-6 px-6 py-3 bg-orange-500 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
            >
              🎁 Quay Vòng Quay Nhận Thưởng Ngay
            </button>
          </>
        )}
      </main>


      <Footer /> 
    </div>
  );
};

export default GiftPointDashboard;
