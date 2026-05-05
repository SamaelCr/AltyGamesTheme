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
    // Optimización de resolución para Blogger/Google
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

/* HELPER PARA JSONP (Resistente) */
function getJSONP(url, callback) {
  var callbackName = 'callback_' + Math.round(100000 * Math.random());
  window[callbackName] = function(data) {
    callback(data);
    delete window[callbackName];
    var scriptTag = document.getElementById(callbackName);
    if (scriptTag) scriptTag.remove();
  };
  var script = document.createElement('script');
  script.id = callbackName;
  // Blogger requiere alt=json-in-script para activar JSONP
  var separator = url.indexOf('?') >= 0 ? '&' : '?';
  script.src = url + separator + 'alt=json-in-script&callback=' + callbackName;
  document.body.appendChild(script);
}

function loadFeatured(json) {
  var html = "";
  if(!json.feed || !json.feed.entry) return;
  var entries = json.feed.entry;
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
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

function loadMainGrid(json, currentPage, totalFeatured) {
  var entries = (json.feed && json.feed.entry) ? json.feed.entry : [];
  var totalAll = (json.feed && json.feed.openSearch$totalResults) ? parseInt(json.feed.openSearch$totalResults.$t) : 0;
  
  currentPage = currentPage || 1;
  totalFeatured = totalFeatured || 0;
  var totalMain = totalAll - totalFeatured;
  var html = "";
  
  // Filtrar para no repetir destacados en el grid principal
  var filteredEntries = entries.filter(function(e) {
    var labels = e.category || [];
    for(var j=0; j<labels.length; j++) {
        if(labels[j].term === featured_label) return false;
    }
    return true;
  });

  var pageEntries = filteredEntries.slice(0, posts_per_page);
  var mainGrid = document.getElementById("main-ajax-grid");
  if (!mainGrid) return;

  if (pageEntries.length === 0) {
      mainGrid.innerHTML = "<div style='grid-column:1/-1; text-align:center; padding:20px; color:var(--brand-color); font-weight:bold;'>No hay más juegos para mostrar.</div>";
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
  
  // Paginación
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
  }
}

document.addEventListener("DOMContentLoaded", function() {
  /* 1. LÓGICA DE SUBMENÚS */
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

  /* 3. PANEL LATERAL */
  var sourceMenu = document.querySelector('.menujohanes .dark_menu');
  var drawerContent = document.getElementById('drawer-content');
  if (sourceMenu && drawerContent) {
    drawerContent.innerHTML = '<ul class="dark_menu">' + sourceMenu.innerHTML + '</ul>';
  }

  var menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() { document.body.classList.add('drawer-open'); });
  }

  ['drawer-close', 'drawer-overlay'].forEach(function(id) {
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', function() { document.body.classList.remove('drawer-open'); });
  });

  document.addEventListener('click', function(e) {
    var target = e.target.closest('#side-drawer .has-children > a');
    if (target) {
      e.preventDefault();
      target.parentElement.classList.toggle('active');
    }
  });

  /* 4. REUBICACIÓN TÍTULO */
  if((document.body.classList.contains('item-view') || window.location.href.indexOf('.html') > -1) && window.location.href.indexOf('search.html') === -1 && window.location.href.indexOf('categories.html') === -1) {
    var pageTitleText = document.title.split(' - ')[0]; 
    var postTitleHTML = '<h2 class="section-title" style="text-align:center; border:0; margin-top:20px; color:var(--brand-color)!important;">' + pageTitleText + '</h2>';
    var firstImg = document.querySelector('.post-body-container img');
    if(firstImg) {
        var firstAnchor = firstImg.closest('a');
        (firstAnchor || firstImg).insertAdjacentHTML('afterend', postTitleHTML);
    }
  }

  /* 5 & 6. INYECCIÓN PÁGINAS ESPECIALES */
  if (window.location.href.indexOf('/p/search.html') > -1 || window.location.href.indexOf('/p/categories.html') > -1) {
      var isCat = window.location.href.indexOf('/p/categories.html') > -1;
      if(isCat) document.body.classList.add('is-category-page');
      else document.body.classList.add('is-search-page');
      
      var cb = new Date().getTime();
      var styles = ['/pages/search/search.css'];
      if(isCat) styles.push('/pages/categories/categories.css');
      
      styles.forEach(function(path){
          var l = document.createElement('link'); l.rel = 'stylesheet';
          l.href = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main' + path + '?v=' + cb;
          document.head.appendChild(l);
      });

      var s = document.createElement('script');
      s.src = 'https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/' + (isCat ? 'categories/categories.js' : 'search/search.js') + '?v=' + cb;
      document.head.appendChild(s);
  }

  /* 7. CARGA AJAX PRINCIPAL */
  var mainGridContainer = document.getElementById('main-ajax-grid');
  if (mainGridContainer && !document.body.classList.contains('is-category-page') && !document.body.classList.contains('is-search-page')) {
      var urlParams = new URLSearchParams(window.location.search);
      var currentPage = parseInt(urlParams.get('PageNo')) || 1;
      var startIndex = ((currentPage - 1) * posts_per_page) + 1;
      
      mainGridContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--brand-color);">Cargando juegos...</div>';

      // 1. Obtener conteo de destacados
      getJSONP("/feeds/posts/summary/-/Destacado?max-results=0", function(dataFeatured) {
          var totalFeatured = (dataFeatured.feed && dataFeatured.feed.openSearch$totalResults) ? parseInt(dataFeatured.feed.openSearch$totalResults.$t) : 0;
          
          // 2. Cargar los destacados visibles (Top 2)
          if(totalFeatured > 0) {
            getJSONP("/feeds/posts/summary/-/Destacado?max-results=2", function(jsonFeatured) { 
                loadFeatured(jsonFeatured); 
            });
          } else {
            var fGrid = document.getElementById("featured-ajax-grid");
            if(fGrid) fGrid.innerHTML = "<div style='grid-column:1/-1; opacity:0.5'>No hay destacados.</div>";
          }

          // 3. Cargar el grid principal (ajustando startIndex para saltar duplicados si fuera necesario)
          getJSONP("/feeds/posts/summary?start-index=" + startIndex + "&max-results=" + (posts_per_page + totalFeatured), function(jsonMain) {
            loadMainGrid(jsonMain, currentPage, totalFeatured);
          });
      });
  }
});