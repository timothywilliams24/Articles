// processor.js - The "Brain" of Article Processing
// This file handles fetching from your worker and cleaning the text.

const CLOUDFLARE_WORKER_URL = 'https://articles.timothywilliams-2410.workers.dev/'; // Replace with your actual URL

/**
 * 1. Fetch and Parse
 * This is the main function your UI will call.
 */
async function processAndSaveArticle(mediumUrl) {
  try {
    // A. Fetch the unpaywalled HTML via our Cloudflare Worker
    // We encode the URL to ensure symbols like '?' or '&' don't break the request
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/?url=${encodeURIComponent(mediumUrl)}`);
    
    if (!response.ok) throw new Error("Failed to fetch from worker");

    const rawHtml = await response.text();

    // B. Turn the raw string of HTML into a real Document object
    // Browsers have a built-in 'DOMParser' for this.
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    // C. Use Mozilla Readability to find the "Meat" of the article
    // We pass the document to the library, and it returns a clean object.
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      throw new Error("Readability could not find an article on this page.");
    }

    // D. Save the cleaned results to our IndexedDB (db.js)
    // We only save what we need: Title, Content, and the original URL.
    await saveArticleToDB({
      url: mediumUrl,
      title: article.title,
      content: article.content, // This is now CLEAN HTML (no ads!)
      byline: article.byline    // Author name
    });

    console.log("Success! Article is now offline.");
    return article;

  } catch (error) {
    console.error("Processing Error:", error);
    throw error;
  }
}