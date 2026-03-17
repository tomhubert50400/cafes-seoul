-- Calculate user taste profile from ratings, favorites, and views
create or replace function get_user_preferences(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  with
  rated_cafes as (
    select
      r.cafe_id, 3 as weight,
      r.drinks, r.service, r.price_value, r.quietness,
      r.seating, r.comfort, r.food, r.lighting, r.aesthetic,
      r.pet_friendly, r.has_wifi, r.has_power_outlets, r.is_laptop_friendly, r.has_parking
    from ratings r
    where r.user_id = p_user_id and r.overall >= 4
  ),
  fav_cafes as (
    select
      c.id as cafe_id, 2 as weight,
      (c.ratings->>'drinks')::numeric as drinks,
      (c.ratings->>'service')::numeric as service,
      (c.ratings->>'price_value')::numeric as price_value,
      (c.ratings->>'quietness')::numeric as quietness,
      (c.ratings->>'seating')::numeric as seating,
      (c.ratings->>'comfort')::numeric as comfort,
      (c.ratings->>'food')::numeric as food,
      (c.ratings->>'lighting')::numeric as lighting,
      (c.ratings->>'aesthetic')::numeric as aesthetic,
      c.is_pet_friendly as pet_friendly,
      c.has_wifi, c.has_power_outlets, c.is_laptop_friendly, c.has_parking
    from favorites f
    join cafes c on c.id = f.cafe_id
    where f.user_id = p_user_id
  ),
  viewed_cafes as (
    select
      (ae.event_data->>'cafe_id')::uuid as cafe_id,
      1 as weight,
      count(*) as view_count
    from analytics_events ae
    where ae.user_id = p_user_id and ae.event_type = 'cafe_view'
    group by ae.event_data->>'cafe_id'
    order by view_count desc
    limit 20
  ),
  viewed_with_data as (
    select
      vc.cafe_id, vc.weight,
      (c.ratings->>'drinks')::numeric as drinks,
      (c.ratings->>'service')::numeric as service,
      (c.ratings->>'price_value')::numeric as price_value,
      (c.ratings->>'quietness')::numeric as quietness,
      (c.ratings->>'seating')::numeric as seating,
      (c.ratings->>'comfort')::numeric as comfort,
      (c.ratings->>'food')::numeric as food,
      (c.ratings->>'lighting')::numeric as lighting,
      (c.ratings->>'aesthetic')::numeric as aesthetic,
      c.is_pet_friendly as pet_friendly,
      c.has_wifi, c.has_power_outlets, c.is_laptop_friendly, c.has_parking
    from viewed_cafes vc
    join cafes c on c.id = vc.cafe_id
  ),
  all_sources as (
    select * from rated_cafes
    union all
    select cafe_id, weight, drinks, service, price_value, quietness,
           seating, comfort, food, lighting, aesthetic,
           pet_friendly, has_wifi, has_power_outlets, is_laptop_friendly, has_parking
    from fav_cafes
    union all
    select cafe_id, weight, drinks, service, price_value, quietness,
           seating, comfort, food, lighting, aesthetic,
           pet_friendly, has_wifi, has_power_outlets, is_laptop_friendly, has_parking
    from viewed_with_data
  ),
  aggregated as (
    select
      round(sum(drinks * weight) / nullif(sum(case when drinks is not null then weight end), 0), 1) as drinks,
      round(sum(service * weight) / nullif(sum(case when service is not null then weight end), 0), 1) as service,
      round(sum(price_value * weight) / nullif(sum(case when price_value is not null then weight end), 0), 1) as price_value,
      round(sum(quietness * weight) / nullif(sum(case when quietness is not null then weight end), 0), 1) as quietness,
      round(sum(seating * weight) / nullif(sum(case when seating is not null then weight end), 0), 1) as seating,
      round(sum(comfort * weight) / nullif(sum(case when comfort is not null then weight end), 0), 1) as comfort,
      round(sum(food * weight) / nullif(sum(case when food is not null then weight end), 0), 1) as food,
      round(sum(lighting * weight) / nullif(sum(case when lighting is not null then weight end), 0), 1) as lighting,
      round(sum(aesthetic * weight) / nullif(sum(case when aesthetic is not null then weight end), 0), 1) as aesthetic,
      round(sum(case when pet_friendly then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as pet_friendly,
      round(sum(case when has_wifi then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as has_wifi,
      round(sum(case when has_power_outlets then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as has_power_outlets,
      round(sum(case when is_laptop_friendly then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as is_laptop_friendly,
      round(sum(case when has_parking then weight else 0 end)::numeric / nullif(sum(weight), 0), 2) > 0.5 as has_parking
    from all_sources
  )
  select jsonb_build_object(
    'dimensions', jsonb_build_object(
      'drinks', drinks, 'service', service, 'price_value', price_value,
      'quietness', quietness, 'seating', seating, 'comfort', comfort,
      'food', food, 'lighting', lighting, 'aesthetic', aesthetic
    ),
    'features', jsonb_build_object(
      'pet_friendly', pet_friendly, 'has_wifi', has_wifi,
      'has_power_outlets', has_power_outlets, 'is_laptop_friendly', is_laptop_friendly,
      'has_parking', has_parking
    )
  ) into result
  from aggregated;

  return coalesce(result, '{}'::jsonb);
end;
$$;
