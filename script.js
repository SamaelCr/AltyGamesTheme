var posts_per_page = 9;
var featured_label = "Destacado";

/* MOTOR IMÁGENES HQ */
function getSmartThumb(entry) {
  var thumb = "";
  try {
    if (entry.media$thumbnail) { 
      thumb = entry.media$thumbnail.url; 
    } else {
      var content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : "");
      var match = content.match(/<img[^>]+src="([^">]+)"/);
      thumb = match ? match[1] : "https://via.placeholder.com/400x250?text=No+Image";
    }
    if (thumb.indexOf("googleusercontent.com") != -1 || thumb.indexOf("bp.blogspot.com") != -1) {
      thumb = thumb.replace(/\/s[0-9]+.*?\//, "/s1600/").replace(/=s[0-9]+.*/, "=s1600");
    }
  } catch (e) { thumb = "https://via.placeholder.com/400x250?text=Error+Thumbnail"; }
  return thumb;
}

function getLabels(entry) {
  var html = '<div class="post-labels">';
  try {
    if (entry.category) {
      entry.category.forEach(function(cat) {
        if (cat.term !== featured_label) {
          html += '<span class="post-tag">' + cat.term + '</span>';
        }
      });
    }
  } catch (e) { console.warn("Error en labels"); }
  html += '</div>';
  return html;
}

/* HELPER JSONP GLOBAL */
function getJSONP(url, callback) {
  var callbackName = 'cb_' + Math.random().toString(36).substring(7);
  window[callbackName] = function(data) {
    callback(data);
    delete window[callbackName];
    var s = document.getElementById(callbackName);
    if (s) s.remove();
  };
  var script = document.createElement('script');
  script.id = callbackName;
  var sep = url.indexOf('?') >= 0 ? '&' : '?';
  script.src = url + sep + 'alt=json-in-script&callback=' + callbackName;
  document.body.appendChild(script);
}

function loadFeatured(json) {
  var html = "";
  if (!json.feed || !json.feed.entry) return;
  json.feed.entry.forEach(function(entry) {
    var title = entry.title.$t;
    var url = "#";
    try {
      entry.link.forEach(function(l) { if (l.rel == 'alternate') url = l.href; });
    } catch (e) {}
    var thumb = getSmartThumb(entry);
    var labels = getLabels(entry);
    html += '<div class="post-card"><div class="post-thumb-wrap"><a href="'+url+'"><img class="post-thumb" src="'+thumb+'" style="height:210px"/></a></div><h2><a href="'+url+'">'+title+'</a></h2>'+labels+'</div>';
  });
  var grid = document.getElementById("featured-ajax-grid");
  if (grid) grid.innerHTML = html;
}

function loadMainGrid(json, currentPage, totalFeatured) {
  if (!json.feed) return;
  var entries = json.feed.entry || [];
  var totalAll = json.feed.openSearch$totalResults ? parseInt(json.feed.openSearch$totalResults.$t) : 0;
  var totalMain = totalAll - (totalFeatured || 0);
  var html = "";
  
  var filteredEntries = entries.filter(function(e) {
    return !(e.category || []).some(function(l) { return l.term === featured_label; });
  }).slice(0, posts_per_page);

  var mainGrid = document.getElementById("main-ajax-grid");
  if (!mainGrid) return;

  if (filteredEntries.length === 0) {
    mainGrid.innerHTML = "<div style='grid-column:1/-1; text-align:center; padding:20px; color:var(--brand-color);'>No hay más juegos.</div>";
    return;
  }

  filteredEntries.forEach(function(entry) {
    var title = entry.title.$t;
    var postUrl = "#";
    try { entry.link.forEach(function(l) { if (l.rel == 'alternate') postUrl = l.href; }); } catch (e) {}
    var thumb = getSmartThumb(entry);
    var labels = getLabels(entry);
    html += '<div class="post-card"><div class="post-thumb-wrap"><a href="'+postUrl+'"><img class="post-thumb" src="'+thumb+'"/></a></div><h2><a href="'+postUrl+'">'+title+'</a></h2>'+labels+'</div>';
  });
  mainGrid.innerHTML = html;
  
  var totalPages = Math.ceil(totalMain / posts_per_page);
  if (totalPages > 1) {
    var phtml = "";
    var base_url = window.location.href.split("?")[0] + "?max-results=" + posts_per_page;
    if (currentPage > 1) phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage-1)+"'>&lt;</a>";
    for (var j = Math.max(1, currentPage - 2); j <= Math.min(totalPages, currentPage + 2); j++) {
      if (j == currentPage) phtml += "<span class='showpagePoint'>"+j+"</span>";
      else phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+j+"'>"+j+"</a>";
    }
    if (currentPage < totalPages) phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage+1)+"'>&gt;</a>";
    var pager = document.getElementById("blog-pager");
    if (pager) pager.innerHTML = phtml;
  }
}

