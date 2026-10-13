insert into dishes (dish_id, merchant_id, name, is_signature, status, sort_order)
select item.dish_id, merchant.merchant_id, item.name, false, 'active', item.sort_order
from merchants as merchant
cross join (values
  ('jnxz_supreme_lion_head', '至尊狮子头', 4),
  ('jnxz_kung_fu_fish', '功夫鱼', 5),
  ('jnxz_three_dice_bun', '三丁包', 6),
  ('jnxz_luyangchun', '绿杨春', 7),
  ('jnxz_crab_roe_soup_dumpling', '蟹粉汤包', 8)
) as item(dish_id, name, sort_order)
where merchant.merchant_id = 'jnxz_huhehaote_001'
on conflict (dish_id) do update set
  merchant_id = excluded.merchant_id,
  name = excluded.name,
  is_signature = excluded.is_signature,
  status = excluded.status,
  sort_order = excluded.sort_order;
