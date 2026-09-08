import { EXPERIENCE_ASPECTS } from "@/config/experienceAspects";
import type { ExperienceAspectId } from "@/types/domain";

interface ExperienceTagsProps {
  selections: Partial<Record<ExperienceAspectId, string>>;
  onChange: (aspect: ExperienceAspectId, optionId: string) => void;
}

export function ExperienceTags({ selections, onChange }: ExperienceTagsProps) {
  return (
    <fieldset className="field-group">
      <legend>选择真实感受 <span className="optional">至少选一项，或填写文字</span></legend>
      <p className="field-help">每个维度只选一个，正面、一般和负面体验都可以如实表达。</p>
      <div className="aspect-list">
        {EXPERIENCE_ASPECTS.map((aspect) => (
          <div className="aspect-row" key={aspect.id}>
            <span className="aspect-label">{aspect.label}</span>
            <div className="segmented-control" role="group" aria-label={aspect.label}>
              {aspect.options.map((option) => (
                <button
                  aria-pressed={selections[aspect.id] === option.id}
                  className={`segment segment-${option.sentiment}${selections[aspect.id] === option.id ? " selected" : ""}`}
                  key={option.id}
                  onClick={() => onChange(aspect.id, option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
