export interface CreateProfileRequest {
  profile_name: string;
  group_name?: string;
  browser_core?: string;
  browser_name?: string;
  browser_version?: string;
  is_random_browser_version?: boolean;
  raw_proxy?: string;
  startup_urls?: string;
  is_masked_font?: boolean;
  is_noise_canvas?: boolean;
  is_noise_webgl?: boolean;
  is_noise_client_rect?: boolean;
  is_noise_audio_context?: boolean;
  is_random_screen?: boolean;
  is_masked_webgl_data?: boolean;
  is_masked_media_device?: boolean;
  is_random_os?: boolean;
  os?: string;
  webrtc_mode?: number;
  user_agent?: string;
}

export interface BrowserProfileData {
  id: string;
  name: string;
  raw_proxy: string;
  profile_path: string;
  browser_type: string;
  browser_version: string;
  note: string | null;
  group_id: number;
  created_at: string;
}

export interface CreateProfileResponse {
  success: boolean;
  data: BrowserProfileData;
  message: string;
}

export interface StartProfileData {
  success: boolean;
  profile_id: string;
  browser_location: string;
  remote_debugging_address: string;
  driver_path: string;
}

export interface StartProfileResponse {
  success: boolean;
  data: StartProfileData;
  message: string;
}

export interface CloseProfileResponse {
  success: boolean;
  message: string;
}

export interface DeleteProfileResponse {
  success: boolean;
  data: null;
  message: string;
}

export interface ProfileListItem {
  id: string;
  name: string;
  browser_type: string;
  browser_version: string;
  raw_proxy: string;
  group_id: number;
  created_at: string;
  isRunning?: boolean;
}
