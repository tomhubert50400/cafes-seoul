const GRAPHQL_URL = 'https://pcmap-api.place.naver.com/place/graphql';
const HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://pcmap.place.naver.com',
};
const KO_DAY_MAP = { '월': 'mon', '화': 'tue', '수': 'wed', '목': 'thu', '금': 'fri', '토': 'sat', '일': 'sun' };

async function fetchHours(cafeName) {
  const searchRes = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { ...HEADERS, 'Referer': 'https://pcmap.place.naver.com/restaurant/list' },
    body: JSON.stringify({ query: `{ places(input: {query: ${JSON.stringify(cafeName)}}) { items { id name } } }` }),
  });
  const searchData = await searchRes.json();
  const item = searchData?.data?.places?.items?.[0];
  if (!item) { console.log(cafeName, '-> NOT FOUND'); return; }

  const detailRes = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { ...HEADERS, 'Referer': `https://pcmap.place.naver.com/restaurant/${item.id}/home` },
    body: JSON.stringify({ query: `query { placeDetail(input: {deviceType: "pc", id: ${JSON.stringify(item.id)}, isNx: false}) { newBusinessHours { businessHours { day businessHours { start end } } } } }` }),
  });
  const detailData = await detailRes.json();
  const entries = detailData?.data?.placeDetail?.newBusinessHours?.[0]?.businessHours || [];

  const hours = {};
  for (const e of entries) {
    const dk = KO_DAY_MAP[e.day?.charAt(0)];
    if (dk && e.businessHours) hours[dk] = `${e.businessHours.start}-${e.businessHours.end}`;
    else if (dk) hours[dk] = 'CLOSED';
  }
  console.log(`${cafeName} -> ${item.name} (${item.id})`);
  console.log(`  Hours:`, JSON.stringify(hours));
}

async function main() {
  await fetchHours('버터앤쉘터 연남점');
  await fetchHours('랜디스도넛 연남점');
  await fetchHours('블루보틀 삼청');
}
main().catch(console.error);
