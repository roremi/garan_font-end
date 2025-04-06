// types/feedback.ts
interface User {
  id: number;
  username: string;
  fullName: string;
}

export interface Feedback {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: User;
}
