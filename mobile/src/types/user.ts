export type Role = 'USER' | 'SUPPLIER' | 'ADMIN';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResult = AuthTokens & { user: User };
