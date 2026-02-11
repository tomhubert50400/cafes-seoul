# Plan : Recherche de cafes par station de metro

## Contexte

Les utilisateurs de l'app Seoul Cafes n'ont actuellement aucun moyen de chercher des cafes par proximite a une station de metro. A Seoul, le metro est le transport principal — pouvoir dire "montre-moi les cafes a 5 min a pied de Hapjeong" est un use case quotidien. L'infra geospatiale (PostGIS, `find_cafes_nearby` RPC, index GIST) existe deja. Il manque juste les donnees de stations et l'UI pour s'y connecter.

## Decisions de design

- **Marker station sur la map** : oui, avec cercle de rayon
- **Filtre par ligne entiere** : non, station individuelle uniquement
- **Rayon** : choix user en minutes de marche (5 / 10 / 15 min), traduit en metres (~400m / ~800m / ~1200m)
- **Cohabitation avec quartiers** : exclusif — selectionner une station desactive le filtre quartier et vice versa

---

## Etape 1 : Schema DB — tables `metro_lines` et `metro_stations`

**Fichier** : `supabase/migrations/XXXX_add_metro_stations.sql`

```sql
-- Table des lignes (utile pour couleur/nom meme si pas de filtre par ligne)
CREATE TABLE metro_lines (
  id SERIAL PRIMARY KEY,
  line_number VARCHAR(10) NOT NULL UNIQUE, -- '1', '2', ... '9', 'Bundang', 'Shinbundang', etc.
  name JSONB NOT NULL,                     -- { "en": "Line 1", "ko": "1호선", ... }
  color VARCHAR(7) NOT NULL               -- hex color, ex: '#0052A4'
);

-- Table des stations
CREATE TABLE metro_stations (
  id SERIAL PRIMARY KEY,
  name JSONB NOT NULL,                     -- { "en": "Hapjeong", "ko": "합정", ... }
  line_id INTEGER NOT NULL REFERENCES metro_lines(id),
  location GEOMETRY(POINT, 4326) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL
);

CREATE INDEX idx_metro_stations_location ON metro_stations USING GIST (location);
CREATE INDEX idx_metro_stations_line ON metro_stations (line_id);

-- RLS (lecture publique)
ALTER TABLE metro_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read metro_lines" ON metro_lines FOR SELECT USING (true);
CREATE POLICY "Public read metro_stations" ON metro_stations FOR SELECT USING (true);
```

Note : une station qui dessert plusieurs lignes aura plusieurs rows (une par ligne). C'est le pattern le plus simple pour afficher "Ligne X" a cote du nom.

## Etape 2 : Seed data — stations du metro de Seoul

**Fichier** : `supabase/migrations/XXXX_seed_metro_data.sql`

- Source : dataset Seoul Open Data Portal / Kaggle + complement GitHub
- ~24 lignes, ~656 stations (certaines en double car multi-lignes)
- Noms en ko + en minimum (fr/zh/vi peuvent etre identiques au en pour les noms propres)
- Coordonnees GPS pour chaque station

Le seed sera un gros INSERT INTO avec toutes les stations. A generer a partir d'un dataset public.

## Etape 3 : Types TypeScript

**Fichier** : `src/types/metro.ts`

```typescript
export interface MetroLine {
  id: number
  lineNumber: string
  name: TranslatedText
  color: string
}

export interface MetroStation {
  id: number
  name: TranslatedText
  lineId: number
  line?: MetroLine  // joined
  latitude: number
  longitude: number
}
```

## Etape 4 : API endpoint stations

**Fichier** : `src/app/api/stations/route.ts`

- `GET /api/stations` — retourne toutes les stations avec leur ligne
- Optionnel : `?q=hapjeong` pour recherche par nom (ILIKE sur les champs JSONB en/ko)
- Join `metro_lines` pour inclure couleur et nom de ligne
- Cache agressif (donnees statiques)

## Etape 5 : Mise a jour du systeme de filtres

### 5a. Types de filtres

