/* categories.js - AltyGames Vanilla */
(function() {
    function initCategories() {
        var urlParams = new URLSearchParams(window.location.search);
        var category = urlParams.get('cat');
        var currentPage = parseInt(urlParams.get('PageNo')) || 1;
        var container = document.getElementById('cat-results');
        var titleEl = document.getElementById('cat-name');

        if (category) {
            if (titleEl) titleEl.textContent = category.replace(/-/g, ' ');
            loadCategoryPosts(category, currentPage);
        } else {
            if (container) {
                container.innerHTML = '<div class="search-message"><i class="fa-solid fa-tags"></i><br>Selecciona una categoría para ver los juegos.</div>';
            }
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        initCategories();
    } else {
        document.addEventListener("DOMContentLoaded", initCategories);
    }
})();

function loadCategoryPosts(cat, page) {
    var container = document.getElementById('cat-results');
    if (!container) return;

    container.innerHTML = '<div class="search-message"><i class="fa-solid fa-circle-notch fa-spin"></i><br>Cargando juegos de '+cat+'...</div>';
    
    var posts_per_page = 9;
    var startIndex = ((page - 1) * posts_per_page) + 1;
    var feedUrl = '/feeds/posts/summary/-/' + encodeURIComponent(cat) + '?start-index=' + startIndex + '&max-results=' + posts_per_page;
    
    if (typeof getJSONP === 'function') {
        getJSONP(feedUrl, function(json) {
            renderCategoryPosts(json, page, cat);
        });
    } else {
        console.error("Error: getJSONP no está definido en script.js");
    }
}

function renderCategoryPosts(json, currentPage, cat) {
    var html = '';
    var container = document.getElementById('cat-results');
    var posts_per_page = 9;

    if (!json.feed || !json.feed.entry || json.feed.entry.length === 0) {
        if (container) container.innerHTML = '<div class="search-message"><i class="fa-regular fa-face-frown"></i><br>No hay más juegos en esta página.</div>';
        return;
    }

    var totalResults = parseInt(json.feed.openSearch$totalResults.$t);
    html += '<div class="yt-list-container">'; 
    var entries = json.feed.entry;

    for (var i = 0; i < entries.length; i++) {
        try {
            var entry = entries[i];
            var title = entry.title.$t;
            var url = "#";
            if (entry.link) {
                for (var k = 0; k < entry.link.length; k++) {
                    if (entry.link[k].rel == 'alternate') { url = entry.link[k].href; break; }
                }
            }
            
            var thumb = typeof getSmartThumb === 'function' ? getSmartThumb(entry) : ""; 
            var labels = typeof getLabels === 'function' ? getLabels(entry) : "";    
            
            var rawSnippet = entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t : "");
            var cleanSnippet = rawSnippet.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>?/gm, '').trim();
            var snippet = cleanSnippet.length > 200 ? cleanSnippet.substring(0, 200) + "..." : cleanSnippet;

            html += '<div class="yt-list-card">';
            html += '<div class="yt-list-thumb"><a href="'+url+'"><img src="'+thumb+'"/></a></div>';
            html += '<div class="yt-list-content">';
            html += '<h2 class="yt-list-title"><a href="'+url+'">'+title+'</a></h2>';
            html += '<div class="yt-list-snippet">'+snippet+'</div>';
            html += labels;
            html += '</div>';
            html += '</div>';
        } catch (err) {
            console.error("Error en tarjeta de categoría índice: " + i, err);
            continue; 
        }
    }
    html += '</div>'; 

    var totalPages = Math.ceil(totalResults / posts_per_page);
    if (totalPages > 1) {
        html += '<div id="blog-pager" style="margin-top:40px">';
        var base_url = window.location.pathname + "?cat=" + encodeURIComponent(cat);
        if (currentPage > 1) html += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage-1)+"'>&lt;</a>";
        var startPage = Math.max(1, currentPage - 2);
        var endPage = Math.min(totalPages, currentPage + 2);
        if (startPage > 1) {
            html += "<a class='showpageNum' href='"+base_url+"&PageNo=1'>1</a>";
            if (startPage > 2) html += "<span class='showpagePoint' style='background:transparent;border:0;box-shadow:none'>...</span>";
        }
        for (var j = startPage; j <= endPage; j++) {
            if (j == currentPage) html += "<span class='showpagePoint'>"+j+"</span>";
            else html += "<a class='showpageNum' href='"+base_url+"&PageNo="+j+"'>"+j+"</a>";
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += "<span class='showpagePoint' style='background:transparent;border:0;box-shadow:none'>...</span>";
            html += "<a class='showpageNum' href='"+base_url+"&PageNo="+totalPages+"'>"+totalPages+"</a>";
        }
        if (currentPage < totalPages) {
            html += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage+1)+"'>&gt;</a>";
        }
        html += '</div>';
    }
    if (container) container.innerHTML = html;
}