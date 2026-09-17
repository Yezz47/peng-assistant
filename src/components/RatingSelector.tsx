import { BowlFace } from "@/components/BowlMascot";

interface RatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

/** 五档情绪文字，与《界面设计大纲》第 5 节「页面二」一致 */
const RATING_LABELS = ["很失望", "不太满意", "还可以", "比较满意", "很满意"];

/** 低分→柔和珊瑚，中分→暖琥珀，高分→嫩绿 */
function toneOf(rating: number): "low" | "mid" | "high" {
  if (rating <= 2) return "low";
  if (rating === 3) return "mid";
  return "high";
}

export function RatingSelector({ value, onChange, error }: RatingSelectorProps) {
  return (
    <fieldset className="field-group" aria-describedby={error ? "rating-error" : undefined}>
      <legend>这次整体感受如何？ <span className="required">必填</span></legend>
      <p className="field-help">选最接近的一档，不选也没关系——正面、一般和负面都可以说。</p>
      <div className="rating-row">
        {RATING_LABELS.map((label, index) => {
          const rating = index + 1;
          const selected = value === rating;
          return (
            <button
              aria-label={label}
              aria-pressed={selected}
              className={`rating-button${selected ? " selected" : ""}`}
              data-tone={toneOf(rating)}
              key={rating}
              onClick={() => onChange(rating)}
              type="button"
            >
              <BowlFace mood={rating as 1 | 2 | 3 | 4 | 5} />
              <small>{label}</small>
            </button>
          );
        })}
      </div>
      {value > 0 && <p className="selection-caption">已选择：{RATING_LABELS[value - 1]}</p>}
      {error && <p className="field-error" id="rating-error">{error}</p>}
    </fieldset>
  );
}
