import Sortable from 'sortablejs';

if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj, start) {
    for (var i = (start || 0), j = this.length; i < j; i += 1) {
      if (this[i] === obj) { return i; }
    }
    return -1;
  }
}
Array.prototype.unique = function () {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j])
        a.splice(j--, 1);
    }
  }

  return a;
};
Array.prototype.remove = function () {
  var what, a = arguments, L = a.length, ax;
  while (L && this.length) {
    what = a[--L];
    while ((ax = this.indexOf(what)) !== -1) {
      this.splice(ax, 1);
    }
  }
  return this;
};

var splitArrayByGap = function (orgArr) {
  var arr = [[]],
    i;
  for (i = 0; i < orgArr.length; i++) {
    arr[arr.length - 1].push(orgArr[i]);
    if (orgArr.indexOf(orgArr[i] + 1) === -1 && i < orgArr.length - 1) {
      arr.push([]);
    }
  }
  return arr;
};
var splitArrayByIndexes = function (orgArr, indexes) {
  var arr = [[]], i;
  for (i = 0; i < orgArr.length; i++) {
    var currentIndex = orgArr.indexOf(orgArr[i]);
    for (j = 0; j < indexes.length; j++) {
      if (currentIndex === indexes[j]) {
        arr.push([]);
      }
    }
    arr[arr.length - 1].push(orgArr[i]);
    if (orgArr.indexOf(orgArr[i] + 1) === -1 && i < orgArr.length - 1) {
      arr.push([]);
    }
  }
  return arr;
};
function topscore(arr, top) {
  var current = null, cnt = 0, out = [];
  arr = arr.sort();
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] != current) {
      if (cnt >= top) {
        out.push(arr[i - 1]);
      }
      current = arr[i];
      cnt = 1;
    } else {
      cnt++;
    }
  }
  return out;
}

function splitByArray(orgArr, valueArr) {
  var newArr = [[]],
    i;
  for (i = 0; i < orgArr.length; i++) {
    if (valueArr.indexOf(orgArr[i]) !== -1) {
      newArr.push([]);
    } else {
      newArr[newArr.length - 1].push(orgArr[i]);
    }
  }
  newArr = newArr.filter(function (i) {
    return i.length;
  });
  return newArr;
}


