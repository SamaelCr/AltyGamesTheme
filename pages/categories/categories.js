(function() {
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

    function loadCategoryPosts(cat, page) {
        if (!container) return;
        container.innerHTML = '<div class="search-message"><i class="fa-solid fa-circle-notch fa-spin"></i><br>Cargando juegos de '+cat+'...</div>';
        var posts_per_page = 9;
        var startIndex = ((page - 1) * posts_per_page) + 1;
        var feedUrl = '/feeds/posts/summary/-/' + encodeURIComponent(cat) + '?start-index=' + startIndex + '&max-results=' + posts_per_page;
        
        if (typeof getJSONP === 'function') {
            getJSONP(feedUrl, function(json) { renderCategoryPosts(json, page, cat); });
        }
    }

    function renderCategoryPosts(json, currentPage, cat) {
        var html = '';
        var posts_per_page = 9;
        if (!json.feed || !json.feed.entry) {
            container.innerHTML = '<div class="search-message"><i class="fa-regular fa-face-frown"></i><br>No hay más juegos en esta página.</div>';
            return;
        }
        var totalResults = parseInt(json.feed.openSearch$totalResults.$t);
        html += '<div class="yt-list-container">'; 
        json.feed.entry.forEach(function(entry) {
            try {
                var title = entry.title.$t;
                var url = "#";
                entry.link.forEach(function(l) { if (l.rel == 'alternate') url = l.href; });
                var thumb = getSmartThumb(entry); 
                var labels = getLabels(entry);    
                var rawSnippet = entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t : "");
                var cleanSnippet = rawSnippet.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>?/gm, '').trim();
                var snippet = cleanSnippet.length > 200 ? cleanSnippet.substring(0, 200) + "..." : cleanSnippet;
                html += '<div class="yt-list-card"><div class="yt-list-thumb"><a href="'+url+'"><img src="'+thumb+'"/></a></div><div class="yt-list-content"><h2 class="yt-list-title"><a href="'+url+'">'+title+'</a></h2><div class="yt-list-snippet">'+snippet+'</div>'+labels+'</div></div>';
            } catch (err) {}
        });
        html += '</div>'; 

        var totalPages = Math.ceil(totalResults / posts_per_page);
        if (totalPages > 1) {
            html += '<div id="blog-pager" style="margin-top:40px">';
            var base_url = window.location.pathname + "?cat=" + encodeURIComponent(cat);
            if (currentPage > 1) html += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage-1)+"'>&lt;</a>";
            for (var j = Math.max(1, currentPage - 2); j <= Math.min(totalPages, currentPage + 2); j++) {
                if (j == currentPage) html += "<span class='showpagePoint'>"+j+"</span>";
                else html += "<a class='showpageNum' href='"+base_url+"&PageNo="+j+"'>"+j+"</a>";
            }
            if (currentPage < totalPages) html += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage+1)+"'>&gt;</a>";
            html += '</div>';
        }
        container.innerHTML = html;
    }
})();