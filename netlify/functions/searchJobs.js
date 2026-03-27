export async function handler(event) {
  if (!process.env.APIFY_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "APIFY_TOKEN not configured" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { body = {}; }

  const keyword = body.keyword || "transformation director";
  const maxItems = body.maxItems || 30;

  // Build Indeed search URL — remote jobs in the US
  const indeedUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=Remote&sc=0kf%3Aattr(DSQF7)%3B&sort=date&fromage=14`;

  const res = await fetch(
    `https://api.apify.com/v2/acts/memo23~apify-indeed-cheerio-ppr/runs?token=${process.env.APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url: indeedUrl }],
        maxItems,
        includeCompanyDetails: false,
        onlyExternalJobs: false,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"]
        }
      })
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return {
      statusCode: res.status,
      body: JSON.stringify({ error: data?.error?.message || "Apify error" })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      runId: data?.data?.id,
      datasetId: data?.data?.defaultDatasetId
    })
  };
}
