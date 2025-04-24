'use client';

import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';

export interface GiftPoint {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  points: number;
  spinCount: number;
  rank: string;
  lastUpdated: string;
}

const GiftPointPage = () => {
  const [giftPoints, setGiftPoints] = useState<GiftPoint[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSpinOpen, setModalSpinOpen] = useState(false);
  const [modalHistoryOpen, setModalHistoryOpen] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [addPointsValue, setAddPointsValue] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadGiftPoints();
  }, []);

  const loadGiftPoints = async () => {
    try {
      const data = await api.getAllGiftPoints();
      setGiftPoints(data);
      setTotalPoints(data.reduce((sum, item) => sum + item.points, 0));
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải điểm thưởng',
        variant: 'destructive',
      });
    }
  };

  const handleAddPoints = async () => {
    if (!selectedUserId || addPointsValue <= 0) return;
    try {
      await api.addPoints(selectedUserId, addPointsValue);
      toast({ title: 'Thành công', description: `+${addPointsValue} điểm cho ${selectedUserName}` });
      setModalOpen(false);
      loadGiftPoints();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddSpin = async () => {
    if (!selectedUserId || spinCount <= 0) return;
    try {
      await api.addSpinCount(selectedUserId, spinCount);
      toast({ title: 'Thành công', description: `+${spinCount} lượt quay cho ${selectedUserName}` });
      setModalSpinOpen(false);
      loadGiftPoints();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  const openAddPointsModal = (id: number, name: string) => {
    setSelectedUserId(id);
    setSelectedUserName(name);
    setAddPointsValue(0);
    setModalOpen(true);
  };

  const openAddSpinModal = (id: number, name: string) => {
    setSelectedUserId(id);
    setSelectedUserName(name);
    setSpinCount(0);
    setModalSpinOpen(true);
  };

  const openHistoryModal = async (id: number, name: string) => {
    try {
      const history = await api.getSpinHistory(id);
      setSpinHistory(history);
      setSelectedUserName(name);
      setModalHistoryOpen(true);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải lịch sử quay', variant: 'destructive' });
    }
  };

  const handleResetPoints = async (id: number, name: string) => {
    if (!confirm(`Xác nhận reset điểm của ${name}?`)) return;
    try {
      const currentUser = giftPoints.find((u) => u.userId === id);
      if (!currentUser) return;
      await api.useGiftPoints(id, currentUser.points);

      toast({ title: 'Đã reset', description: `Điểm ${name} đã về 0` });
      loadGiftPoints();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Điểm Thưởng Người Dùng</h1>
        <p className="text-gray-600">Tổng điểm toàn hệ thống: <strong>{totalPoints}</strong></p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Lượt quay</TableHead>
              <TableHead>Hạng</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {giftPoints.map((point) => (
              <TableRow key={point.id}>
                <TableCell>{point.id}</TableCell>
                <TableCell>{point.userFullName}</TableCell>
                <TableCell>{point.userEmail}</TableCell>
                <TableCell>{point.points}</TableCell>
                <TableCell>{point.spinCount}</TableCell>
                <TableCell>{point.rank}</TableCell>
                <TableCell>{new Date(point.lastUpdated).toLocaleString()}</TableCell>
                <TableCell className="space-y-1">
                  <Button size="sm" variant="outline" onClick={() => openAddPointsModal(point.userId, point.userFullName)}>+ Điểm</Button>
                  <Button size="sm" variant="outline" onClick={() => openAddSpinModal(point.userId, point.userFullName)}>+ Quay</Button>
                  <Button size="sm" variant="ghost" onClick={() => openHistoryModal(point.userId, point.userFullName)}>Lịch sử</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleResetPoints(point.userId, point.userFullName)}>Reset</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal cộng điểm */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm điểm cho {selectedUserName}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            placeholder="Nhập số điểm"
            value={addPointsValue}
            onChange={(e) => setAddPointsValue(Number(e.target.value))}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={handleAddPoints}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal cộng lượt quay */}
      <Dialog open={modalSpinOpen} onOpenChange={setModalSpinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm lượt quay cho {selectedUserName}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            placeholder="Nhập số lượt quay"
            value={spinCount}
            onChange={(e) => setSpinCount(Number(e.target.value))}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalSpinOpen(false)}>Hủy</Button>
            <Button onClick={handleAddSpin}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal lịch sử quay */}
      <Dialog open={modalHistoryOpen} onOpenChange={setModalHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lịch sử quay - {selectedUserName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 text-sm">
            {spinHistory.length === 0 ? (
              <p>Không có dữ liệu lịch sử.</p>
            ) : (
              spinHistory.map((entry, i) => (
                <div key={i} className="border-b pb-1">
                  🎁 {entry.rewardName} - {new Date(entry.time).toLocaleString()}

                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GiftPointPage;
