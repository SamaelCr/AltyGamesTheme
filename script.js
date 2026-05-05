var posts_per_page = 9;
var featured_label = "Destacado";

/* MOTOR IMÁGENES HQ */
function getSmartThumb(entry) {
  var thumb = "";
  if (entry.media$thumbnail) { thumb = entry.media$thumbnail.url; } 
  else {
    var content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : "");
    var match = content.match(/<img[^>]+src="([^">]+)"/);
    thumb = match ? match[1] : "https://via.placeholder.com/400x250?text=No+Image";
  }
  if (thumb.indexOf("googleusercontent.com") != -1 || thumb.indexOf("bp.blogspot.com") != -1) {
    thumb = thumb.replace(/\/s[0-9]+.*?\//, "/s1600/").replace(/=s[0-9]+.*/, "=s1600");
  }
  return thumb;
}

function getLabels(entry) {
  var html = '<div class="post-labels">';
  if (entry.category) {
    for (var i = 0; i < entry.category.length; i++) {
      if (entry.category[i].term !== featured_label) {
        html += '<span class="post-tag">' + entry.category[i].term + '</span>';
      }
    }
  }
  html += '</div>';
  return html;
}

function loadFeatured(json) {
  var html = "";
  if(!json.feed.entry) return;
  for (var i = 0; i < json.feed.entry.length; i++) {
    var entry = json.feed.entry[i];
    var title = entry.title.$t;
    var url = entry.link.find(l => l.rel == 'alternate').href;
    var thumb = getSmartThumb(entry);
    var labels = getLabels(entry);
    html += '<div class="post-card"><div class="post-thumb-wrap"><a href="'+url+'"><img class="post-thumb" src="'+thumb+'" style="height:210px"/></a></div><h2><a href="'+url+'">'+title+'</a></h2>'+labels+'</div>';
  }
  document.getElementById("featured-ajax-grid").innerHTML = html;
}

/* FIX: Ahora recibe la página actual, construye el DOM directamente y maneja resultados vacíos */
function loadMainGrid(json, currentPage) {
  var entries = json.feed.entry ||[];
  var totalResults = json.feed.openSearch$totalResults ? parseInt(json.feed.openSearch$totalResults.$t) : 0;
  var html = "";
  
  // Si no hay entradas en esta página, mostramos un mensaje
  if (entries.length === 0) {
      document.getElementById("main-ajax-grid").innerHTML = "<div style='grid-column:1/-1; text-align:center; padding:20px; color:var(--brand-color); font-weight:bold;'>No hay más juegos para mostrar en esta página.</div>";
      document.getElementById("blog-pager").innerHTML = "";
      return;
  }

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var title = entry.title.$t;
    var postUrl = entry.link.find(l => l.rel == 'alternate').href;
    var thumb = getSmartThumb(entry);
    var labels = getLabels(entry);
    html += '<div class="post-card"><div class="post-thumb-wrap"><a href="'+postUrl+'"><img class="post-thumb" src="'+thumb+'"/></a></div><h2><a href="'+postUrl+'">'+title+'</a></h2>'+labels+'</div>';
  }
  document.getElementById("main-ajax-grid").innerHTML = html;
  
  /* LÓGICA DE PAGINACIÓN ADAPTADA AL TOTAL DEL SERVIDOR */
  var totalPages = Math.ceil(totalResults / posts_per_page);
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
      
      if (currentPage < totalPages) phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage+1)+"'>&gt;</a>";
      
      document.getElementById("blog-pager").innerHTML = phtml;
  } else {
      document.getElementById("blog-pager").innerHTML = "";
  }
}

