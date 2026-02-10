export type Skill = {
  id: string;
  label: string;
  icon: string;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSkillDto = {
  label: string;
  icon: string;
  category: string;
  order?: number;
};

export type UpdateSkillDto = Partial<CreateSkillDto>;
