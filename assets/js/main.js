/* eslint-disable */
function isValidUrl(e) {
    try {
        var t = new URL(e);
        return "http:" === t.protocol || "https:" === t.protocol;
    } catch {
        return !1;
    }
}

function sortByDate(e) {
    return e.slice().sort((e, t) => new Date(e.date) - new Date(t.date));
}

function renderEvents(e, t, c, n) {
    if (e && 0 !== e.length) {
        t.innerHTML = "";
        let o = document.createDocumentFragment();
        e.forEach(n => {
            var e = new Date(n.date), e = isNaN(e) ? n.date : e.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric"
            }), t = document.createElement("div"), a = (t.className = "col-md-4", 
            document.createElement("div")), d = (a.className = "card event-card h-100", 
            document.createElement("img"));
            d.loading = "lazy", d.src = c + "/" + n.image, d.className = "card-img-top", 
            d.alt = n.title;
            let r = d;
            isValidUrl(n.link) && ((s = document.createElement("a")).href = n.link,
            !1 === n.embeddable ? (s.target = "_blank", s.rel = "noopener") : s.addEventListener("click", e => {
                var t = document.getElementById("eventLinkModal");
                "undefined" != typeof bootstrap && t && (e.preventDefault(), (e = document.getElementById("eventLinkIframe")) && (e.src = "", e.setAttribute("data-src", n.link)),
                bootstrap.Modal.getOrCreateInstance(t).show());
            }), s.appendChild(d), r = s);
            var d = document.createElement("div"), s = (d.className = "card-body", 
            document.createElement("h5")), l = (s.className = "card-title", s.textContent = n.title, 
            document.createElement("p"));
            l.className = "card-text", l.textContent = e, d.appendChild(s), d.appendChild(l), 
            a.appendChild(r), a.appendChild(d), t.appendChild(a), o.appendChild(t);
        }), t.appendChild(o);
    } else t.innerHTML = `<p class="text-center w-100">${n}</p>`;
}

async function fetchAndRenderEvents(t, n, a, d, r) {
    try {
        var e, s = await fetch(t);
        s.ok && (e = await s.json(), Array.isArray(e)) && 0 < e.length ? renderEvents(sortByDate(e), n, d, r) : a ? a.style.display = "none" : renderEvents([], n, d, r);
    } catch (e) {
        console.warn(`Could not load events from ${t}:`, e), a ? a.style.display = "none" : renderEvents([], n, d, r);
    }
}

async function loadEvents() {
    var e = document.getElementById("events"), t = document.getElementById("events-grid"), n = document.getElementById("events-archive"), a = document.getElementById("archive-grid");
    e && t && (e = fetchAndRenderEvents("assets/events/events.json", t, null, "assets/events", "No upcoming events"), 
    t = n && a ? fetchAndRenderEvents("assets/events/archive/archive.json", a, n, "assets/events/archive", "No past events") : Promise.resolve(), 
    await Promise.all([ e, t ]));
}

document.addEventListener("DOMContentLoaded", loadEvents);

((e, i, d) => {
    var g;
    void 0 === e.lightwidget && (e.lightwidget = {}, g = null, e.addEventListener("message", function(e) {
        var t;
        -1 !== d.indexOf(e.origin.replace(/^https?:\/\//i, "")) && ("lightwidget_lightbox" === (t = "object" == typeof e.data ? e.data : JSON.parse(e.data)).type && null === g ? ((g = i.createElement("script")).src = "https://cdn.lightwidget.com/widgets/lightwidget-lightbox.y.js".replace("y", t.version), 
        i.body.appendChild(g)) : t.size <= 0 || [].forEach.call(i.querySelectorAll('iframe[src*="lightwidget.com/widgets/x"],iframe[data-src*="lightwidget.com/widgets/x"],iframe[src*="instansive.com/widgets/x"]'.replace(/x/g, t.widgetId)), function(e) {
            e.style.height = t.size + "px";
        }));
    }, !1));
})(window, document, [ "lightwidget.com", "dev.lightwidget.com", "cdn.lightwidget.com" ]);

document.addEventListener("DOMContentLoaded", () => {
    let c = document.querySelector(".hero-video");
    if (c) {
        let t = c.getAttribute("poster"), e = c.querySelectorAll("source");
        var r = window.matchMedia("(prefers-reduced-motion: reduce)").matches, a = window.matchMedia("(prefers-reduced-data: reduce)").matches || navigator.connection && navigator.connection.saveData;
        let n, i, o = () => {
            var e = document.createElement("img");
            e.src = t, e.alt = "Boteco hero image", e.className = "hero-video",
            c.replaceWith(e), c.removeEventListener("pause", n), c.removeEventListener("ended", n), document.removeEventListener("visibilitychange", i);
        };
        if (r || a) o(); else {
            n = () => {
                c.play().catch(o);
            }, i = () => {
                "visible" === document.visibilityState && n();
            };
            let r = () => {
                e.forEach(e => {
                    e.src = e.dataset.src;
                }), c.addEventListener("error", o, {
                    once: !0
                }), c.load(), n(), c.addEventListener("pause", n), c.addEventListener("ended", n), document.addEventListener("visibilitychange", i);
            };
            "IntersectionObserver" in window ? new IntersectionObserver((e, t) => {
                e.forEach(e => {
                    e.isIntersecting && (r(), t.disconnect());
                });
            }).observe(c) : r();
        }
    }
});

