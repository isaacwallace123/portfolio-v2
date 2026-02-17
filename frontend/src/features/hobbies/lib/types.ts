export type Hobby = {
  id: string;
  label: string;
  labelFr: string | null;
  icon: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateHobbyDto = {
  label: string;
  labelFr?: string;
  icon?: string;
};

export type UpdateHobbyDto = Partial<CreateHobbyDto>;
