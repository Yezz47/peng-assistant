import type { ExperienceAspect } from "@/types/domain";

export const EXPERIENCE_ASPECTS: ExperienceAspect[] = [
  {
    id: "taste",
    label: "口味",
    options: [
      { id: "taste_dislike", label: "不喜欢", sentiment: "negative" },
      { id: "taste_neutral", label: "一般", sentiment: "neutral" },
      { id: "taste_like", label: "喜欢", sentiment: "positive" },
    ],
  },
  {
    id: "serving_speed",
    label: "上菜速度",
    options: [
      { id: "speed_slow", label: "慢", sentiment: "negative" },
      { id: "speed_neutral", label: "适中", sentiment: "neutral" },
      { id: "speed_fast", label: "快", sentiment: "positive" },
    ],
  },
  {
    id: "service",
    label: "服务",
    options: [
      { id: "service_unsatisfied", label: "不满意", sentiment: "negative" },
      { id: "service_neutral", label: "一般", sentiment: "neutral" },
      { id: "service_satisfied", label: "满意", sentiment: "positive" },
    ],
  },
  {
    id: "environment",
    label: "环境",
    options: [
      { id: "environment_uncomfortable", label: "不舒适", sentiment: "negative" },
      { id: "environment_neutral", label: "一般", sentiment: "neutral" },
      { id: "environment_comfortable", label: "舒适", sentiment: "positive" },
    ],
  },
];

export const EXPERIENCE_ASPECT_MAP = new Map(
  EXPERIENCE_ASPECTS.map((aspect) => [aspect.id, aspect]),
);
