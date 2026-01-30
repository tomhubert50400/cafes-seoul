# Need Fix - Issues to Address

## Database Migration Issues

### Issue: Column 'coffee' does not exist in calculate_dimension_average function

**Date:** 2026-01-30
**Status:** 🔴 Blocker
**Phase:** 8 - Ratings System

#### Problem
After renaming the `coffee` column to `drinks` in the database, the `calculate_dimension_average` function still references the old column name. This causes an error when the `update_cafe_rating_aggregates` function tries to recalculate cafe ratings.

**Error Message:**
```
ERROR: 42703: column "coffee" does not exist
QUERY: SELECT AVG(coffee::NUMERIC) FROM public.cafe_ratings WHERE cafe_id = $1 AND coffee > 0
CONTEXT: PL/pgSQL function calculate_dimension_average(uuid,text) line 19 at EXECUTE
SQL statement "UPDATE public.cafes SET 
    total_ratings = v_total_ratings, 
    overall_rating = COALESCE(v_overall_avg, 0),
    rating_coffee = public.calculate_dimension_average(p_cafe_id, 'coffee'),
    ...
"
```

#### Root Cause
The `update_cafe_rating_aggregates` function is calling:
```sql
rating_coffee = public.calculate_dimension_average(p_cafe_id, 'coffee')
```

But it should be calling:
```sql
rating_drinks = public.calculate_dimension_average(p_cafe_id, 'drinks')
```

#### Solution Required

1. **Update the `update_cafe_rating_aggregates` function** to reference `rating_drinks` and pass `'drinks'` as the dimension parameter:

```sql
CREATE OR REPLACE FUNCTION public.update_cafe_rating_aggregates(p_cafe_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_ratings INTEGER;
    v_overall_avg NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_ratings
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;
    
    SELECT AVG(overall::NUMERIC) INTO v_overall_avg
    FROM public.cafe_ratings
    WHERE cafe_id = p_cafe_id;
    
    UPDATE public.cafes
    SET 
        total_ratings = v_total_ratings,
        overall_rating = COALESCE(v_overall_avg, 0),
        rating_drinks = public.calculate_dimension_average(p_cafe_id, 'drinks'),  -- Changed from 'coffee'
        rating_wifi = public.calculate_dimension_average(p_cafe_id, 'wifi'),
        rating_price_value = public.calculate_dimension_average(p_cafe_id, 'price_value'),
        rating_quietness = public.calculate_dimension_average(p_cafe_id, 'quietness'),
        rating_seating = public.calculate_dimension_average(p_cafe_id, 'seating'),
        rating_comfort = public.calculate_dimension_average(p_cafe_id, 'comfort'),
        rating_food = public.calculate_dimension_average(p_cafe_id, 'food'),
        rating_lighting = public.calculate_dimension_average(p_cafe_id, 'lighting'),
        rating_outlets = public.calculate_dimension_average(p_cafe_id, 'outlets'),
        updated_at = NOW()
    WHERE id = p_cafe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. **Run the fixed migration** in Supabase SQL Editor.

3. **Verify** by checking that cafes with ratings display correctly without errors.

#### Impact
- ⚠️ Cafe rating aggregations fail to update
- ⚠️ New ratings may not reflect in cafe overall scores
- ⚠️ Users see outdated or incorrect rating displays

#### Related Files
- `supabase/migrations/0801_cafe_ratings.sql` (original)
- `supabase/migrations/0802_rename_coffee_to_drinks.sql` (migration attempt)
- `src/lib/supabase/ratings.ts` (TypeScript code)

---

*Document created: 2026-01-30*
