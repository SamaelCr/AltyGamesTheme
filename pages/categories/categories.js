$(document).ready(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var category = urlParams.get('cat');
    var $container = $('#cat-results');
    var $title = $('#cat-name');

    if (category) {
        $title.text(category.replace(/-/g, ' '));
        loadCategoryPosts(category);
    } else {
        $container.html('<div class="search-message"><i class="fa-solid fa-tags"></i><br>Selecciona una categoría para ver los juegos.</div>');
    }
});

function loadCategoryPosts(cat) {
    $('#cat-results').html('<div class="search-message"><i class="fa-solid fa-circle-notch fa-spin"></i><br>Cargando juegos de '+cat+'...</div>');
    var script = document.createElement('script');
    script.src = '/feeds/posts/summary/-/' + encodeURIComponent(cat) + '?alt=json-in-script&callback=renderCategoryPosts&max-results=50';
    document.body.appendChild(script);
}

function renderCategoryPosts(json) {
    var html = '';
    var $container = $('#cat-results');
    if (!json.feed.entry || json.feed.entry.length === 0) {
        $container.html('<div class="search-message"><i class="fa-regular fa-face-frown"></i><br>No hay juegos publicados en esta categoría todavía.</div>');
        return;
    }
    html += '<div class="yt-list-container">'; 
    for (var i = 0; i < json.feed.entry.length; i++) {
        // Bloque de seguridad: Si un juego falla, saltamos al siguiente
        try {
            var entry = json.feed.entry[i];
            var title = entry.title.$t;
            var url = "#";
            for (var k = 0; k < entry.link.length; k++) {
                if (entry.link[k].rel == 'alternate') { url = entry.link[k].href; break; }
            }
            var thumb = getSmartThumb(entry); 
            var labels = getLabels(entry);    
            var rawSnippet = entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t : "");
            // Limpieza radical de comentarios y etiquetas rotas
            var cleanSnippet = rawSnippet.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>?/gm, '').trim();
            var snippet = cleanSnippet.length > 200 ? cleanSnippet.substring(0, 200) + "..." : cleanSnippet;

            html += '<div class="yt-list-card">';
            html += '<div class="yt-list-thumb"><a href="'+url+'"><img src="'+thumb+'"/></a></div>';
            html += '<div class="yt-list-content">';
            html += '<h2 class="yt-list-title"><a href="'+url+'">'+title+'</a></h2>';
            html += '<div class="yt-list-snippet">'+snippet+'</div>';
            html += labels;
            html += '</div></div>';
        } catch (err) {
            console.error("Error renderizando juego en índice: " + i, err);
            continue; // Seguir con el siguiente juego
        }
    }
    html += '</div>';
    $container.html(html);
}