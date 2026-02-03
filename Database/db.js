// db.js - The "Storage" Manager
// This file handles opening the database and saving/retrieving articles.

/**
 * 1. Open the Database
 * We name it 'ReaderDB' and start with version 1.
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    // The native way to open IndexedDB
    const request = indexedDB.open("ReaderDB", 1);

    // This runs the VERY FIRST time you open the app (or when you upgrade the version)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 2. Create an "Object Store" (Like a table) called 'articles'
      // We use 'url' as the key because every article has a unique link.
      if (!db.objectStoreNames.contains("articles")) {
        const store = db.createObjectStore("articles", { keyPath: "url" });
        
        // We add an index for 'date' so we can sort articles by newest first
        store.createIndex("date", "timestamp");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Error opening DB");
  });
}

/**
 * 3. Save an Article
 * This puts the clean HTML and metadata into storage.
 */
async function saveArticleToDB(articleData) {
  const db = await openDatabase();
  
  // 'readwrite' permission is needed to save data
  const transaction = db.transaction("articles", "readwrite");
  const store = transaction.objectStore("articles");
  
  // .put() will update the article if it already exists, or add it if new
  await store.put({
    url: articleData.url,
    title: articleData.title,
    content: articleData.content, // The unpaywalled HTML from your worker
    timestamp: Date.now()
  });
  
  return transaction.complete;
}

/**
 * 4. Get All Articles
 * This is used to build your list in the UI.
 */
async function getAllArticles() {
  const db = await openDatabase();
  const transaction = db.transaction("articles", "readonly");
  const store = transaction.objectStore("articles");
  
  // Retrieves everything in the store
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}