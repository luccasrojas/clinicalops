export type User = {
  username: string;
  email: string;
  name: string;
  familyName: string;
  sub: string;
};

export type AuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

export type LoginResponse = {
  message: string;
  user: User;
} & AuthTokens;

export type RegisterStep1Response = {
  message: string;
  userSub: string;
  email: string;
  confirmed: boolean;
  nextStep: string;
};

export type RegisterStep2Response = {
  message: string;
  doctorID: string;
  email: string;
  structuredHistoryFields: number;
};