!function (w, d) {

  var handlers = {
    'remove-voorkeur': function (e) {
      e.stopPropagation();
      var voorkeur = _closest(this, '.Draggable-list-item');
      var form = _closest(this, 'form');
      e && e.preventDefault();
      voorkeur.remove();
      helpers.trigger(form, 'submit');
    },
  };

  var decorators = {
    'aanwezigheid-form': function () {
      var form = this,
        body = _closest(this, 'body'),
        redirectTo = './?error=aanwezigheid-saved',
        _getFormData = function () {
          var out = [],
            hiddenFields = form.querySelectorAll('input[name*="[marktId]"], input[name*="[marktDate]"], input[name*="[attending]"]:checked');
          for (var i = 0; i < hiddenFields.length; i++) {
            out.push(encodeURIComponent(hiddenFields[i].getAttribute('name')) + '=' + encodeURIComponent(hiddenFields[i].value))
          }
          out.push(encodeURIComponent('next') + '=' + encodeURIComponent(redirectTo));

          return out.join('&').replace(/%20/g, '+');;
        },
        _process = function (data, selector) {
          var div = document.createElement('html');
          div.innerHTML = data;
          var
            result = div.querySelectorAll(selector),
            target = document.querySelectorAll(selector);
          if (result.length && target.length) {
            for (var i = 0; i < target.length; i++) {
              target[i].innerHTML = result[i].innerHTML;
            }
          }
          _decorate();
          body.classList.remove('in-progress');
        },
        _addAlert = function (alertText) {
          var base = document.createElement('div');
          base.classList.add('Alert');
          base.textContent = alertText;
          body.appendChild(base);
        },
        _formChange = function (e) {
          if (e) {
            _submit();
          }
        },
        _submit = function (e) {
          if (e && e.x !== 0) {
            return;
          }
          _addAlert('Bezig met bewaren');
          body.classList.add('in-progress');

          form.request = helpers.ajax({
            type: form.method,
            url: form.action,
            data: _getFormData(),
            form: form,
            headers: [
              ["Content-Type", "application/x-www-form-urlencoded"]
            ],
            callback: function (data) {
              _process(data, form.dataset.resultSelector || 'body');
            },
            error: function () {
              console.log('error');
              body.classList.remove('in-progress');
              form.classList.add('ajax-error');
              _decorate();
            }
          });
        },
        _init = function () {
        };
      _init();
      form.addEventListener('change', _formChange);
      form.addEventListener('submit', _submit);
    },
    'voorkeur-form': function () {
      var form = this,
        body = _closest(this, 'body'),
        plaatsvoorkeurenList = form.querySelectorAll('.PlaatsvoorkeurenForm__list')[0],
        redirectTo = './?error=plaatsvoorkeuren-saved',
        _submit = function (e) {
          if (e && e.x !== 0) {
            return;
          }
          _addAlert('Bezig met bewaren');
          body.classList.add('in-progress');

          form.request = helpers.ajax({
            type: form.method,
            url: form.action,
            data: _getFormData(),
            form: form,
            headers: [["Content-Type", "application/x-www-form-urlencoded"]],
            callback: function (data) {
              _process(data, form.dataset.resultSelector || 'body');
            },
            error: function () {
              console.log('error');
              body.classList.remove('in-progress');
              form.classList.add('ajax-error');
              _decorate();
            }
          });
        },
        _getFormData = function () {
          var out = [],
          plaatsvoorkeuren = form.querySelectorAll('#plaatsvoorkeuren-list-item'),
            erkenningsNummer = form.querySelector('[name="erkenningsNummer"]').value,
            minimum = form.querySelector('[name="minimum"]:checked').value,
            extra = form.querySelector('[name="extra-count"]:checked').value,
            maximum = parseInt(minimum, 10) + parseInt(extra, 10),
            anywhere = form.querySelector('[name="anywhere"]:checked') && form.querySelector('[name="anywhere"]:checked').value;
          out.push(encodeURIComponent('erkenningsNummer') + '=' + encodeURIComponent(erkenningsNummer));
          out.push(encodeURIComponent('redirectTo') + '=' + encodeURIComponent(redirectTo));
          anywhere && out.push(encodeURIComponent('anywhere') + '=' + encodeURIComponent(anywhere));
          out.push(encodeURIComponent('minimum') + '=' + encodeURIComponent(minimum));
          out.push(encodeURIComponent('maximum') + '=' + encodeURIComponent(maximum));
          plaatsvoorkeuren = Array.from(plaatsvoorkeuren).filter(item => {
            let plaatsId = item.querySelector('[name*="plaatsId"]');
            return plaatsId.value;
          });
          for (var i = 0; i < plaatsvoorkeuren.length; i++) {
            var
              plaatsId = plaatsvoorkeuren[i].querySelector('[name*="plaatsId"]'),
              priority = plaatsvoorkeuren[i].querySelector('[name*="priority"]'),
              marktId = plaatsvoorkeuren[i].querySelector('[name*="marktId"]');
            if (priority) {
              out.push(encodeURIComponent(plaatsId.getAttribute('name')) + '=' + encodeURIComponent(plaatsId.value));
              out.push(encodeURIComponent(priority.getAttribute('name')) + '=' + (plaatsvoorkeuren.length - i));
              out.push(encodeURIComponent(marktId.getAttribute('name')) + '=' + encodeURIComponent(marktId.value));
            }
          }
          return out.join('&').replace(/%20/g, '+');;
        },
        _addAlert = function (alertText) {
          var base = document.createElement('div');
          base.classList.add('Alert');
          base.textContent = alertText;
          body.appendChild(base);
        },
        _process = function (data, selector) {
          var div = document.createElement('html');
          div.innerHTML = data;
          var
            result = div.querySelectorAll(selector),
            target = document.querySelectorAll(selector);
          if (result.length && target.length) {
            for (var i = 0; i < target.length; i++) {
              target[i].innerHTML = result[i].innerHTML;
            }
          }
          _decorate();
          body.classList.remove('in-progress');
        },
        _formChange = function (e) {
          if (e) {
            _submit();
          }
        },
        _init = function () {

          function onEnd(evt) {
            _submit();
            _formChange();
          };

          if (plaatsvoorkeurenList) {
            Sortable.create(plaatsvoorkeurenList, {
              animation: 150,
              easing: "cubic-bezier(1, 0, 0, 1)",
              handle: ".Draggable-list-item__handle",
              onEnd,
            });
          }

          var minimumElements = form.querySelectorAll('[name="minimum"]');
          for (var i = 0; i < minimumElements.length; i++) {
            var minimumEl = minimumElements[i];
            minimumEl.addEventListener('change', _formChange);
          }
          var extraElements = form.querySelectorAll('[name="extra-count"]');
          for (var i = 0; i < extraElements.length; i++) {
            var extraElement = extraElements[i];
            extraElement.addEventListener('change', _formChange);
          }

          var selectNew = form.querySelectorAll('.Select--MarktplaatsSelect')[0];
          if (selectNew) {
            selectNew.addEventListener('change', _formChange);
          }

          var selectAnywhere = form.querySelectorAll('#anywhere')[0];
          if (selectAnywhere) {
            selectAnywhere.addEventListener('change', _formChange);
          }

        }
      _init();
      // form.addEventListener('change', _formChange);
      form.addEventListener('submit', _submit);
    },
  };
  var helpers = {
    'ajax': function (options) {
      var request = new XMLHttpRequest(),
        headers = options.headers || [],
        form = options.form || null,
        i;
      var tokenEl = form ? form.querySelector('input[name="_csrf"]') : null;
      if (tokenEl) {
        var token = tokenEl.value;
        headers.push(["CSRF-Token", token])
      }
      request.open(options.type, options.url, true);
      for (i = 0; i < headers.length; i++) {
        request.setRequestHeader(headers[i][0], headers[i][1]);
      }
      request.onreadystatechange = function () {
        if (request.readyState == 4) {
          if (request.status >= 200 && request.status < 400) {
            //fixme: beter login page check
            if (request.responseText.indexOf('id="kc-') >= 0) {
              location.reload();
            } else if (options.callback && typeof (options.callback) == 'function') {
              options.callback.call(request, request.responseText);
            }
          } else {
            if (options.error && typeof (options.error) == 'function') {
              options.error.call(request, request.responseText);
            }
          }
          _decorate();
        }
      };

      request.send(options.data);

      return request;
    },
    'simpleAjax': function (url, callback) {
      var request = new XMLHttpRequest();

      request.open('GET', url, true);
      request.onload = function () {
        callback(request);
      }

      request.send();

    },
    'isInArray': function (value, array) {
      return array.indexOf(value) > -1;
    },
    'isJson': function (str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    },
    'trigger': function (el, eventType) {
      var e = document.createEvent('MouseEvents');
      e.initMouseEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      el.dispatchEvent(e);
    },

    'convertDataURI': function (dataURI) {
      var
        marker = ';base64,',
        base64Index = dataURI.indexOf(marker) + marker.length,
        base64 = dataURI.substring(base64Index),
        raw = w.atob(base64),
        rawLength = raw.length,
        array = new Uint8Array(new ArrayBuffer(rawLength));

      for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }

      return array;
    }


  };

  d.addEventListener('click', function (t) { var k, e, a = t && t.target; if (a = _closest(a, '[data-handler]')) { var r = a.getAttribute('data-handler').split(/\s+/); if ('A' == a.tagName && (t.metaKey || t.shiftKey || t.ctrlKey || t.altKey)) return; for (e = 0; e < r.length; e++) { k = r[e].split(/[\(\)]/); handlers[k[0]] && handlers[k[0]].call(a, t, k[1]) } } });


  var scrollers = []; w.addEventListener('scroll', function () { requestAnimationFrame(function () { for (var l = 0; l < scrollers.length; l++)scrollers[l].el && scrollers[l].fn.call(scrollers[l].el) }) }, !1);

  var _scrollTo = function (n, o) { var e, i = window.pageYOffset, t = window.pageYOffset + n.getBoundingClientRect().top, r = (document.body.scrollHeight - t < window.innerHeight ? document.body.scrollHeight - window.innerHeight : t) - i, w = function (n) { return n < .5 ? 4 * n * n * n : (n - 1) * (2 * n - 2) * (2 * n - 2) + 1 }, o = o || 1e3; r && window.requestAnimationFrame(function n(t) { e || (e = t); var d = t - e, a = Math.min(d / o, 1); a = w(a), window.scrollTo(0, i + r * a), d < o && window.requestAnimationFrame(n) }) };

  var _decorate = function () { var k, i, j, decoratorString, el, els = d.querySelectorAll('[data-decorator]'); for (i = 0; i < els.length; i++) { for (decoratorString = (el = els[i]).getAttribute('data-decorator').split(/\s+/), j = 0; j < decoratorString.length; j++) { k = decoratorString[j].split(/[\(\)]/); decorators[k[0]] && decorators[k[0]].call(el, k[1]); el.removeAttribute('data-decorator') } } };

  var _closest = function (e, t) { var ms = 'MatchesSelector', c;['matches', 'webkit' + ms, 'moz' + ms, 'ms' + ms, 'o' + ms].some(function (e) { return 'function' == typeof document.body[e] && (c = e, !0) }); var r = e; try { for (; e;) { if (r && r[c](t)) return r; e = r = e.parentElement } } catch (e) { } return null };

  function _serialize(form) { if (!form || form.nodeName !== "FORM") { return } var i, j, q = []; for (i = form.elements.length - 1; i >= 0; i = i - 1) { if (form.elements[i].name === "") { continue } switch (form.elements[i].nodeName) { case "INPUT": switch (form.elements[i].type) { case "text": case "hidden": case "password": case "button": case "reset": case "submit": q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value)); break; case "checkbox": case "radio": if (form.elements[i].checked) { q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value)) } break; case "file": break }break; case "TEXTAREA": q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value)); break; case "SELECT": switch (form.elements[i].type) { case "select-one": q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value)); break; case "select-multiple": for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) { if (form.elements[i].options[j].selected) { q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].options[j].value)) } } break }break; case "BUTTON": switch (form.elements[i].type) { case "reset": case "submit": case "button": q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value)); break }break } } return q.join("&") };

  _decorate();

  var domain = location.domain;

}(window, document.documentElement);
