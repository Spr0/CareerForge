export async function handler() {
  if (!process.env.APIFY_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "APIFY_TOKEN is not set" }),
    };
  }

  const apifyUrl =
    `https://api.apify.com/v2/acts/memo23~apify-hiring-cafe-scraper/run-sync-get-dataset-items` +
    `?token=${process.env.APIFY_TOKEN}&timeout=15`;

  const res = await fetch(apifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrls: [
        'https://hiring.cafe/?searchState={"query":"project manager","dateFetchedPastNDays":1}'
      ],
      maxItems: 10,
    }),
  });

  const text = await res.text();

  return {
    statusCode: res.status,
    body: text,
  };
}
