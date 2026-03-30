export type UploadedFile = {
  key: string;      // full S3 key: "icons/react.svg"
  name: string;     // filename only: "react.svg"
  folder: string;   // folder portion: "icons"
  url: string;
  size: number;
  createdAt: string;
};

export type UploadResult = {
  key: string;
  name: string;
  originalName: string;
  url: string;
  size: number;
  type: string;
};
