'use client';

import React, { useState } from 'react';
import {
  Plus,
  Play,
  Square,
  Trash2,
  Monitor,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { browserProfileService } from '@/services/browserProfile.service';
import {
  CreateProfileRequest,
  BrowserProfileData,
  StartProfileData,
} from '@/types/browserProfile';

const DEFAULT_FORM: CreateProfileRequest = {
  profile_name: '',
  group_name: 'All',
  browser_core: 'chromium',
  browser_name: 'Chrome',
  browser_version: '119.0.6045.124',
  is_random_browser_version: false,
  raw_proxy: '',
  startup_urls: '',
  is_masked_font: true,
  is_noise_canvas: false,
  is_noise_webgl: false,
  is_noise_client_rect: false,
  is_noise_audio_context: true,
  is_random_screen: false,
  is_masked_webgl_data: true,
  is_masked_media_device: true,
  is_random_os: false,
  os: 'Windows 11',
  webrtc_mode: 2,
  user_agent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
};

interface ProfileEntry extends BrowserProfileData {
  isRunning: boolean;
  debugAddress?: string;
}

export default function BrowserProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; mode: 1 | 2 } | null>(null);
  const [form, setForm] = useState<CreateProfileRequest>({ ...DEFAULT_FORM });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [startResult, setStartResult] = useState<StartProfileData | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const handleFormChange = (field: keyof CreateProfileRequest, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!form.profile_name.trim()) {
      toast.error('Vui lòng nhập tên profile');
      return;
    }
    setIsCreating(true);
    try {
      const res = await browserProfileService.createProfile(form);
      if (res.success) {
        toast.success(`Tạo profile "${res.data.name}" thành công`);
        setProfiles((prev) => [
          { ...res.data, isRunning: false },
          ...prev,
        ]);
        setIsCreateOpen(false);
        setForm({ ...DEFAULT_FORM });
      } else {
        toast.error(res.message || 'Tạo profile thất bại');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể kết nối tới GPM Login');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStart = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await browserProfileService.startProfile(id);
      if (res.success) {
        toast.success('Mở profile thành công');
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, isRunning: true, debugAddress: res.data.remote_debugging_address }
              : p
          )
        );
        setStartResult(res.data);
        setIsResultOpen(true);
      } else {
        toast.error(res.message || 'Mở profile thất bại');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở profile');
    } finally {
      setLoadingId(null);
    }
  };

  const handleClose = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await browserProfileService.closeProfile(id);
      if (res.success) {
        toast.success('Đóng profile thành công');
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isRunning: false, debugAddress: undefined } : p))
        );
      } else {
        toast.error(res.message || 'Đóng profile thất bại');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể đóng profile');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteTarget({ id, mode: 2 });
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoadingId(deleteTarget.id);
    setIsDeleteOpen(false);
    try {
      const res = await browserProfileService.deleteProfile(deleteTarget.id, deleteTarget.mode);
      if (res.success) {
        toast.success('Xóa profile thành công');
        setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      } else {
        toast.error(res.message || 'Xóa profile thất bại');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa profile');
    } finally {
      setLoadingId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Quản lý Browser Profile (GPM Login)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kết nối tới GPM Login tại <code className="bg-gray-100 px-1 rounded">127.0.0.1:19995</code>
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Profile mới
        </Button>
      </div>

      {/* Profile table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Profile</CardTitle>
          <CardDescription>
            {profiles.length === 0
              ? 'Chưa có profile nào. Tạo profile mới để bắt đầu.'
              : `${profiles.length} profile`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Monitor className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tạo profile mới để bắt đầu quản lý trình duyệt</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Profile</TableHead>
                  <TableHead>Trình duyệt</TableHead>
                  <TableHead>Phiên bản</TableHead>
                  <TableHead>Proxy</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.browser_type}</TableCell>
                    <TableCell>{profile.browser_version}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {profile.raw_proxy || '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          profile.isRunning
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            profile.isRunning ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {profile.isRunning ? 'Đang chạy' : 'Đã đóng'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!profile.isRunning ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            disabled={loadingId === profile.id}
                            onClick={() => handleStart(profile.id)}
                          >
                            {loadingId === profile.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1">Mở</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            disabled={loadingId === profile.id}
                            onClick={() => handleClose(profile.id)}
                          >
                            {loadingId === profile.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Square className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1">Đóng</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={loadingId === profile.id}
                          onClick={() => confirmDelete(profile.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="ml-1">Xóa</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Profile Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Browser Profile mới</DialogTitle>
            <DialogDescription>
              Tạo profile trình duyệt mới thông qua GPM Login API
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="profile_name">
                  Tên Profile <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="profile_name"
                  placeholder="Nhập tên profile"
                  value={form.profile_name}
                  onChange={(e) => handleFormChange('profile_name', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="group_name">Tên Group</Label>
                <Input
                  id="group_name"
                  placeholder="All"
                  value={form.group_name}
                  onChange={(e) => handleFormChange('group_name', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="os">Hệ điều hành</Label>
                <Input
                  id="os"
                  placeholder="Windows 11"
                  value={form.os}
                  onChange={(e) => handleFormChange('os', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="browser_name">Trình duyệt</Label>
                <Input
                  id="browser_name"
                  placeholder="Chrome"
                  value={form.browser_name}
                  onChange={(e) => handleFormChange('browser_name', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="browser_version">Phiên bản trình duyệt</Label>
                <Input
                  id="browser_version"
                  placeholder="119.0.6045.124"
                  value={form.browser_version}
                  onChange={(e) => handleFormChange('browser_version', e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="raw_proxy">Proxy</Label>
                <Input
                  id="raw_proxy"
                  placeholder="IP:Port:User:Pass hoặc socks5://IP:Port:User:Pass"
                  value={form.raw_proxy}
                  onChange={(e) => handleFormChange('raw_proxy', e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="startup_urls">
                  <Globe className="inline h-3.5 w-3.5 mr-1" />
                  URL khởi động
                </Label>
                <Input
                  id="startup_urls"
                  placeholder="https://example.com, https://example2.com"
                  value={form.startup_urls}
                  onChange={(e) => handleFormChange('startup_urls', e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="user_agent">User Agent</Label>
                <Input
                  id="user_agent"
                  placeholder="Mozilla/5.0 ..."
                  value={form.user_agent}
                  onChange={(e) => handleFormChange('user_agent', e.target.value)}
                />
              </div>
            </div>

            {/* Advanced toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500 -ml-2"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              Tùy chọn nâng cao
            </Button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 border rounded-lg p-4 bg-gray-50">
                {(
                  [
                    { key: 'is_masked_font', label: 'Masked Font' },
                    { key: 'is_noise_canvas', label: 'Noise Canvas' },
                    { key: 'is_noise_webgl', label: 'Noise WebGL' },
                    { key: 'is_noise_client_rect', label: 'Noise Client Rect' },
                    { key: 'is_noise_audio_context', label: 'Noise Audio Context' },
                    { key: 'is_random_screen', label: 'Random Screen' },
                    { key: 'is_masked_webgl_data', label: 'Masked WebGL Data' },
                    { key: 'is_masked_media_device', label: 'Masked Media Device' },
                    { key: 'is_random_browser_version', label: 'Random Browser Version' },
                    { key: 'is_random_os', label: 'Random OS' },
                  ] as { key: keyof CreateProfileRequest; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm">
                      {label}
                    </Label>
                    <Switch
                      id={key}
                      checked={!!form[key]}
                      onCheckedChange={(checked) => handleFormChange(key, checked)}
                    />
                  </div>
                ))}

                <div className="col-span-2 flex items-center justify-between">
                  <Label htmlFor="webrtc_mode" className="text-sm">
                    WebRTC Mode
                  </Label>
                  <select
                    id="webrtc_mode"
                    className="border rounded px-2 py-1 text-sm bg-white"
                    value={form.webrtc_mode}
                    onChange={(e) => handleFormChange('webrtc_mode', Number(e.target.value))}
                  >
                    <option value={1}>Off</option>
                    <option value={2}>Base on IP</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start result dialog */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile đã được mở</DialogTitle>
            <DialogDescription>Thông tin kết nối trình duyệt</DialogDescription>
          </DialogHeader>
          {startResult && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Debug Address</span>
                <span className="col-span-2 font-mono bg-gray-100 px-2 py-0.5 rounded">
                  {startResult.remote_debugging_address}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Profile ID</span>
                <span className="col-span-2 font-mono bg-gray-100 px-2 py-0.5 rounded break-all">
                  {startResult.profile_id}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Driver</span>
                <span className="col-span-2 font-mono bg-gray-100 px-2 py-0.5 rounded break-all text-xs">
                  {startResult.driver_path}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsResultOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa Profile</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa profile này không? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Chế độ xóa:</p>
              <div className="flex gap-3">
                <Button
                  variant={deleteTarget.mode === 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeleteTarget((t) => t && { ...t, mode: 1 })}
                >
                  Chỉ xóa database
                </Button>
                <Button
                  variant={deleteTarget.mode === 2 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeleteTarget((t) => t && { ...t, mode: 2 })}
                >
                  Xóa database & dữ liệu
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
