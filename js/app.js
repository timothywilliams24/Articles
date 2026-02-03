// app.js - The Main Logic & Framework7 Initialization

// 1. Initialize Framework7
const app = new Framework7({
  el: '#app', // App root element
  name: 'Offline Reader',
  theme: 'auto', // Automatic theme detection (iOS or Android look)
});

// Create the main view
const mainView = app.views.create('.view-main');

// Shortcut for Dom7 (F7's built-in jQuery-like library)
const $$ = Dom7;

// 2. Load and Display Articles on Startup
async function refreshArticleList() {
  try {
    const articles = await getAllArticles(); // Function from db.js
    const listContainer = $$('#article-list ul');
    listContainer.empty(); // Clear current list

    if (articles.length === 0) {
      listContainer.append('<li class="item-content"><div class="item-inner">No articles saved yet.</div></li>');
      return;
    }

    // Loop through articles and create the UI items
    articles.forEach(article => {
      const itemHtml = `
        <li>
          <a href="#" class="item-link item-content open-article" data-url="${article.url}">
            <div class="item-inner">
              <div class="item-title-row">
                <div class="item-title">${article.title}</div>
              </div>
              <div class="item-subtitle">${article.byline || 'Unknown Author'}</div>
            </div>
          </a>
        </li>
      `;
      listContainer.append(itemHtml);
    });
  } catch (err) {
    app.dialog.alert("Could not load articles from database.");
  }
}

// 3. Handle the "Save" Button Click
$$('#save-btn').on('click', async () => {
  const urlInput = $$('#article-url-input').val();
  
  if (!urlInput || !urlInput.includes('medium.com')) {
    app.dialog.alert('Please enter a valid Medium URL');
    return;
  }

  // Show a loading indicator
  app.preloader.show();

  try {
    // processAndSaveArticle is from processor.js
    await processAndSaveArticle(urlInput);
    
    // Close popup and clear input
    app.popup.close('#add-popup');
    $$('#article-url-input').val('');
    
    // Refresh the list to show the new article
    await refreshArticleList();
    
    app.toast.create({ text: 'Saved for offline!', closeTimeout: 2000 }).open();
  } catch (error) {
    app.dialog.alert('Failed to save article. Check your connection or the URL.');
  } finally {
    app.preloader.hide();
  }
});

// 4. Handle Opening an Article
$$(document).on('click', '.open-article', async function() {
  const url = $$(this).attr('data-url');
  const articles = await getAllArticles();
  const article = articles.find(a => a.url === url);

  if (article) {
    // For now, we use a simple F7 sheet or page to show content
    // In a full app, you'd route to a separate 'reader' page
    const readerHtml = `
      <div class="page">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner">
            <div class="left"><a href="#" class="link back">Back</a></div>
            <div class="title">${article.title}</div>
          </div>
        </div>
        <div class="page-content">
          <div class="block article-content">
            ${article.content}
          </div>
        </div>
      </div>
    `;
    mainView.router.navigate({
      name: 'reader',
      content: readerHtml
    });
  }
});

// 5. Run initial list load
refreshArticleList();

// 6. Register the Service Worker (The PWA Magic)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('Service Worker Registered');
    });
  });
}