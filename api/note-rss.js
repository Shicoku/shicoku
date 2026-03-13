import { parseStringPromise } from "xml2js";

export default async function handler(req, res) {
  const RSS_URL = "https://note.com/shicoku/rss";

  try {
    const rssRes = await fetch(RSS_URL);
    const xml = await rssRes.text();
    const data = await parseStringPromise(xml);

    const items = data.rss.channel[0].item.slice(0, 4);

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch RSS" });
  }
}
