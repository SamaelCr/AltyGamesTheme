$(document).ready(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var category = urlParams.get('cat');
    var currentPage = parseInt(urlParams.get('PageNo')) || 1;
    var $container = $('#cat-results');
    var $title = $('#cat-name');

    if (category) {
        $title.text(category.replace(/-/g, ' '));
        loadCategoryPosts(category, currentPage);
    } else {
        $container.html('<div class="search-message"><i class="fa-solid fa-tags"></i><br>Selecciona una categoría para ver los juegos.</div>');
    }
});

function loadCategoryPosts(cat, page) {
    $('#cat-results').html('<div class="search-message"><i class="fa-solid fa-circle-notch fa-spin"></i><br>Cargando juegos de '+cat+'...</div>');
    
    // Calculamos el inicio según la página (9 juegos por página)
    var posts_per_page = 9;
    var startIndex = ((page - 1) * posts_per_page) + 1;

    // Llamada a la API de Blogger filtrando por etiqueta y con paginación
    $.ajax({
        url: '/feeds/posts/summary/-/' + encodeURIComponent(cat) + '?alt=json-in-script&start-index=' + startIndex + '&max-results=' + posts_per_page,
        type: "GET",
        dataType: "jsonp",
        success: function(json) {
            renderCategoryPosts(json, page, cat);
        },
        error: function() {
            $('#cat-results').html('<div class="search-message">Error al cargar la categoría.</div>');
        }
    });
}

function renderCategoryPosts(json, currentPage, cat) {
    var html = '';
    var $container = $('#cat-results');
    var posts_per_page = 9;

    if (!json.feed.entry || json.feed.entry.length === 0) {
        $container.html('<div class="search-message"><i class="fa-regular fa-face-frown"></i><br>No hay más juegos en esta página.</div>');
        return;
    }

    var totalResults = parseInt(json.feed.openSearch$totalResults.$t);

    html += '<div class="yt-list-container">'; 
    for (var i = 0; i < json.feed.entry.length; i++) {
        // BLOQUE DE SEGURIDAD (Try/Catch)
        try {
            var entry = json.feed.entry[i];
            var title = entry.title.$t;
            var url = "#";
            if (entry.link) {
                for (var k = 0; k < entry.link.length; k++) {
                    if (entry.link[k].rel == 'alternate') { url = entry.link[k].href; break; }
                }
            }
            
            var thumb = getSmartThumb(entry); 
            var labels = getLabels(entry);    
            
            var rawSnippet = entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t : "");
            // Limpieza radical para evitar que comentarios HTML rompan el diseño
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
    html += '</div>'; // Fin yt-list-container

    // DIBUJAR EL PAGINADOR (Sincronizado con script.js)
    var totalPages = Math.ceil(totalResults / posts_per_page);
    if (totalPages > 1) {
        html += '<div id="blog-pager" style="margin-top:40px">';
        var base_url = window.location.pathname + "?cat=" + encodeURIComponent(cat);
        
        if (currentPage > 1) {
            html += "<a class='showpageNum' href='"+base_url+"&PageNo="+(currentPage-1)+"'>&lt;</a>";
        }

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
    
    $container.html(html);
}