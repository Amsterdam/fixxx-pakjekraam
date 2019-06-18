!function (w, d) {

  var handlers = {
    'remove-voorkeur': function(e){
        var voorkeur = _closest(this, '.PlaatsvoorkeurenForm__list-item');
        voorkeur.parentNode.removeChild(voorkeur);
    },
    'move-voorkeur': function(e){
        var voorkeur = _closest(this, '.PlaatsvoorkeurenForm__list-item'),
            priority = voorkeur.querySelector('input[name*="[priority]"]').value,
            all = voorkeur.parentNode.querySelectorAll('.PlaatsvoorkeurenForm__list-item.PlaatsvoorkeurenForm__list-item--sortable'),
            nodes = Array.prototype.slice.call(all).sort(function(a, b){return b.style.order - a.style.order}),
            index = nodes.indexOf(voorkeur),
            next = nodes[this.dataset.direction === 'up' ? index-1 : index+1];

        if (next) {
            voorkeur.querySelector('input[name*="[priority]"]').value = next.querySelector('input[name*="[priority]"]').value;
            voorkeur.style.order = next.querySelector('input[name*="[priority]"]').value;
            next.querySelector('input[name*="[priority]"]').value = priority;
            next.style.order = priority;
        }
    }
  };

  var decorators = {
      'voorkeur-form': function(){
          var _createOption = function(value){
                var option = document.createElement('option');
                option.setAttribute('value', value);
                option.text = value;
                return option;
              },
              _updateSelects = function(elem, data) {
                var container = _closest(elem, '.PlaatsvoorkeurenForm__list-item'),
                    selects = container.querySelectorAll('select'),
                    i, j, newValues = [];
                for (i = 0; i < selects.length; i++){
                    console.log(selects[i].value);
                    for (j = 0 && selects[i].value; j < data.length; j++){
                        selects[i].value !== data[j] && !helpers.isInArray(data[j], newValues) && newValues.push(data[j]);
                    }
                }
                console.log(newValues);
                for (i = 0; i < selects.length; i++){
                    if (!selects[i].value){
                        while (selects[i].firstChild) {
                            selects[i].removeChild(selects[i].firstChild);
                        }
                        for (j = 0; j < newValues.length; j++){
                            selects[i].add(_createOption(newValues[j]));
                        }
                    }
                }
              };
          this.addEventListener('change', function(e){
                  helpers.simpleAjax('/api/0.0.1/markt/33/plaats/'+e.target.value ,function(response){
                        if (response.status >= 200 && response.status < 400) {
                            _updateSelects(e.target, JSON.parse(response.response));
                        }
                  })

          });
      }
  };
  var helpers = {
    'ajax': function (options) {
      var request = new XMLHttpRequest(),
        headers = options.headers || [],
        i;
      request.open(options.type, options.url, true);
      for (i = 0; i < headers.length; i++){
        request.setRequestHeader(headers[i][0], headers[i][1]);
      }
      request.onreadystatechange = function () {
        if (request.readyState == 4) {
          if (request.status >= 200 && request.status < 400) {
            if (options.callback && typeof (options.callback) == 'function') {
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
    'simpleAjax': function(url, callback){
      var request = new XMLHttpRequest();

      request.open('GET', url, true);
      request.onload = function() {
        callback(request);
      }

      request.send();

    },
    'isInArray': function(value, array) {
        return array.indexOf(value) > -1;
    },
    'isJson': function(str){
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

  d.addEventListener('click',function(t){var k,e,a=t&&t.target;if(a=_closest(a,'[data-handler]')){var r=a.getAttribute('data-handler').split(/\s+/);if('A'==a.tagName&&(t.metaKey||t.shiftKey||t.ctrlKey||t.altKey))return;for(e=0;e<r.length;e++){k=r[e].split(/[\(\)]/);handlers[k[0]]&&handlers[k[0]].call(a,t,k[1])}}});


  var scrollers=[];w.addEventListener('scroll',function(){requestAnimationFrame(function(){for(var l=0;l<scrollers.length;l++)scrollers[l].el&&scrollers[l].fn.call(scrollers[l].el)})},!1);

  var _scrollTo=function(n,o){var e,i=window.pageYOffset,t=window.pageYOffset+n.getBoundingClientRect().top,r=(document.body.scrollHeight-t<window.innerHeight?document.body.scrollHeight-window.innerHeight:t)-i,w=function(n){return n<.5?4*n*n*n:(n-1)*(2*n-2)*(2*n-2)+1},o=o||1e3;r&&window.requestAnimationFrame(function n(t){e||(e=t);var d=t-e,a=Math.min(d/o,1);a=w(a),window.scrollTo(0,i+r*a),d<o&&window.requestAnimationFrame(n)})};

  var _decorate = function(){var k,i,j,decoratorString,el,els=d.querySelectorAll('[data-decorator]');for(i=0;i<els.length;i++){for(decoratorString=(el=els[i]).getAttribute('data-decorator').split(/\s+/),j=0;j<decoratorString.length;j++){k=decoratorString[j].split(/[\(\)]/);decorators[k[0]]&&decorators[k[0]].call(el,k[1]);el.removeAttribute('data-decorator')}}};

  var _closest=function(e,t){var ms='MatchesSelector',c;['matches','webkit'+ms,'moz'+ms,'ms'+ms,'o'+ms].some(function(e){return'function'==typeof document.body[e]&&(c=e,!0)});var r=e;try{for(;e;){if(r&&r[c](t))return r;e=r=e.parentElement}}catch(e){}return null};

  function _serialize(form){if(!form||form.nodeName!=="FORM"){return }var i,j,q=[];for(i=form.elements.length-1;i>=0;i=i-1){if(form.elements[i].name===""){continue}switch(form.elements[i].nodeName){case"INPUT":switch(form.elements[i].type){case"text":case"hidden":case"password":case"button":case"reset":case"submit":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"checkbox":case"radio":if(form.elements[i].checked){q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value))}break;case"file":break}break;case"TEXTAREA":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"SELECT":switch(form.elements[i].type){case"select-one":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break;case"select-multiple":for(j=form.elements[i].options.length-1;j>=0;j=j-1){if(form.elements[i].options[j].selected){q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].options[j].value))}}break}break;case"BUTTON":switch(form.elements[i].type){case"reset":case"submit":case"button":q.push(form.elements[i].name+"="+encodeURIComponent(form.elements[i].value));break}break}}return q.join("&")};


  _decorate();



}(window, document.documentElement);
