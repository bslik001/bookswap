export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'ACCEPTED' | 'REFUSED' | 'COMPLETED';

export type RequestSummary = {
  id: string;
  bookId?: string;
  bookTitle?: string;
  status: RequestStatus;
  createdAt: string;
};

export type MyRequest = {
  id: string;
  status: RequestStatus;
  createdAt: string;
  book: {
    id: string;
    title: string;
    imageUrl: string | null;
    grade: string;
  };
};

export type RequestParty = {
  id: string;
  firstName: string;
  lastName: string;
};

export type RequestDetail = {
  id: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    imageUrl: string | null;
    grade: string;
    owner: RequestParty;
  };
  requester: RequestParty;
};

export type BookRequestSummary = {
  id: string;
  status: RequestStatus;
  createdAt: string;
  requester: RequestParty;
};
