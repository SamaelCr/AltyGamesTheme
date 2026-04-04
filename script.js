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

/* ETIQUETAS */
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

function loadMainGrid(json) {
  var entries = json.feed.entry || [];
  var url = window.location.href;
  var currentPage = url.indexOf("PageNo=") != -1 ? parseInt(url.split("PageNo=")[1]) : 1;
  var filteredEntries = entries.filter(e => !(e.category || []).some(l => l.term === featured_label));
  var start = (currentPage - 1) * posts_per_page;
  var end = start + posts_per_page;
  var pageEntries = filteredEntries.slice(start, end);
  var html = "";
  for (var i = 0; i < pageEntries.length; i++) {
    var entry = pageEntries[i];
    var title = entry.title.$t;
    var postUrl = entry.link.find(l => l.rel == 'alternate').href;
    var thumb = getSmartThumb(entry);
    var labels = getLabels(entry);
    html += '<div class="post-card"><div class="post-thumb-wrap"><a href="'+postUrl+'"><img class="post-thumb" src="'+thumb+'"/></a></div><h2><a href="'+postUrl+'">'+title+'</a></h2>'+labels+'</div>';
  }
  document.getElementById("main-ajax-grid").innerHTML = html;
  var totalPages = Math.ceil(filteredEntries.length / posts_per_page);
  var phtml = "";
  var base_url = url.split("?")[0] + "?max-results=" + posts_per_page;
  if (currentPage > 1) phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage-1)+"'>&lt;</a>";
  for (var j = 1; j <= totalPages; j++) {
    if (j == currentPage) phtml += "<span class='showpagePoint'>"+j+"</span>";
    else phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+j+"'>"+j+"</a>";
  }
  if (currentPage < totalPages) phtml += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage+1)+"'>&gt;</a>";
  document.getElementById("blog-pager").innerHTML = phtml;
}

$(document).ready(function() {
  /* SUBMENÚS (_) */
  $('.dark_menu li').each(function() {
    var $link = $(this).find('a').first();
    var text = $link.text().trim();
    if (text.indexOf('_') === 0) {
      var $parent = $(this).prevAll().filter(function() { return $(this).find('a').first().text().trim().indexOf('_') !== 0; }).first();
      if ($parent.length) {
        if (!$parent.find('ul').length) { $parent.append('<ul></ul>').addClass('has-children'); }
        $link.text(text.replace('_', ''));
        $(this).detach().appendTo($parent.find('ul'));
      }
    }
  });
  $('.dark_menu').addClass('menu-ready');

  /* TOGGLE TEMA */
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
  });
  if (htmlEl.hasClass('light-theme')) { themeBtn.find('i').attr('class', 'fa-solid fa-moon'); } else { themeBtn.find('i').attr('class', 'fa-solid fa-sun'); }
});