# Seoul Metro Station Data - Sources & Links

## Primary Data Source Used

**GitHub: open-seoul-subway by chanyou**
- Repository: https://github.com/chanyou/open-seoul-subway
- Direct CSV URL: https://raw.githubusercontent.com/chanyou/open-seoul-subway/master/station_code.csv
- Coverage: Seoul Lines 1-9, Airport Railroad, Bundang, Gyeongbu, Incheon, and more
- Total stations: 728
- Format: CSV with station codes, Korean names, latitude, longitude

## Additional Data Sources Referenced

### 1. Seoul Subway Address and Coordinates (GitHub Gist)
- URL: https://gist.github.com/yoon-gu/902efb6d5bd345e3837e035a3c0642b8
- Author: yoon-gu
- Method: Seoul Open Data + Naver API geocoding
- Format: Multiple CSV files (station_latlen.csv, subway_stations_1_4.csv, etc.)
- Coverage: Lines 1-8 with addresses

### 2. Kaggle Dataset
- URL: https://www.kaggle.com/datasets/ninetyninenewton/seoul-subway-coordinates
- Title: Seoul Subway Geospatial Data
- Coverage: Coordinates of Seoul subway stations and lines
- Format: Various geospatial formats

### 3. Korean Public Data Portal (공공데이터포털)
- Lines 1-8 Coordinates: https://www.data.go.kr/data/15099316/fileData.do
- Provider: Seoul Metro Corporation (서울교통공사)
- Format: CSV, Excel, Open API (JSON/XML)
- Stations: 276 stations (Lines 1-8 only)
- Precision: 6 decimal places
- Update: Annual

### 4. Seoul Open Data Portal (서울 열린데이터광장)
- Main portal: https://data.seoul.go.kr
- Station coordinate data: https://data.seoul.go.kr/dataList/OA-15442/S/1/datasetView.do
- Real-time arrival info: https://data.seoul.go.kr/dataList/OA-12764/F/1/datasetView.do

### 5. Seoul TOPIS (Transportation Operating & Information Service)
- URL: https://topis.seoul.go.kr/openEngSubway.do
- English version with station information
- Real-time transit data

### 6. Observable Notebook
- URL: https://observablehq.com/@taekie/seoul_subway_station_coordinate
- Visualization of Seoul subway station coordinates
- Downloadable CSV/JSON formats

## Official Seoul Metro Resources

### Seoul Metro Official Website
- English: http://www.seoulmetro.co.kr/en/
- Cyber Station: http://www.seoulmetro.co.kr/en/cyberStation.do
- Route search and station information

### Seoul Metropolitan Government
- English: https://english.seoul.go.kr
- Metro map PDF: https://english.seoul.go.kr/wp-content/uploads/2014/02/eng_metrolines.pdf
- Open data: https://english.seoul.go.kr/policy/smart-city/spatial-data/

## Data Characteristics

### Coordinate System
- Format: WGS84 (latitude, longitude)
- Precision: 6-7 decimal places (~0.1-1 meter accuracy)

### Coverage Area
- **Latitude range**: 36.78°N to 37.95°N
- **Longitude range**: 126.43°E to 127.63°E
- **Cities included**: Seoul, Incheon, Suwon, Seongnam, Goyang, Ansan, Bucheon, Yongin, Gimpo, Paju, etc.

### Lines Included
- Seoul Metro Lines: 1, 2, 3, 4, 5, 6, 7, 8, 9
- Bundang Line (분당선) + branches
- Shinbundang Line (신분당선)
- Airport Railroad Express / AREX (공항철도)
- Gyeongbu Line (경부선)
- Gyeongchun Line (경춘선)
- Gyeongui-Jungang Line (경의중앙선)
- Incheon Metro (인천교통공사)
- Everline / Yongin Light Rail (에버라인)
- Suin Line (수인선)

## Data Quality Notes

### Strengths
- Comprehensive coverage of Seoul metropolitan area
- High coordinate precision (6-7 decimal places)
- Multiple sources for cross-validation
- Open data from government sources
- Community-maintained and updated

### Limitations
- Some newer lines may have partial coverage (Sillim Line, UI Sinseol)
- Gyeongui-Jungang Line appears incomplete in current dataset
- English romanizations vary between sources (manual standardization required)
- Station codes differ between operators (Seoul Metro, Korail, etc.)
- Transfer stations may appear multiple times (once per line)

## Romanization Sources

Since the raw data only includes Korean names, English romanizations were created using:

1. **Official Seoul Metro English signage**
2. **Revised Romanization of Korean (국어의 로마자 표기법)** - Korean government standard
3. **Common international usage** - Names familiar to tourists
4. **Manual verification** - For universities, landmarks, special cases

## Update Frequency

- Seoul Metro official data: Annual updates
- Community datasets: Irregular (as contributors update)
- Our dataset: Generated February 12, 2026

## License & Usage Rights

- **Official government data**: Public domain (공공데이터)
- **Community datasets**: Various open source licenses (MIT, CC0, etc.)
- **This compilation**: Free to use for your project

## Related APIs

### Seoul Metro Real-time API
- Provider: Seoul Open Data Plaza
- Documentation: https://data.seoul.go.kr (Korean)
- Features: Real-time train arrival, station info, transfer routes

### Naver Maps API
- Geocoding and reverse geocoding
- Transit routing
- Requires API key

### Kakao Maps API
- Alternative to Naver
- Transit information
- Requires API key

## GitHub Repositories with Related Data

- **southkorea/seoul-maps**: https://github.com/southkorea/seoul-maps
  - Seoul administrative divisions (GeoJSON, Shapefile, TopoJSON)

- **MountainNine/seoul-metro-map**: https://github.com/MountainNine/seoul-metro-map
  - Station coordinate CSV

- **SeoulTech/open-data-seoul**: https://github.com/SeoulTech/open-data-seoul
  - Aggregation of South Korea open data sources

## How This Dataset Was Created

1. Downloaded raw CSV from open-seoul-subway repository (728 stations)
2. Created comprehensive romanization dictionary with 300+ station names
3. Implemented line detection algorithm based on station codes
4. Generated enriched CSV with Korean + English names + line info
5. Created SQL migration file for Supabase/PostgreSQL
6. Validated against multiple sources

## Next Steps for Your Project

1. **Apply the migration**: `supabase db reset` or run the SQL file directly
2. **Verify in Supabase**: Check that 729 stations were inserted
3. **Test spatial queries**: Query stations near a cafe location
4. **Add to UI**: Display nearest metro stations on cafe detail pages
5. **Consider caching**: Metro stations don't change often, can be cached in frontend

## Questions or Issues?

If you need:
- More complete Gyeongui-Jungang Line data
- Sillim Line stations
- UI Sinseol Line explicit codes
- Updated station information

Check the official sources above or re-run the Python script with updated source data.

---

**Compiled by**: Claude Code (Sonnet 4.5)
**Date**: February 12, 2026
**Purpose**: Seoul Cafes Project - Metro station proximity feature
