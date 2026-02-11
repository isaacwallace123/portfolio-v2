export type UploadedFile = {
  name: string;
  url: string;
  size: number;
  createdAt: string;
};

export type UploadResult = {
  name: string;
  originalName: string;
  url: string;
  size: number;
  type: string;
};