$(document).ready(function() {
  /* 1. LÓGICA DE SUBMENÚS (SISTEMA DE MAPEO PREVIO V3) - CORREGIDA */
  var currentParent = null;
  var currentUl = null;

  $('.dark_menu > li').get().forEach(function(el) {
    var $li = $(el);
    var $link = $li.find('> a').first();
    
    if ($link.length) {
      var text = $link.text().trim();

      if (text.startsWith('_')) {
        if (currentParent) {
          if (!currentUl) {
            currentUl = $('<ul></ul>');
            currentParent.append(currentUl);
            currentParent.addClass('has-children');
          }
          $link.text(text.substring(1).trim());
          currentUl.append($li);
        }
      } else {
        currentParent = $li;
        currentUl = null; 
      }
    }
  });

  $('.dark_menu').addClass('menu-ready');

  /* 2. TOGGLE TEMA */
  const themeBtn = $('#theme-toggle');
  const htmlEl = $('html');
  themeBtn.on('click', function() {
    if (htmlEl.hasClass('light-theme')) {
      htmlEl.removeClass('light-theme');
      localStorage.setItem('theme', 'dark');
      themeBtn.find('i').attr('class', 'fa-solid fa-sun');
    } else {
      htmlEl.addClass('light-theme');
      localStorage.setItem('theme', 'light');
      themeBtn.find('i').attr('class', 'fa-solid fa-moon');
    }

    if (typeof DISQUS !== 'undefined') {
        setTimeout(function() {
            DISQUS.reset({ reload: true });
        }, 200); 
    }
  });

  /* 3. PANEL LATERAL (SIDE DRAWER) */
  var menuHTML = $('.menujohanes .dark_menu').html();
  $('#drawer-content').html('<ul class="dark_menu">' + menuHTML + '</ul>');
  $('#menu-toggle').on('click', function() { $('body').addClass('drawer-open'); });
  $('#drawer-close, #drawer-overlay').on('click', function() { $('body').removeClass('drawer-open'); });
  
  $(document).on('click', '#side-drawer .has-children > a', function(e) {
    e.preventDefault();
    $(this).parent().toggleClass('active');
  });

  /* 4. REUBICACIÓN TÍTULO DE BLOGGER AUTOMÁTICAMENTE */
  if(($('body').hasClass('item-view') || window.location.href.indexOf('.html') > -1) && window.location.href.indexOf('search.html') === -1 && window.location.href.indexOf('categories.html') === -1) {
    var pageTitleText = document.title.split(' - ')[0]; 
    var postTitleHTML = '<h2 class="section-title" style="text-align:center; border:0; margin-top:20px; color:var(--brand-color)!important;">' + pageTitleText + '</h2>';
    var firstImg = $('.post-body-container img').first();
    if(firstImg.length) {
        if(firstImg.parent('a').length) { firstImg.parent('a').after(postTitleHTML); } 
        else { firstImg.after(postTitleHTML); }
    }
  }

  /* 5. INYECCIÓN ABSOLUTA PARA PÁGINA DE BÚSQUEDA */
  if (window.location.href.indexOf('/p/search.html') > -1) {
      $('body').addClass('is-search-page');
      var cacheBuster = new Date().getTime();
      $('head').append('<link rel="stylesheet" href="https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.css?v=' + cacheBuster + '">');
      $('head').append('<script src="https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.js?v=' + cacheBuster + '"></script>');
  }

  /* 6. INYECCIÓN ABSOLUTA PARA PÁGINA DE CATEGORÍAS */
  if (window.location.href.indexOf('/p/categories.html') > -1) {
      $('body').addClass('is-category-page');
      var cbCat = new Date().getTime();
      $('head').append('<link rel="stylesheet" href="https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/search/search.css?v=' + cbCat + '">');
      $('head').append('<link rel="stylesheet" href="https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/categories/categories.css?v=' + cbCat + '">');
      $('head').append('<script src="https://raw.githack.com/SamaelCr/AltyGamesTheme/main/pages/categories/categories.js?v=' + cbCat + '"></script>');
  }

  /* =========================================================================
     7. NUEVO SISTEMA DE CARGA AJAX (PAGINACIÓN SERVER-SIDE REAL) - FIX CORS
     ========================================================================= */
  if ($('#main-ajax-grid').length) {
      
      var url = window.location.href;
      var currentPage = url.indexOf("PageNo=") != -1 ? parseInt(url.split("PageNo=")[1]) : 1;
      if (isNaN(currentPage)) currentPage = 1;

      // A. Carga del Grid Destacado (usando JSONP para evitar bloqueos CORS)
      if ($('#featured-ajax-grid').length) {
          $.ajax({
              url: "/feeds/posts/summary/-/Destacado?alt=json-in-script&max-results=2",
              type: "GET",
              dataType: "jsonp", 
              success: function(json) { loadFeatured(json); }
          });
      }

      // B. Carga del Grid Principal con Exclusión mediante operador de búsqueda
      if ($('#main-ajax-grid').length) {
          // Calculamos el OFFSET
          var startIndex = ((currentPage - 1) * posts_per_page) + 1;
          
          // Operador nativo de búsqueda de Blogger para excluir: -label:NombreEtiqueta
          var queryExclude = encodeURIComponent("-label:" + featured_label); 
          
          $('#main-ajax-grid').html('<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--brand-color);">Cargando juegos...</div>');
          
          $.ajax({
              // Agregamos orderby=published para mantener orden cronológico
              url: "/feeds/posts/summary?alt=json-in-script&orderby=published&q=" + queryExclude + "&start-index=" + startIndex + "&max-results=" + posts_per_page,
              type: "GET",
              dataType: "jsonp", 
              success: function(json) {
                  loadMainGrid(json, currentPage);
              },
              error: function() {
                  $('#main-ajax-grid').html('<div style="grid-column:1/-1; text-align:center; padding:20px; color:red;">Error de conexión con el servidor.</div>');
              }
          });
      }
  }
});