document.addEventListener("DOMContentLoaded", function() {
  /* 1. SISTEMA DE MENÚ */
  var currentParent = null;
  var currentUl = null;
  var menuItems = document.querySelectorAll('.dark_menu > li');
  menuItems.forEach(function(li) {
    var link = li.querySelector('a');
    if (link) {
      var text = link.textContent.trim();
      if (text.startsWith('_')) {
        if (currentParent) {
          if (!currentUl) {
            currentUl = document.createElement('ul');
            currentParent.appendChild(currentUl);
            currentParent.classList.add('has-children');
          }
          link.textContent = text.substring(1).trim();
          currentUl.appendChild(li);
        }
      } else {
        currentParent = li;
        currentUl = null;
      }
    }
  });

  document.querySelectorAll('.dark_menu').forEach(function(m) { m.classList.add('menu-ready'); m.style.opacity = "1"; });

  /* 2. MODO CLARO / OSCURO */
  var themeBtn = document.getElementById('theme-toggle');
  var htmlEl = document.documentElement;
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      var icon = themeBtn.querySelector('i');
      if (htmlEl.classList.contains('light-theme')) {
        htmlEl.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        if (icon) icon.className = 'fa-solid fa-sun';
      } else {
        htmlEl.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        if (icon) icon.className = 'fa-solid fa-moon';
      }
    });
  }

  /* 3. PANEL LATERAL */
  var menuData = document.querySelector('.menujohanes .dark_menu');
  var drawer = document.getElementById('drawer-content');
  if (menuData && drawer) {
    drawer.innerHTML = '<ul class="dark_menu">' + menuData.innerHTML + '</ul>';
    drawer.querySelectorAll('.dark_menu').forEach(function(m) { m.style.opacity = "1"; });
  }

  var btnToggle = document.getElementById('menu-toggle');
  if (btnToggle) btnToggle.onclick = function() { document.body.classList.add('drawer-open'); };
  
  ['drawer-close', 'drawer-overlay'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.onclick = function() { document.body.classList.remove('drawer-open'); };
  });

  /* 4. CARGA AJAX HOME */
  var mainGrid = document.getElementById('main-ajax-grid');
  if (mainGrid && !document.body.classList.contains('is-search-page') && !document.body.classList.contains('is-category-page')) {
    var params = new URLSearchParams(window.location.search);
    var page = parseInt(params.get('PageNo')) || 1;
    var start = ((page - 1) * posts_per_page) + 1;
    mainGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Cargando contenido...</div>';
    getJSONP("/feeds/posts/summary/-/Destacado?max-results=0", function(data) {
      var totalF = (data.feed && data.feed.openSearch$totalResults) ? parseInt(data.feed.openSearch$totalResults.$t) : 0;
      getJSONP("/feeds/posts/summary/-/Destacado?max-results=2", loadFeatured);
      getJSONP("/feeds/posts/summary?start-index="+start+"&max-results="+(posts_per_page + totalF), function(json) {
        loadMainGrid(json, page, totalF);
      });
    });
  }

  /* 5. INYECCIÓN DINÁMICA CON CACHE BUSTER */
  var cb = new Date().getTime();
  if (window.location.href.indexOf('/p/search.html') > -1) {
      document.body.classList.add('is-search-page');
      var s_css = document.createElement('link'); s_css.rel = 'stylesheet';
      s_css.href = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.css?v=' + cb;
      document.head.appendChild(s_css);
      var s_js = document.createElement('script');
      s_js.src = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.js?v=' + cb;
      document.head.appendChild(s_js);
  }

  if (window.location.href.indexOf('/p/categories.html') > -1) {
      document.body.classList.add('is-category-page');
      var c_css = document.createElement('link'); c_css.rel = 'stylesheet';
      c_css.href = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/categories/categories.css?v=' + cb;
      document.head.appendChild(c_css);
      var c_js = document.createElement('script');
      c_js.src = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/categories/categories.js?v=' + cb;
      document.head.appendChild(c_js);
  }
});