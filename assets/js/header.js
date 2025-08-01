document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('nav.navbar');
  if (!navbar) return;

  navbar.classList.add('navbar-hidden');
  var pointerInTop = false;
  var scrolledPastTop = false;

  var sentinel = document.createElement('div');
  sentinel.style.position = 'absolute';
  sentinel.style.top = 0;
  sentinel.style.left = 0;
  sentinel.style.width = '100%';
  sentinel.style.height = '1px';
  sentinel.style.pointerEvents = 'none';
  document.body.prepend(sentinel);

  var observer = new IntersectionObserver(function (entries) {
    scrolledPastTop = !entries[0].isIntersecting;
    updateVisibility();
  });
  observer.observe(sentinel);

  function updateVisibility() {
    if (scrolledPastTop || pointerInTop) {
      navbar.classList.remove('navbar-hidden');
    } else {
      navbar.classList.add('navbar-hidden');
    }
  }

  document.addEventListener('mousemove', function (e) {
    pointerInTop = e.clientY <= 80;
    updateVisibility();
  });

  var awardsContainer = document.getElementById('header-awards');
  if (awardsContainer) {
    awardsContainer.style.display = 'flex';
    awardsContainer.style.gap = '12px';

    var socialLinks = [
      {
        href: 'https://www.instagram.com/boteco_india/?hl=en',
        icon: 'instagram',
        alt: 'Instagram',
        color: '#FF0069'
      },
      {
        href: 'https://www.facebook.com/BotecoIndiaa/',
        icon: 'facebook',
        alt: 'Facebook',
        color: '#0866FF'
      },
      {
        href:
          'https://www.zomato.com/bangalore/boteco-restaurante-brasileiro-1-mg-road-bangalore',
        icon: 'zomato',
        alt: 'Zomato',
        color: '#E23744'
      },
      {
        href: 'https://share.google/NarMPlfSI9EkznbtY',
        icon: 'googlemaps',
        alt: 'Google Maps',
        color: '#4285F4'
      }
    ];

    socialLinks.forEach(function (link) {
      var a = document.createElement('a');
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener';

      a.classList.add('social-icon', link.icon);
      a.style.setProperty('--hover-color', link.color);

      fetch('assets/icons/' + link.icon + '.svg')
        .then(function (res) {
          return res.text();
        })
        .then(function (svg) {
          a.innerHTML = svg;
        });

      awardsContainer.appendChild(a);
    });
  }
});
