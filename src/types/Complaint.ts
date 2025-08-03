export interface Complaint {
  id: number;
  orderId: number;
  title: string;
  description: string;
  imageUrl?: string;
  status: number;
  createAt: string;
  updateAt?: string;
  order?: {
    id: number;
    nameCustomer: string;
    total: number;
    createAt: string;
  };
}

export interface ComplaintCreateRequest {
  orderId: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface ComplaintUpdateRequest {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface ComplaintStatistics {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  rejectedComplaints: number;
}