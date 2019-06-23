!function (w, d) {

  var handlers = {
    'remove-voorkeur': function(e){
        var voorkeur = _closest(this, '.PlaatsvoorkeurenForm__list-item'),
            container = _closest(this, '.PlaatsvoorkeurenForm__list'),
            _resetCopy = function(){
                var i,
                    plaatsSetsList = container.querySelectorAll('.PlaatsvoorkeurenForm__list-item'),
                    plaatsSetsListArray = Array.prototype.slice.call(plaatsSetsList).sort(function(a, b){return b.style.order - a.style.order});
                for (i = 0;i < plaatsSetsListArray.length; i++){
                    plaatsSetsListArray[i].querySelector('.PlaatsvoorkeurenForm__list-item__heading').textContent = (i + 1) + 'e keuze';
                }
            };
        voorkeur.parentNode.removeChild(voorkeur);
        _resetCopy();
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
    },
    'add-voorkeur': function(e){
        var prototype = _closest(this, '.PlaatsvoorkeurenForm__list-item'),
            voorkeurContainer = _closest(this, '.PlaatsvoorkeurenForm__list'),
            newVoorkeur = prototype.cloneNode(true),
            i,
            _resetPrototype = function(prototype){

            },
            _addNew = function(voorkeur){
                var selects = voorkeur.querySelectorAll('select');
                voorkeurContainer.appendChild(voorkeur);
                for(i = 0; i < selects.length; i++){
                    selects[i].setAttribute('name', selects[i].dataset.name);
                    selects[i].setAttribute('id', selects[i].dataset.id);
                }
                voorkeur.classList.add('PlaatsvoorkeurenForm__list-item--sortable');
            },
            _setPrioroty = function () {

            }

        _resetPrototype(prototype);
        _addNew(newVoorkeur);
        _setPrioroty();

        console.log(prototype);
        console.log(voorkeurContainer);
        console.log(newVoorkeur);


    },
  };

  var decorators = {
      'plaatsvoorkeur-prototype': function(){
          var self = this,
              plaatsSets = this.querySelectorAll('.PlaatsvoorkeurenForm__list-item'),
              form = _closest(this, 'form'),
              marktId = this.dataset.marktId,
              usedPlaatsen = this.dataset.usedPlaatsen,
              count = this.dataset.plaatsvoorkeurCount,
              plaatsenApi = '/api/0.0.1/markt/'+marktId+'/plaats-count/'+count+'/?' + usedPlaatsen,
              timeout,
              _getSelects = function(){
                return self.querySelectorAll('select');
              }
              _updateFirstSelect = function(data){
                var value = _getSelects()[0].value, i, j, selects = _getSelects();
                while (selects[0].firstChild) {
                    selects[0].removeChild(selects[0].firstChild);
                }
                for (i = 0; i < data.length; i++){
                    for (j = 0; j < data[i].length; j++){
                        selects[0].add(_createOption(data[i][j].plaatsId));
                    }
                }
              }
              _init = function(){
                  var i, selects = _getSelects();
                  helpers.simpleAjax(plaatsenApi ,function(response){
                        if (response.status >= 200 && response.status < 400) {
                            _updateFirstSelect(JSON.parse(response.response));
                        }
                  })
                  for(i = 0; i < selects.length; i++){
                      _setSelectDisabledState(selects[i], i !== 0);
                  }
                  form.addEventListener('change', function(e){
                    _getData(e.target);
                  });
              },
              _nextSelect = function(select) {
                var selectArray = Array.prototype.slice.call(_getSelects()),
                    next = selectArray[selectArray.indexOf(select) + 1];
                    if (next)
                        return next;
                    return;

              },
              _getSelectsData = function(select){
                var selects = _getSelects(),
                    a = [], i;
                for(i = 0; i < selects.length; i++){
                    if (selects[i].value){
                        a.push(selects[i].value);
                    }
                    if(selects[i] === select){
                        i = select.length+1;
                    }
                }
                return a;
              },
              _getEnableSave = function(){
                var selects = _getSelects(), i;
                for(i = 0; i < selects.length; i++){
                    selects[i].setAttribute('name', selects[i].dataset.name);
                    selects[i].setAttribute('id', selects[i].dataset.id);
                }
              },
              _getData = function(select){
                    var next = _nextSelect(select),
                        plaatsIds = _getSelectsData(select).join('-');
                    // console.log(_getSelectsData(select));
                  helpers.simpleAjax('/api/0.0.1/markt/' + marktId + '/plaats/'+plaatsIds ,function(response){
                        if (response.status >= 200 && response.status < 400) {
                            _updateSelects(select, JSON.parse(response.response));
                            if (next){
                                _getData(next);
                            }else{
                                _getEnableSave(select);
                            }
                        }
                  })
              },
              _setSelectDisabledState = function(select, disabled){
                  disabled ? select.setAttribute('disabled', 'disabled') : select.removeAttribute('disabled');
                  _closest(select, '.Select__wrapper').classList[disabled ? 'add' : 'remove']('Select__wrapper--disabled');
              },
              _createOption = function(value){
                var option = document.createElement('option');
                option.setAttribute('value', value);
                option.text = value;
                return option;
              },
              _updateSelects = function(elem, data) {
                var selects = _getSelects(),
                    disable = false,
                    nextSelect,
                    i, j;

                for (i = 0; i < selects.length; i++){
                    if (selects[i+1] && elem === selects[i]){
                        nextSelect = selects[i+1];
                        i++;
                        disable = true;
                    }
                    _setSelectDisabledState(selects[i], disable);
                }
                if(nextSelect){
                    _setSelectDisabledState(nextSelect, false);
                    while (nextSelect.firstChild) {
                        nextSelect.removeChild(nextSelect.firstChild);
                    }
                    for (j = 0; j < data.length; j++){
                        nextSelect.add(_createOption(data[j]));
                    }
                }
              };
          _init();
      },
      'voorkeur-form': function(){
          var plaatsSets = this.querySelectorAll('.PlaatsvoorkeurenForm__list-item'),
              timeout,
              _init = function(){
                  var i;
                  for(i = 0; i < plaatsSets.length; i++){
                      _setSelectDisabledState(plaatsSets[i].querySelector('select'), false);
                  }
              },
              _nextSelect = function(select) {
                var selectContainer = _closest(select, '.PlaatsvoorkeurenForm__list-item').querySelectorAll('select'),
                    elemArray = Array.prototype.slice.call(selectContainer);
                    if (elemArray[elemArray.indexOf(select) + 1])
                        return elemArray[elemArray.indexOf(select) + 1];
                    return;

              },
              _getSelectsData = function(select){
                var selects = _closest(select, '.PlaatsvoorkeurenForm__list-item').querySelectorAll('select'),
                    a = [], i;
                for(i = 0; i < selects.length; i++){
                    if (selects[i].value){
                        a.push(selects[i].value);
                    }
                    if(selects[i] === select){
                        i = select.length+1;
                    }
                }
                return a;
              },
              _getEnableSave = function(select){
                var selects = _closest(select, '.PlaatsvoorkeurenForm__list-item').querySelectorAll('select'), i;
                for(i = 0; i < selects.length; i++){
                    selects[i].setAttribute('name', selects[i].dataset.name);
                    selects[i].setAttribute('id', selects[i].dataset.id);
                }
              },
              _getData = function(select){
                    var marktId = _closest(select, '[data-markt-id]').dataset.marktId,
                        next = _nextSelect(select),
                        plaatsIds = _getSelectsData(select).join('-');
                    // console.log(_getSelectsData(select));
                  helpers.simpleAjax('/api/0.0.1/markt/' + marktId + '/plaats/'+plaatsIds ,function(response){
                        if (response.status >= 200 && response.status < 400) {
                            _updateSelects(select, JSON.parse(response.response));
                            if (next){
                                _getData(next);
                            }else{
                                _getEnableSave(select);
                            }
                        }
                  })
              },
              _setSelectDisabledState = function(select, disabled){
                  disabled ? select.setAttribute('disabled', 'disabled') : select.removeAttribute('disabled');
                  _closest(select, '.Select__wrapper').classList[disabled ? 'add' : 'remove']('Select__wrapper--disabled');
              },
              _createOption = function(value){
                var option = document.createElement('option');
                option.setAttribute('value', value);
                option.text = value;
                return option;
              },
              _updateSelects = function(elem, data) {
                var plaatsSet = _closest(elem, '.PlaatsvoorkeurenForm__list-item'),
                    selects = plaatsSet.querySelectorAll('select'),
                    disable = false,
                    nextSelect,
                    i, j;

                for (i = 0; i < selects.length; i++){
                    if (selects[i+1] && elem === selects[i]){
                        nextSelect = selects[i+1];
                        i++;
                        disable = true;
                    }
                    _setSelectDisabledState(selects[i], disable);
                }
                if(nextSelect){
                    _setSelectDisabledState(nextSelect, false);
                    while (nextSelect.firstChild) {
                        nextSelect.removeChild(nextSelect.firstChild);
                    }
                    for (j = 0; j < data.length; j++){
                        nextSelect.add(_createOption(data[j]));
                    }
                }
              };
          this.addEventListener('change', function(e){
            _getData(e.target);
          });
          _init();
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
