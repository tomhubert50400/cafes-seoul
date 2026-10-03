import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL('supabase/migrations/' + file, base), 'utf8');
const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
for (const repo of ['cafes-seoul']) {
 const db = new PGlite();
 await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role;
 CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE SQL AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE TABLE public.profiles (id uuid PRIMARY KEY, display_name text, role text DEFAULT 'user', scheduled_for_deletion_at timestamptz,
 role_updated_at timestamptz, is_moderator boolean DEFAULT false, is_verified boolean DEFAULT false, is_pro boolean DEFAULT false);
 GRANT USAGE ON SCHEMA public, auth TO authenticated, anon; GRANT ALL ON profiles TO authenticated;
 INSERT INTO profiles(id) VALUES ('${me}'),('${other}');
`);
 const migration = '3109_protect_profile_privileges.sql';
 await db.exec(read(migration));
 await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${me}'; UPDATE profiles SET display_name='Allowed' WHERE id='${me}';`);
 await assert.rejects(db.exec(`UPDATE profiles SET role='admin' WHERE id='${me}'`), /server-managed/);
 await assert.rejects(db.exec(`INSERT INTO profiles(id,role) VALUES ('33333333-3333-4333-8333-333333333333','admin')`), /server-managed/);

  for(const col of ['is_moderator','is_verified','is_pro']) await assert.rejects(db.exec(`UPDATE profiles SET ${col}=true WHERE id='${me}'`), /server-managed/);
 await db.exec(`RESET ROLE; UPDATE profiles SET role='admin' WHERE id='${me}'`);
 assert.equal((await db.query(`SELECT role FROM profiles WHERE id='${me}'`)).rows[0].role,'admin');
 {
  await db.exec(read('3110_scope_user_preferences.sql'));
  await db.exec(`SET ROLE authenticated;`);
  await assert.rejects(db.exec(`SELECT get_user_preferences('${other}')`), /Unauthorized/);
  await db.exec(`RESET ROLE; SET ROLE anon;`);
  await assert.rejects(db.exec(`SELECT get_user_preferences('${me}')`), /permission denied/);
  await db.exec(`RESET ROLE; CREATE TABLE cafes(id uuid primary key,
 rating_drinks numeric, rating_service numeric, rating_price_value numeric, rating_quietness numeric,
 rating_seating numeric, rating_comfort numeric, rating_food numeric, rating_lighting numeric, rating_aesthetic numeric,
 is_pet_friendly boolean, has_wifi boolean, has_power_outlets boolean, is_laptop_friendly boolean, has_parking boolean);
 CREATE TABLE auth.users(id uuid primary key);
 CREATE TABLE cafe_ratings(user_id uuid, cafe_id uuid, overall numeric,
 drinks numeric, service numeric, price_value numeric, quietness numeric, seating numeric, comfort numeric,
 food numeric, lighting numeric, aesthetic numeric, pet_friendly boolean, has_wifi boolean, has_power_outlets boolean,
 is_laptop_friendly boolean, has_parking boolean);
 CREATE TABLE user_favorites(user_id uuid, cafe_id uuid);
 CREATE TABLE analytics_events(user_id uuid, event_type text, event_data jsonb);
 INSERT INTO cafe_ratings(user_id,overall,drinks) VALUES ('${me}',5,4);`);
  await db.exec(read('3102_cafe_monthly_stats.sql'));
  await db.exec(read('3103_cafe_owners.sql'));
  await db.exec('SET ROLE authenticated');
  const prefs = (await db.query(`SELECT get_user_preferences('${me}') AS value`)).rows[0].value;
  assert.equal(prefs.dimensions.drinks,4);
  await db.exec('RESET ROLE');
 }
 await db.close();
 console.log(repo+': profile privilege, caller ownership and SQL policy checks PASS');
}
