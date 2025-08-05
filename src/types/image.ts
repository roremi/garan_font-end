// types/image.ts
export interface ImageUploadResponse {
    data?: string;
    id: number;
    fileName: string;
    filePath: string;
    contentType: string;
    fileSize: number;
    status?: number;
    uploadDate: string;
    url?: string;
    imageUrl?: string;
  }
  