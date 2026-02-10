export type Category = {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryDto = {
  name: string;
  order?: number;
};

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
