insert into merchants (
  merchant_id,
  name,
  branch_name,
  category,
  address,
  theme_color,
  status,
  source,
  review_targets
)
values (
  'cqxm_xingguang_001',
  '重庆小面',
  '星光广场店',
  '米粉面馆',
  '无锡市滨湖区蠡湖大道与吴都路交叉口',
  '#C43D30',
  'active',
  '单商户MVP测试数据',
  '[]'::jsonb
)
on conflict (merchant_id) do update set
  name = excluded.name,
  branch_name = excluded.branch_name,
  category = excluded.category,
  address = excluded.address,
  theme_color = excluded.theme_color,
  status = excluded.status,
  source = excluded.source,
  review_targets = excluded.review_targets,
  updated_at = now();

insert into dishes (dish_id, merchant_id, name, is_signature, sort_order)
values
  ('cqxm_pea_noodles', 'cqxm_xingguang_001', '重庆豌杂拌面', true, 1),
  ('cqxm_hot_sour_noodles', 'cqxm_xingguang_001', '重庆酸辣粉', true, 2),
  ('cqxm_classic_noodles', 'cqxm_xingguang_001', '重庆小面', true, 3)
on conflict (dish_id) do update set
  merchant_id = excluded.merchant_id,
  name = excluded.name,
  is_signature = excluded.is_signature,
  status = 'active',
  sort_order = excluded.sort_order;
