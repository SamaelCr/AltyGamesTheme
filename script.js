var posts_per_page = 9;
var featured_label = "Destacado";

/* MOTOR IMÁGENES HQ */
function getSmartThumb(entry) {
  var thumb = "";
  try {
    if (entry.media$thumbnail) { thumb = entry.media$thumbnail.url; } 
    else {
      var content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : "");
      var match = content.match(/<img[^>]+src="([^">]+)"/);
      thumb = match ? match[1] : "https://via.placeholder.com/400x250?text=No+Image";
    }
    if (thumb.indexOf("googleusercontent.com") != -1 || thumb.indexOf("bp.blogspot.com") != -1) {
      thumb = thumb.replace(/\/s[0-9]+.*?\//, "/s1600/").replace(/=s[0-9]+.*/, "=s1600");
    }
  } catch (e) {
    thumb = "https://via.placeholder.com/400x250?text=Error+Thumbnail";
  }
  return thumb;
}

function getLabels(entry) {
  var html = '<div class="post-labels">';
  try {
    if (entry.category) {
      for (var i = 0; i < entry.category.length; i++) {
        if (entry.category[i].term !== featured_label) {
          html += '<span class="post-tag">' + entry.category[i].term + '</span>';
        }
      }
    }
  } catch (e) { console.warn("Error en labels"); }
  html += '</div>';
  return html;
}

/* HELPER PARA JSONP (Reemplaza $.ajax para Blogger Feeds) */
function getJSONP(url, callback) {
  var name = 'jsonp_' + Math.round(100000 * Math.random());
  window[name] = function(data) {
    callback(data);
    document.getElementById(name).remove();
    delete window[name];
  };
  var script = document.createElement('script');
  script.id = name;
  script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + name;
  document.body.appendChild(script);
}

function loadFeatured(json) {
  var html = "";
  if(!json.feed.entry) return;
  for (var i = 0; i < json.feed.entry.length; i++) {
    var entry = json.feed.entry[i];
    var title = entry.title.$t;
    var url = "#";
    try {
        for (var k = 0; k < entry.link.length; k++) {
          if (entry.link[k].rel == 'alternate') { url = entry.link[k].href; break; }
        }
    } catch(e) { url = "#"; }
    var thumb = getSmartThumb(entry);
    var labels = getLabels(entry);
    html += '<div class="post-card"><div class="post-thumb-wrap"><a href="'+url+'"><img class="post-thumb" src="'+thumb+'" style="height:210px"/></a></div><h2><a href="'+url+'">'+title+'</a></h2>'+labels+'</div>';
  }
  var grid = document.getElementById("featured-ajax-grid");
  if(grid) grid.innerHTML = html;
}

