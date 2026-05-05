document.addEventListener("DOMContentLoaded", function() {
    var urlParams = new URLSearchParams(window.location.search);
    var query = urlParams.get('q');
    var searchInput = document.getElementById('yt-search-input');
    var resultsContainer = document.getElementById('yt-search-results');
    var searchForm = document.getElementById('yt-search-form');

    if (query && query.trim() !== "") {
        if (searchInput) searchInput.value = query;
        performYTSearch(query);
    } else {
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="search-message"><i class="fa-solid fa-magnifying-glass"></i><br>Ingresa un término para comenzar la búsqueda.</div>';
        }
    }

    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!searchInput) return;
            var val = searchInput.value.trim();
            if(val) {
                var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?q=' + encodeURIComponent(val);
                window.history.pushState({path:newurl}, '', newurl);
                performYTSearch(val);
            }
        });
    }
});

function performYTSearch(query) {
    var container = document.getElementById('yt-search-results');
    if (container) {
        container.innerHTML = '<div class="search-message"><i class="fa-solid fa-circle-notch fa-spin"></i><br>Buscando "'+query+'"...</div>';
    }
    
    var feedUrl = '/feeds/posts/summary?q=' + encodeURIComponent(query) + '&max-results=24';
    
    if (typeof getJSONP === 'function') {
        getJSONP(feedUrl, function(json) {
            renderYTSearch(json);
        });
    } else {
        var script = document.createElement('script');
        script.src = feedUrl + '&alt=json-in-script&callback=renderYTSearch';
        document.body.appendChild(script);
    }
}

window.renderYTSearch = function(json) {
    var html = '';
    var container = document.getElementById('yt-search-results');
    var searchInput = document.getElementById('yt-search-input');
    var currentQuery = searchInput ? searchInput.value : "búsqueda";

    if (!json || !json.feed || !json.feed.entry || json.feed.entry.length === 0) {
        if (container) {
            container.innerHTML = '<div class="search-message"><i class="fa-regular fa-face-frown"></i><br>No se encontraron resultados para "'+currentQuery+'".</div>';
        }
        return;
    }

    html += '<div class="yt-list-container">';
    var entries = json.feed.entry;

    for (var i = 0; i < entries.length; i++) {
        try {
            var entry = entries[i];
            var title = entry.title.$t;
            var url = "#";
            
            if (entry.link) {
                for (var k = 0; k < entry.link.length; k++) {
                    if (entry.link[k].rel == 'alternate') { 
                        url = entry.link[k].href; 
                        break; 
                    }
                }
            }

            var thumb = typeof getSmartThumb === 'function' ? getSmartThumb(entry) : ""; 
            var labels = typeof getLabels === 'function' ? getLabels(entry) : "";    
            
            var rawSnippet = entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t : "");
            var cleanSnippet = rawSnippet.replace(/<!--[\s\S]*?-->/g, "").replace(/(<([^>]+)>)/ig,"").trim();
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
            console.error("Error procesando entrada de búsqueda en índice: " + i, err);
            continue;
        }
    }
    html += '</div>';
    
    if (container) container.innerHTML = html;
}