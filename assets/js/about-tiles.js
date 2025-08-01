(document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('about-images-grid');
  if (!grid) return;
  var exts = ['.jpg', '.png', '.gif'];
  var total = 6;
  for (var i = 1; i <= total; i++) {
    (function(i){
      var col = document.createElement('div');
      col.className = 'col';
      var img = new Image();
      img.loading = 'lazy';
      img.alt = 'Boteco interior image ' + i;
      img.className = 'img-fluid rounded';
      var extIndex = 0;
      function loadNext() {
        if (extIndex >= exts.length) {
          img.remove();
          return;
        }
        img.src = 'assets/images/about/about-us-tile' + i + exts[extIndex++];
      }
      img.onerror = loadNext;
      loadNext();
      col.appendChild(img);
      grid.appendChild(col);
    })(i);
  }
}));