/* FIX: Ahora recibe la página actual, construye el DOM directamente y maneja resultados vacíos */
function loadMainGrid(json, currentPage, totalFeatured) {
  var entries = json.feed.entry ||[];
  var totalAll = json.feed.openSearch$totalResults ? parseInt(json.feed.openSearch$totalResults.$t) : 0;
  
  currentPage = currentPage || 1;
  totalFeatured = totalFeatured || 0;
  var totalMain = totalAll - totalFeatured;
  var html = "";
  
  var filteredEntries = entries.filter(function(e) {
    return !(e.category || []).some(function(l) { return l.term === featured_label; });
  });
  var pageEntries = filteredEntries.slice(0, posts_per_page);

  var mainGrid = document.getElementById("main-ajax-grid");
  if (!mainGrid) return;

  if (pageEntries.length === 0) {
      mainGrid.innerHTML = "<div style='grid-column:1/-1; text-align:center; padding:20px; color:var(--brand-color); font-weight:bold;'>No hay más juegos para mostrar en esta página.</div>";
      var pager = document.getElementById("blog-pager");
      if(pager) pager.innerHTML = "";
      return;
  }

  for (var i = 0; i < pageEntries.length; i++) {
    var entry = pageEntries[i];
    var title = entry.title.$t;
    var postUrl = "#";
    try {
        for (var k = 0; k < entry.link.length; k++) {
          if (entry.link[k].rel == 'alternate') { postUrl = entry.link[k].href; break; }
        }
    } catch(e) { postUrl = "#"; }
    var thumb = getSmartThumb(entry);
    var labels = getLabels(entry);
    html += '<div class="post-card"><div class="post-thumb-wrap"><a href="'+postUrl+'"><img class="post-thumb" src="'+thumb+'"/></a></div><h2><a href="'+postUrl+'">'+title+'</a></h2>'+labels+'</div>';
  }
  mainGrid.innerHTML = html;
  
  var totalPages = Math.ceil(totalMain / posts_per_page);
  var phtml = "";
  var base_url = window.location.href.split("?")[0] + "?max-results=" + posts_per_page;
  
  if (totalPages > 1) {
      if (currentPage > 1) phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage-1)+"'>&lt;</a>";
      var startPage = Math.max(1, currentPage - 2);
      var endPage = Math.min(totalPages, currentPage + 2);
      if (startPage > 1) {
          phtml += "<a class='showpageNum' href='"+base_url+"&PageNo=1'>1</a>";
          if (startPage > 2) phtml += "<span class='showpagePoint' style='background:transparent;border:0;box-shadow:none'>...</span>";
      }
      for (var j = startPage; j <= endPage; j++) {
        if (j == currentPage) phtml += "<span class='showpagePoint'>"+j+"</span>";
        else phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+j+"'>"+j+"</a>";
      }
      if (endPage < totalPages) {
          if (endPage < totalPages - 1) phtml += "<span class='showpagePoint' style='background:transparent;border:0;box-shadow:none'>...</span>";
          phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+totalPages+"'>"+totalPages+"</a>";
      }
      if (currentPage < totalPages) {
          phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage+1)+"'>&gt;</a>";
      }
      var pagerContainer = document.getElementById("blog-pager");
      if(pagerContainer) pagerContainer.innerHTML = phtml;
  } else {
      var pagerContainerAlt = document.getElementById("blog-pager");
      if(pagerContainerAlt) pagerContainerAlt.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", function() {
  /* 1. LÓGICA DE SUBMENÚS (SISTEMA DE MAPEO PREVIO V3) - CORREGIDA */
  var currentParent = null;
  var currentUl = null;

  var menuItems = document.querySelectorAll('.dark_menu > li');
  menuItems.forEach(function(el) {
    var link = el.querySelector('a');
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
          currentUl.appendChild(el);
        }
      } else {
        currentParent = el;
        currentUl = null; 
      }
    }
  });

  var darkMenu = document.querySelector('.dark_menu');
  if(darkMenu) darkMenu.classList.add('menu-ready');

  /* 2. TOGGLE TEMA */
  var themeBtn = document.getElementById('theme-toggle');
  var htmlEl = document.documentElement;
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      var icon = themeBtn.querySelector('i');
      if (htmlEl.classList.contains('light-theme')) {
        htmlEl.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        if(icon) icon.className = 'fa-solid fa-sun';
      } else {
        htmlEl.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        if(icon) icon.className = 'fa-solid fa-moon';
      }
      if (typeof DISQUS !== 'undefined') {
          setTimeout(function() { DISQUS.reset({ reload: true }); }, 200); 
      }
    });
  }

  /* 3. PANEL LATERAL (SIDE DRAWER) */
  var sourceMenu = document.querySelector('.menujohanes .dark_menu');
  var drawerContent = document.getElementById('drawer-content');
  if (sourceMenu && drawerContent) {
    drawerContent.innerHTML = '<ul class="dark_menu">' + sourceMenu.innerHTML + '</ul>';
  }

  var menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() { document.body.classList.add('drawer-open'); });
  }

  var closeTargets = ['drawer-close', 'drawer-overlay'];
  closeTargets.forEach(function(id) {
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function() { document.body.classList.remove('drawer-open'); });
  });

  // Delegación de eventos para submenús del drawer
  document.addEventListener('click', function(e) {
    var target = e.target.closest('#side-drawer .has-children > a');
    if (target) {
      e.preventDefault();
      target.parentElement.classList.toggle('active');
    }
  });

  /* 4. REUBICACIÓN TÍTULO DE BLOGGER AUTOMÁTICAMENTE */
  if((document.body.classList.contains('item-view') || window.location.href.indexOf('.html') > -1) && window.location.href.indexOf('search.html') === -1 && window.location.href.indexOf('categories.html') === -1) {
    var pageTitleText = document.title.split(' - ')[0]; 
    var postTitleHTML = '<h2 class="section-title" style="text-align:center; border:0; margin-top:20px; color:var(--brand-color)!important;">' + pageTitleText + '</h2>';
    var firstImg = document.querySelector('.post-body-container img');
    if(firstImg) {
        var firstAnchor = firstImg.closest('a');
        if(firstAnchor) { 
          firstAnchor.insertAdjacentHTML('afterend', postTitleHTML); 
        } else { 
          firstImg.insertAdjacentHTML('afterend', postTitleHTML); 
        }
    }
  }

  /* 5. INYECCIÓN ABSOLUTA PARA PÁGINA DE BÚSQUEDA */
  if (window.location.href.indexOf('/p/search.html') > -1) {
      document.body.classList.add('is-search-page');
      var cacheBuster = new Date().getTime();
      var linkSearch = document.createElement('link');
      linkSearch.rel = 'stylesheet';
      linkSearch.href = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.css?v=' + cacheBuster;
      document.head.appendChild(linkSearch);
      
      var scriptSearch = document.createElement('script');
      scriptSearch.src = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.js?v=' + cacheBuster;
      document.head.appendChild(scriptSearch);
  }

  /* 6. INYECCIÓN ABSOLUTA PARA PÁGINA DE CATEGORÍAS */
  if (window.location.href.indexOf('/p/categories.html') > -1) {
      document.body.classList.add('is-category-page');
      var cbCat = new Date().getTime();
      
      var linkCat1 = document.createElement('link');
      linkCat1.rel = 'stylesheet';
      linkCat1.href = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.css?v=' + cbCat;
      document.head.appendChild(linkCat1);

      var linkCat2 = document.createElement('link');
      linkCat2.rel = 'stylesheet';
      linkCat2.href = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/categories/categories.css?v=' + cbCat;
      document.head.appendChild(linkCat2);

      var scriptCat = document.createElement('script');
      scriptCat.src = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/categories/categories.js?v=' + cbCat;
      document.head.appendChild(scriptCat);
  }

  /* 7. NUEVO SISTEMA DE CARGA AJAX */
  var mainGridContainer = document.getElementById('main-ajax-grid');
  if (mainGridContainer && !document.body.classList.contains('is-category-page') && !document.body.classList.contains('is-search-page')) {
      var urlParams = new URLSearchParams(window.location.search);
      var currentPage = parseInt(urlParams.get('PageNo')) || 1;
      var startIndex = ((currentPage - 1) * posts_per_page) + 1;
      
      getJSONP("/feeds/posts/summary/-/Destacado?alt=json-in-script&max-results=0", function(dataFeatured) {
          var totalFeatured = (dataFeatured.feed && dataFeatured.feed.openSearch$totalResults) ? parseInt(dataFeatured.feed.openSearch$totalResults.$t) : 0;
          
          getJSONP("/feeds/posts/summary/-/Destacado?alt=json-in-script&max-results=2", function(jsonFeatured) { 
            loadFeatured(jsonFeatured); 
          });

          mainGridContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--brand-color);">Cargando juegos...</div>';
          
          getJSONP("/feeds/posts/summary?alt=json-in-script&start-index=" + startIndex + "&max-results=" + (posts_per_page + totalFeatured), function(jsonMain) {
            loadMainGrid(jsonMain, currentPage, totalFeatured);
          });
      });
  }
});