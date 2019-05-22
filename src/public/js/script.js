!(function(w, d) {
    const handlers = {};

    const decorators = {};

    const helpers = {
        ajax: function(options) {
            let request = new XMLHttpRequest(),
                headers = options.headers || [],
                i;
            request.open(options.type, options.url, true);
            for (i = 0; i < headers.length; i++) {
                request.setRequestHeader(headers[i][0], headers[i][1]);
            }
            request.onreadystatechange = function() {
                if (request.readyState == 4) {
                    if (request.status >= 200 && request.status < 400) {
                        if (options.callback && typeof options.callback == 'function') {
                            options.callback.call(request, request.responseText);
                        }
                    } else if (options.error && typeof options.error == 'function') {
                        options.error.call(request, request.responseText);
                    }
                    _decorate();
                }
            };

            request.send(options.data);

            return request;
        },
        isJson: function(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }

            return true;
        },
        trigger: function(el, eventType) {
            const e = document.createEvent('MouseEvents');
            e.initMouseEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            el.dispatchEvent(e);
        },

        convertDataURI: function(dataURI) {
            let marker = ';base64,',
                base64Index = dataURI.indexOf(marker) + marker.length,
                base64 = dataURI.substring(base64Index),
                raw = w.atob(base64),
                rawLength = raw.length,
                array = new Uint8Array(new ArrayBuffer(rawLength));

            for (let i = 0; i < rawLength; i++) {
                array[i] = raw.charCodeAt(i);
            }

            return array;
        },
    };

    d.addEventListener('click', function(t) {
        let k,
            e,
            a = t && t.target;
        if ((a = _closest(a, '[data-handler]'))) {
            const r = a.getAttribute('data-handler').split(/\s+/);
            if (a.tagName == 'A' && (t.metaKey || t.shiftKey || t.ctrlKey || t.altKey)) return;
            for (e = 0; e < r.length; e++) {
                k = r[e].split(/[\(\)]/);
                handlers[k[0]] && handlers[k[0]].call(a, t, k[1]);
            }
        }
    });

    const scrollers = [];
    w.addEventListener(
        'scroll',
        function() {
            requestAnimationFrame(function() {
                for (let l = 0; l < scrollers.length; l++) scrollers[l].el && scrollers[l].fn.call(scrollers[l].el);
            });
        },
        !1,
    );

    const _scrollTo = function(n, o) {
        var e,
            i = window.pageYOffset,
            t = window.pageYOffset + n.getBoundingClientRect().top,
            r =
                (document.body.scrollHeight - t < window.innerHeight
                    ? document.body.scrollHeight - window.innerHeight
                    : t) - i,
            w = function(n) {
                return n < 0.5 ? 4 * n * n * n : (n - 1) * (2 * n - 2) * (2 * n - 2) + 1;
            },
            o = o || 1e3;
        r &&
            window.requestAnimationFrame(function n(t) {
                e || (e = t);
                let d = t - e,
                    a = Math.min(d / o, 1);
                (a = w(a)), window.scrollTo(0, i + r * a), d < o && window.requestAnimationFrame(n);
            });
    };

    var _decorate = function() {
        let k,
            i,
            j,
            decoratorString,
            el,
            els = d.querySelectorAll('[data-decorator]');
        for (i = 0; i < els.length; i++) {
            for (
                decoratorString = (el = els[i]).getAttribute('data-decorator').split(/\s+/), j = 0;
                j < decoratorString.length;
                j++
            ) {
                k = decoratorString[j].split(/[\(\)]/);
                decorators[k[0]] && decorators[k[0]].call(el, k[1]);
                el.removeAttribute('data-decorator');
            }
        }
    };

    var _closest = function(e, t) {
        let ms = 'MatchesSelector',
            c;
        ['matches', 'webkit' + ms, 'moz' + ms, 'ms' + ms, 'o' + ms].some(function(e) {
            return typeof document.body[e] == 'function' && ((c = e), !0);
        });
        let r = e;
        try {
            for (; e; ) {
                if (r && r[c](t)) return r;
                e = r = e.parentElement;
            }
        } catch (e) {}

        return null;
    };

    const _isInt = function(value) {
        return (
            !isNaN(value) &&
            (function(x) {
                return (x | 0) === x;
            })(parseFloat(value))
        );
    };
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function _serialize(form) {
        if (!form || form.nodeName !== 'FORM') {
            return;
        }
        let i,
            j,
            q = [];
        for (i = form.elements.length - 1; i >= 0; i = i - 1) {
            if (form.elements[i].name === '') {
                continue;
            }
            switch (form.elements[i].nodeName) {
                case 'INPUT':
                    switch (form.elements[i].type) {
                        case 'text':
                        case 'hidden':
                        case 'password':
                        case 'button':
                        case 'reset':
                        case 'submit':
                            q.push(form.elements[i].name + '=' + encodeURIComponent(form.elements[i].value));
                            break;
                        case 'checkbox':
                        case 'radio':
                            if (form.elements[i].checked) {
                                q.push(form.elements[i].name + '=' + encodeURIComponent(form.elements[i].value));
                            }
                            break;
                        case 'file':
                            break;
                    }
                    break;
                case 'TEXTAREA':
                    q.push(form.elements[i].name + '=' + encodeURIComponent(form.elements[i].value));
                    break;
                case 'SELECT':
                    switch (form.elements[i].type) {
                        case 'select-one':
                            q.push(form.elements[i].name + '=' + encodeURIComponent(form.elements[i].value));
                            break;
                        case 'select-multiple':
                            for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) {
                                if (form.elements[i].options[j].selected) {
                                    q.push(
                                        form.elements[i].name +
                                            '=' +
                                            encodeURIComponent(form.elements[i].options[j].value),
                                    );
                                }
                            }
                            break;
                    }
                    break;
                case 'BUTTON':
                    switch (form.elements[i].type) {
                        case 'reset':
                        case 'submit':
                        case 'button':
                            q.push(form.elements[i].name + '=' + encodeURIComponent(form.elements[i].value));
                            break;
                    }
                    break;
            }
        }

        return q.join('&');
    }

    _decorate();
})(window, document.documentElement);
