$(document).ready(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var query = urlParams.get('q');
    var $searchInput = $('#yt-search-input');
    var $resultsContainer = $('#yt-search-results');

    // Si detecta una búsqueda en la URL al cargar la página
    if (query && query.trim() !== "") {
        $searchInput.val(query);
        performYTSearch(query);
    } else {
        $resultsContainer.html('<div class="search-message"><i class="fa-solid fa-magnifying-glass"></i><br>Ingresa un término para comenzar la búsqueda.</div>');
    }

    // Al darle ENTER o clic a la lupa en la barra gigante
    $('#yt-search-form').on('submit', function(e) {
        e.preventDefault();
        var val = $searchInput.val().trim();
        if(val) {
            // Actualiza la URL sin recargar la página (moderno)
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?q=' + encodeURIComponent(val);
            window.history.pushState({path:newurl}, '', newurl);
            performYTSearch(val);
        }
    });
});

function performYTSearch(query) {
    $('#yt-search-results').html('<div class="search-message"><i class="fa-solid fa-circle-notch fa-spin"></i><br>Buscando "'+query+'"...</div>');
    
    // Llamada a la API de Blogger
    var script = document.createElement('script');
    script.src = '/feeds/posts/summary?q=' + encodeURIComponent(query) + '&alt=json-in-script&callback=renderYTSearch&max-results=24';
    document.body.appendChild(script);
}

function renderYTSearch(json) {
    var html = '';
    var $container = $('#yt-search-results');

    // Si no hay resultados
    if (!json || !json.feed || !json.feed.entry || json.feed.entry.length === 0) {
        $container.html('<div class="search-message"><i class="fa-regular fa-face-frown"></i><br>No se encontraron resultados.</div>');
        return;
    }

    // Dibujar los resultados respetando tu diseño
    html += '<div class="yt-grid">';
    for (var i = 0; i < json.feed.entry.length; i++) {
        var entry = json.feed.entry[i];
        var title = entry.title.$t;
        var url = entry.link.find(l => l.rel == 'alternate').href;
        var thumb = getSmartThumb(entry); // Usa la función de tu script.js base
        var labels = getLabels(entry);    // Usa la función de tu script.js base

        html += '<div class="post-card">';
        html += '<div class="post-thumb-wrap"><a href="'+url+'"><img class="post-thumb" src="'+thumb+'"/></a></div>';
        html += '<h2><a href="'+url+'">'+title+'</a></h2>';
        html += labels;
        html += '</div>';
    }
    html += '</div>';
    
    $container.html(html);
}