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

## TypeScript/Code Issues

### Issue: TypeScript errors after coffee→drinks rename

**Date:** 2026-01-30
**Status:** 🟡 Medium Priority
**Phase:** 8 - Ratings System

#### Problem
After renaming the rating dimension from `coffee` to `drinks`, several TypeScript files still reference the old property name, causing compilation errors.

**Error Messages:**
```
src/components/ratings/rating-form.tsx:
- Object literal may only specify known properties, and 'drinks' does not exist in type 'RatingFormData'
- Type '"drinks"' is not assignable to type '"cafeId" | "overall" | "wifi" | ... | "coffee" | "petFriendly"'

src/lib/supabase/ratings.ts:
- Property 'coffee' does not exist on type 'RatingInput'

src/lib/actions/ratings.ts:
- Object literal may only specify known properties, and 'coffee' does not exist in type 'RatingInput'
```

#### Root Cause
The `rating-form.tsx` component uses a `RatingFormData` type (likely from react-hook-form) that still expects `coffee` instead of `drinks`. Additionally, some server-side code still references `coffee`.

#### Solution Required

1. **Update RatingFormData type/interface** to use `drinks` instead of `coffee`:
   - Check the zod schema or interface definition for `RatingFormData`
   - Change `coffee: number` to `drinks: number`

2. **Update rating-form.tsx component:**
   - Line 55: `drinks: existingRating.drinks` (already done)
   - Line 69: `drinks: 0` (already done)
   - Line 233: `name="drinks"` (already done)
   - But the form schema still expects `coffee`

3. **Update remaining references in:**
   - `src/lib/supabase/ratings.ts` (line 27)
   - `src/lib/actions/ratings.ts` (line 58)

#### Files to Fix
- `src/components/ratings/rating-form.tsx` - Form schema/type definition
- `src/lib/supabase/ratings.ts` - Remove remaining `coffee` references
- `src/lib/actions/ratings.ts` - Remove remaining `coffee` references

#### Impact
- ⚠️ Build fails due to TypeScript errors
- ⚠️ Cannot submit ratings until fixed

---

*Document created: 2026-01-30*
