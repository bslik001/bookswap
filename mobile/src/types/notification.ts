export type NotificationType =
  | 'BOOK_REQUEST'
  | 'REQUEST_UPDATE'
  | 'SUPPLIER_CONTACT'
  | 'SYSTEM';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  content: string;
  isRead: boolean;
  createdAt: string;
};

