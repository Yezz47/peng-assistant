import type { Dish } from "@/types/domain";

interface DishSelectorProps {
  dishes: Dish[];
  selected: string[];
  onChange: (dishId: string) => void;
  customDish: string;
  onCustomDishChange: (value: string) => void;
  error?: string;
}

export function DishSelector({ dishes, selected, onChange, customDish, onCustomDishChange, error }: DishSelectorProps) {
  const activeDishes = dishes.filter((dish) => dish.status === "active").sort((a, b) => a.sortOrder - b.sortOrder);
  if (activeDishes.length === 0) return null;

  return (
    <fieldset className="field-group">
      <legend>本次吃过的菜品 <span className="optional">选填，最多3项</span></legend>
      <p className="field-help">选择菜品只表示你吃过，不代表喜欢或推荐。</p>
      <div className="chip-list">
        {activeDishes.map((dish) => (
          <button
            aria-pressed={selected.includes(dish.id)}
            className={`chip${selected.includes(dish.id) ? " selected" : ""}`}
            key={dish.id}
            onClick={() => onChange(dish.id)}
            type="button"
          >
            {dish.name}{dish.isSignature ? <small>招牌</small> : null}
          </button>
        ))}
      </div>
      <label className="custom-dish-label" htmlFor="custom-dish">其他菜品 <span className="optional">选填</span></label>
      <input
        className="text-input"
        id="custom-dish"
        maxLength={40}
        onChange={(event) => onCustomDishChange(event.target.value)}
        placeholder="没有列出？请输入菜名，多道菜可用顿号分隔"
        type="text"
        value={customDish}
      />
      <div className="field-footer">
        <span />
        <span className="character-count">{customDish.length}/40</span>
      </div>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}
