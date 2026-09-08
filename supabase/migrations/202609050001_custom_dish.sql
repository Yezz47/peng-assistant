alter table feedback_samples
  add column if not exists custom_dish_text_redacted text;
