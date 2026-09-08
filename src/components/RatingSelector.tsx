interface RatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const RATING_LABELS = ["很不满意", "不太满意", "一般", "比较满意", "非常满意"];

export function RatingSelector({ value, onChange, error }: RatingSelectorProps) {
  return (
    <fieldset className="field-group" aria-describedby={error ? "rating-error" : undefined}>
      <legend>这次整体感受如何？ <span className="required">必填</span></legend>
      <div className="rating-row">
        {RATING_LABELS.map((label, index) => {
          const rating = index + 1;
          return (
            <button
              aria-label={`${rating}星，${label}`}
              aria-pressed={value === rating}
              className={`rating-button${value === rating ? " selected" : ""}`}
              key={rating}
              onClick={() => onChange(rating)}
              type="button"
            >
              <span className="star" aria-hidden="true">★</span>
              <small>{rating}星</small>
            </button>
          );
        })}
      </div>
      {value > 0 && <p className="selection-caption">已选择：{RATING_LABELS[value - 1]}</p>}
      {error && <p className="field-error" id="rating-error">{error}</p>}
    </fieldset>
  );
}