// Lazy-load iframes from data-src attributes
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('shown.bs.modal', function () {
        const iframe = this.querySelector('iframe[data-src]');
        if (iframe && !iframe.getAttribute('src')) {
            iframe.src = iframe.getAttribute('data-src');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('iframe[data-src]').forEach(iframe => {
        const src = iframe.getAttribute('data-src');
        if (src) {
            iframe.src = src;
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    let e = document.querySelector("nav.navbar");
    if (e) {
        let t = !1, o = !1;
        var n = document.createElement("div");
        n.style.position = "absolute", n.style.top = 0, n.style.left = 0, n.style.width = "100%", 
        n.style.height = "1px", n.style.pointerEvents = "none", document.body.prepend(n), 
        new IntersectionObserver(function(e) {
            o = !e[0].isIntersecting, a();
        }).observe(n), document.addEventListener("mousemove", function(e) {
            t = e.clientY <= 80, a();
        });
        let l = document.getElementById("header-awards");
        if (l) {
            l.style.display = "flex", l.style.gap = "12px";
            let r = "http://www.w3.org/2000/svg";
            [ {
                href: "https://www.instagram.com/boteco_india/?hl=en",
                icon: "instagram",
                alt: "Instagram",
                color: "#FF0069"
            }, {
                href: "https://www.facebook.com/BotecoIndiaa/",
                icon: "facebook",
                alt: "Facebook",
                color: "#0866FF"
            }, {
                href: "https://www.zomato.com/bangalore/boteco-restaurante-brasileiro-1-mg-road-bangalore",
                icon: "zomato",
                alt: "Zomato",
                color: "#E23744"
            }, {
                href: "https://share.google/NarMPlfSI9EkznbtY",
                icon: "googlemaps",
                alt: "Google Maps",
                color: "#4285F4"
            } ].forEach(function(e) {
                var t = document.createElement("a"), o = (t.href = e.href, t.target = "_blank", 
                t.rel = "noopener", t.classList.add("social-icon", e.icon), t.style.setProperty("--hover-color", e.color), 
                document.createElementNS(r, "svg")), n = document.createElementNS(r, "title"), a = (n.textContent = e.alt, 
                document.createElementNS(r, "use"));
                a.setAttribute("href", "assets/icons/sprite.svg#" + e.icon), o.appendChild(n), 
                o.appendChild(a), t.appendChild(o), l.appendChild(t);
            });
        }
        function a() {
            o || t ? e.classList.remove("navbar-hidden") : e.classList.add("navbar-hidden");
        }
    }
});

document.addEventListener("DOMContentLoaded", function() {
    var t, e = document.querySelectorAll(".fade-in-section");
    0 !== e.length && (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? e.forEach(function(e) {
        e.classList.add("visible");
    }) : (t = new IntersectionObserver(function(e, t) {
        e.forEach(function(e) {
            e.isIntersecting && (e.target.classList.add("visible"), t.unobserve(e.target));
        });
    }, {
        threshold: .1
    }), e.forEach(function(e) {
        t.observe(e);
    })));
});

document.addEventListener("DOMContentLoaded", () => {
    let i = Array.from(document.querySelectorAll(".menus-section .menu-card img"));
    if (0 !== i.length) {
        let n = 0, r = 1 / 0;
        i.forEach(t => {
            var e = () => {
                var e = t.clientHeight || t.naturalHeight;
                0 < e && (r = Math.min(r, e)), ++n === i.length && isFinite(r) && i.forEach(e => {
                    e.style.height = r + "px", e.style.objectFit = "contain";
                });
            };
            t.complete ? e() : (t.addEventListener("load", e), t.addEventListener("error", e));
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".modal .carousel").forEach(t => {
        let e = bootstrap.Carousel.getOrCreateInstance(t), r = t.querySelectorAll(".carousel-item"), o = r.length;
        var n = t.closest(".modal");
        let l = n.querySelector(".image-counter");
        var a = n.querySelector(".prev-btn"), n = n.querySelector(".next-btn");
        function c(e) {
            l && (l.textContent = e + 1 + " / " + o);
        }
        var u = Array.from(r).indexOf(t.querySelector(".carousel-item.active"));
        c(0 <= u ? u : 0), t.addEventListener("slid.bs.carousel", e => {
            e = "number" == typeof e.to ? e.to : Array.from(r).indexOf(t.querySelector(".carousel-item.active"));
            c(0 <= e ? e : 0);
        }), a && a.addEventListener("click", () => e.prev()), n && n.addEventListener("click", () => e.next());
    });
});

document.addEventListener("DOMContentLoaded", () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const hash = link.getAttribute('href');
        if (hash.length > 1 && !link.hasAttribute('data-bs-toggle')) {
            link.addEventListener('click', e => {
                const target = document.querySelector(hash);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    });
});