**Fichier** : `src/types/map.ts`

Ajouter a `MapFilters` :
```typescript
stationId?: number | null
walkingMinutes?: 5 | 10 | 15  // defaut: 10
```

### 5b. Hook useMapFilters

**Fichier** : `src/hooks/use-map-filters.ts`

- Ajouter state `stationId` et `walkingMinutes`
- Quand `stationId` est set → reset `districts` a `[]`
- Quand `districts` est set → reset `stationId` a `null`
- `walkingMinutes` par defaut = 10
- Compteur de filtres actifs : inclure station

### 5c. Filtrage client-side (map)

**Fichier** : `src/lib/utils/filter-cafes.ts`

- Si `stationId` est set, calculer la distance cafe<->station avec Haversine
- Convertir `walkingMinutes` en metres (5->400, 10->800, 15->1200)
- Filtrer les cafes dont la distance < rayon

### 5d. Filtrage server-side (browse/cafes)

**Fichier** : `src/app/api/cafes/route.ts`

- Si params `stationId` + `walkingMinutes` presents :
  - Recuperer coordonnees de la station
  - Utiliser `ST_DWithin` ou reutiliser le pattern de `find_cafes_nearby`
  - Ajouter le champ `distance` dans la reponse

## Etape 6 : Composant UI — Station Selector

**Fichier** : `src/components/filters/station-selector.tsx`

- Combobox (shadcn/ui) avec recherche
- Fetch `/api/stations` au mount, filtrer en local au fur et a mesure de la saisie
- Afficher : nom de station + pastille de couleur de la ligne + numero de ligne
- Quand une station est selectionnee → met a jour le filtre
- Bouton clear pour deselectionner

**Fichier** : `src/components/filters/walking-time-selector.tsx`

- 3 boutons radio/toggle : "5 min" / "10 min" / "15 min"
- Affiche seulement quand une station est selectionnee

## Etape 7 : Integration dans les pages de filtres

### 7a. Map page filters

**Fichier** : `src/components/map/map-filters-panel.tsx` (ou equivalent)

- Ajouter section "Station de metro" dans le panneau de filtres
- Quand station selectionnee : masquer/desactiver le filtre quartier
- Quand quartier selectionne : masquer/desactiver le filtre station

### 7b. Browse page filters

**Fichier** : `src/components/cafes/cafe-filters.tsx` (ou equivalent)

- Meme integration que pour la map

### 7c. Roulette page

- Meme filtre disponible sur la roulette (partage useMapFilters)

## Etape 8 : Marker station + cercle sur la map

**Fichier** : `src/components/map/cafe-map.tsx` (ou composant map principal)

- Quand une station est selectionnee :
  - Afficher un marker distinct (icone metro, couleur de la ligne)
  - Dessiner un cercle du rayon correspondant autour de la station
  - Centrer/zoomer la map sur la station
- Utiliser l'API Kakao Maps pour le cercle (`kakao.maps.Circle`)

## Etape 9 : Traductions

**Fichier** : `src/lib/translations.ts`

Ajouter les cles pour les 5 langues :
- `metroStation`, `selectStation`, `walkingTime`, `minuteWalk`, `nearStation`, `clearStation`

---

## Verification

1. **Schema** : Appliquer les migrations, verifier que les tables existent avec `list_tables`
2. **Seed** : Verifier le nombre de stations inserees via `execute_sql SELECT COUNT(*)`
3. **API** : Tester `GET /api/stations` et `GET /api/stations?q=hongdae`
4. **Map** : Selectionner une station -> verifier marker + cercle + cafes filtres
5. **Browse** : Selectionner une station -> verifier liste filtree avec distances
6. **Exclusivite** : Selectionner station -> verifier quartier desactive, et inversement
7. **Rayon** : Changer 5/10/15 min -> verifier que le nombre de cafes change
8. **i18n** : Switcher de langue -> verifier noms de stations traduits
9. **Build** : `npm run build` sans erreurs
