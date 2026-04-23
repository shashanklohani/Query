export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PdfFile = {
  id: string;
  userId: string;
  originalFileName?: string;
  key: string;
  bucket: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
};

export type RegisterUserPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
};

export type LoginUserPayload = {
  email: string;
  password: string;
};

export type RegisterUserResponse = {
  message: string;
  user: AuthUser;
};

export type LoginUserResponse = RegisterUserResponse & {
  accessToken: string;
};

export type GetUserPdfsResponse = {
  userId: string;
  count: number;
  files: PdfFile[];
};

export type UploadPdfResponse = {
  message: string;
  file: PdfFile;
};

export type QueryPdfPayload = {
  pdfId: string;
  prompt: string;
  context: string;
};

export type QueryPdfResponse = {
  answer: string;
  pdfId: string;
  userId: string;
  model: string;
};
