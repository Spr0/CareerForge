export async function handler() {
  if (!process.env.APIFY_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "no token" }) };
  }

  const res = await fetch(
    `https://api.apify.com/v2/acts/memo23~apify-hiring-cafe-scraper/runs?token=${process.env.APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [
          'https://hiring.cafe/?searchState={"query":"VP Technology transformation","dateFetchedPastNDays":2}'
        ],
        maxItems: 50
      })
    }
  );

  const data = await res.json();
  const runId = data?.data?.id;
  const datasetId = data?.data?.defaultDatasetId;

  return {
    statusCode: 200,
    body: JSON.stringify({ runId, datasetId })
  };
}
