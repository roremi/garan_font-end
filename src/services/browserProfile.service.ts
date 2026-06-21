import {
  CreateProfileRequest,
  CreateProfileResponse,
  StartProfileResponse,
  CloseProfileResponse,
  DeleteProfileResponse,
} from '@/types/browserProfile';

const GPM_API_BASE = 'http://127.0.0.1:19995/api/v3/profiles';

export const browserProfileService = {
  async createProfile(data: CreateProfileRequest): Promise<CreateProfileResponse> {
    const response = await fetch(`${GPM_API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Không thể tạo profile');
    }
    return response.json();
  },

  async startProfile(
    id: string,
    params?: { addination_args?: string; win_scale?: number; win_pos?: string; win_size?: string }
  ): Promise<StartProfileResponse> {
    const query = new URLSearchParams();
    if (params?.addination_args) query.set('addination_args', params.addination_args);
    if (params?.win_scale !== undefined) query.set('win_scale', String(params.win_scale));
    if (params?.win_pos) query.set('win_pos', params.win_pos);
    if (params?.win_size) query.set('win_size', params.win_size);

    const url = `${GPM_API_BASE}/start/${id}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Không thể mở profile');
    }
    return response.json();
  },

  async closeProfile(id: string): Promise<CloseProfileResponse> {
    const response = await fetch(`${GPM_API_BASE}/close/${id}`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Không thể đóng profile');
    }
    return response.json();
  },

  async deleteProfile(id: string, mode: 1 | 2 = 2): Promise<DeleteProfileResponse> {
    const response = await fetch(`${GPM_API_BASE}/delete/${id}?mode=${mode}`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Không thể xóa profile');
    }
    return response.json();
  },
};
