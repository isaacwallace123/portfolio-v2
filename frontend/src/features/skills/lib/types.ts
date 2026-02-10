export type Skill = {
  id: string;
  label: string;
  icon: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    order: number;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSkillDto = {
  label: string;
  icon: string;
  categoryId: string;
  order?: number;
};

export type UpdateSkillDto = Partial<CreateSkillDto>;
