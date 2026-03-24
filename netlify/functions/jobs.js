export async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      hasToken: !!process.env.APIFY_TOKEN,
      tokenPrefix: process.env.APIFY_TOKEN
        ? process.env.APIFY_TOKEN.slice(0, 6)
        : null,
    }),
  };
}
