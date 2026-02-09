-- ============================================
-- PERSONALIZED RECOMMENDATIONS
-- Content-based filtering using user's rating profile
-- ============================================

-- Main recommendation function
CREATE OR REPLACE FUNCTION public.get_recommendations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
    cafe_id UUID,
    similarity_score NUMERIC
) AS $$
DECLARE
    v_user_avg_drinks NUMERIC;
    v_user_avg_wifi NUMERIC;
    v_user_avg_price_value NUMERIC;
    v_user_avg_quietness NUMERIC;
    v_user_avg_seating NUMERIC;
    v_user_avg_comfort NUMERIC;
    v_user_avg_food NUMERIC;
    v_user_avg_lighting NUMERIC;
    v_user_avg_outlets NUMERIC;
    v_rated_dimensions INTEGER;
BEGIN
    -- Calculate user's taste profile (average of their rated dimensions, excluding 0s)
    SELECT
        COALESCE(AVG(NULLIF(drinks, 0)), 0),
        COALESCE(AVG(NULLIF(wifi, 0)), 0),
        COALESCE(AVG(NULLIF(price_value, 0)), 0),
        COALESCE(AVG(NULLIF(quietness, 0)), 0),
        COALESCE(AVG(NULLIF(seating, 0)), 0),
        COALESCE(AVG(NULLIF(comfort, 0)), 0),
        COALESCE(AVG(NULLIF(food, 0)), 0),
        COALESCE(AVG(NULLIF(lighting, 0)), 0),
        COALESCE(AVG(NULLIF(outlets, 0)), 0)
    INTO
        v_user_avg_drinks, v_user_avg_wifi, v_user_avg_price_value,
        v_user_avg_quietness, v_user_avg_seating, v_user_avg_comfort,
        v_user_avg_food, v_user_avg_lighting, v_user_avg_outlets
    FROM public.cafe_ratings
    WHERE user_id = p_user_id;

    -- Count how many dimensions the user has actually rated
    v_rated_dimensions := 0;
    IF v_user_avg_drinks > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_wifi > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_price_value > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_quietness > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_seating > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_comfort > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_food > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_lighting > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;
    IF v_user_avg_outlets > 0 THEN v_rated_dimensions := v_rated_dimensions + 1; END IF;

    -- If user hasn't rated enough dimensions, fall back to top-rated cafes they haven't visited
    IF v_rated_dimensions < 2 THEN
        RETURN QUERY
        SELECT c.id, c.overall_rating::NUMERIC AS similarity_score
        FROM public.cafes c
        WHERE c.status = 'active'
          AND c.total_ratings >= 1
          AND c.id NOT IN (SELECT cr.cafe_id FROM public.cafe_ratings cr WHERE cr.user_id = p_user_id)
        ORDER BY c.overall_rating DESC
        LIMIT p_limit;
        RETURN;
    END IF;

    -- Calculate similarity score between user profile and each unrated cafe
    -- Uses weighted Euclidean distance (inverted so higher = more similar)
    RETURN QUERY
    SELECT
        c.id AS cafe_id,
        (1.0 / (1.0 + SQRT(
            CASE WHEN v_user_avg_drinks > 0 AND c.rating_drinks > 0
                 THEN POWER(v_user_avg_drinks - c.rating_drinks, 2) ELSE 0 END +
            CASE WHEN v_user_avg_wifi > 0 AND c.rating_wifi > 0
                 THEN POWER(v_user_avg_wifi - c.rating_wifi, 2) ELSE 0 END +
            CASE WHEN v_user_avg_price_value > 0 AND c.rating_price_value > 0
                 THEN POWER(v_user_avg_price_value - c.rating_price_value, 2) ELSE 0 END +
            CASE WHEN v_user_avg_quietness > 0 AND c.rating_quietness > 0
                 THEN POWER(v_user_avg_quietness - c.rating_quietness, 2) ELSE 0 END +
            CASE WHEN v_user_avg_seating > 0 AND c.rating_seating > 0
                 THEN POWER(v_user_avg_seating - c.rating_seating, 2) ELSE 0 END +
            CASE WHEN v_user_avg_comfort > 0 AND c.rating_comfort > 0
                 THEN POWER(v_user_avg_comfort - c.rating_comfort, 2) ELSE 0 END +
            CASE WHEN v_user_avg_food > 0 AND c.rating_food > 0
                 THEN POWER(v_user_avg_food - c.rating_food, 2) ELSE 0 END +
            CASE WHEN v_user_avg_lighting > 0 AND c.rating_lighting > 0
                 THEN POWER(v_user_avg_lighting - c.rating_lighting, 2) ELSE 0 END +
            CASE WHEN v_user_avg_outlets > 0 AND c.rating_outlets > 0
                 THEN POWER(v_user_avg_outlets - c.rating_outlets, 2) ELSE 0 END
        ))) AS similarity_score
    FROM public.cafes c
    WHERE c.status = 'active'
      AND c.total_ratings >= 1
      AND c.id NOT IN (SELECT cr.cafe_id FROM public.cafe_ratings cr WHERE cr.user_id = p_user_id)
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_recommendations(UUID, INTEGER) TO authenticated;
