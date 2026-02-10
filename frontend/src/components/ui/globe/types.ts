export type SkillItem = { label: string; color?: string; icon?: string };

export type SkillPoint = {
  pos: [number, number, number];
  skill: SkillItem;
};
