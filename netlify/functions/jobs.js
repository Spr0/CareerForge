export async function handler() {
  try {
    if (!process.env.APIFY_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "APIFY_TOKEN is not set" }),
      };
    }

    const apifyUrl =
      `https://api.apify.com/v2/acts/memo23~apify-hiring-cafe-scraper/run-sync-get-dataset-items` +
      `?token=${process.env.APIFY_TOKEN}`;

    const res = await fetch(apifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [
          'https://hiring.cafe/?searchState={"query":"technical project manager","dateFetchedPastNDays":1}'
        ],
        maxItems: 25,
      }),
    });

    const text = await res.text();

    return {
      statusCode: res.status,
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Function crashed",
        message: err.message,
        stack: err.stack,
      }),
    };
  }
}
