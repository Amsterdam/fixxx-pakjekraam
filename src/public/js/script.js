if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
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
if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun /*, thisp*/) {
    var len = this.length >>> 0;
    if (typeof fun != "function")
    throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in this) {
        var val = this[i];
        if (fun.call(thisp, val, i, this))
        res.push(val);
      }
    }
    return res;
  };
}
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(obj, start) {
    for (var i = (start || 0), j = this.length; i < j; i += 1) {
      if (this[i] === obj) { return i; }
    }
    return -1;
  }
}
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};
Array.prototype.remove = function() {
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
        for (j = 0; j < indexes.length; j++){
            if (currentIndex === indexes[j]){
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
    var out = {}, outArr = [];
    for (var i = 0; i < arr.length; i++) {
        if (!out[arr[i]]){
            out[arr[i]] = 0
        }
        out[arr[i]]++;
    }
    for (var k in out){
        if (out.hasOwnProperty(k)){
            (out[k] === top) && outArr.push(k);
        }
    }
    return outArr;
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
    'remove-voorkeur': function(e){
        var voorkeur = _closest(this, '.PlaatsvoorkeurenForm__list-item'),
            plaatsIdsInputs = voorkeur.querySelectorAll('[name*="[plaatsId]"]'),
            container = _closest(this, '.PlaatsvoorkeurenForm__list'),
            items = container.querySelectorAll('.PlaatsvoorkeurenForm__list-item'),
            prototype = _closest(this, '.PlaatsvoorkeurenForm__markt').querySelector('.PlaatsvoorkeurenForm__prototype'),
            prototypeHeading = _closest(this, '.PlaatsvoorkeurenForm__markt').querySelector('.PlaatsvoorkeurenForm__prototype .PlaatsvoorkeurenForm__list-item__heading'),
            _resetCopy = function(){
                var i,
                    plaatsSetsList = container.querySelectorAll('.PlaatsvoorkeurenForm__list-item'),
                    plaatsSetsListArray = Array.prototype.slice.call(plaatsSetsList).sort(function(a, b){return b.style.order - a.style.order});
                for (i = 0;i < plaatsSetsListArray.length; i++){
                    plaatsSetsListArray[i].querySelector('.PlaatsvoorkeurenForm__list-item__heading').textContent = (i + 1) + 'e keuze';
                }
                prototypeHeading.textContent = (i + 1) + 'e keuze';
            };
        e && e.preventDefault();
        var arr = [];
        for (var i = 0; i < plaatsIdsInputs.length; i++){
            arr.push(String(plaatsIdsInputs[i].value));
        }
        for (i = 0; i < plaatsenSets.length; i++){
            if (arr.sort().join('-') === plaatsenSets[i].sort().join('-')){
                break;
            }
        }
        plaatsenSets.splice(i, 1);
        voorkeur.parentNode.removeChild(voorkeur);
        _resetCopy();

        decorators['plaatsvoorkeur-prototype'].call(prototype);
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
    'remove-plaats': function(e){
        var self = this,
            prototype = _closest(self, '.PlaatsvoorkeurenForm__prototype'),
            wrappers = prototype.querySelectorAll('.PlaatsvoorkeurenForm__list-item__wrapper');
        e && e.preventDefault();
        wrappers[wrappers.length - 1].parentNode.removeChild(wrappers[wrappers.length - 1]);
        decorators['plaatsvoorkeur-prototype'].call(prototype);
    },
    'add-plaats': function(e){
        var self = this,
            newWrapper = document.createElement('div'),
            newSelectWrapper = document.createElement('div'),
            prioInput = document.createElement('input'),
            marktInput = document.createElement('input'),
            plaatsIdSelect = document.createElement('select'),
            prototype = _closest(self, '.PlaatsvoorkeurenForm__prototype'),
            wrapper = _closest(self, '.PlaatsvoorkeurenForm__list__tools'),
            list = prototype.querySelector('.PlaatsvoorkeurenForm__list'),
            selectsCount = prototype.querySelectorAll('select').length,
            marktId = prototype.dataset.marktId;
            selectId = parseInt(prototype.dataset.selectBaseId) + selectsCount;
        e && e.preventDefault();

        newWrapper.classList.add('PlaatsvoorkeurenForm__list-item__wrapper');
        newSelectWrapper.classList.add('Select__wrapper');
        newSelectWrapper.classList.add('Select__wrapper--MarktplaatsSelect');
        prioInput.setAttribute('type', 'hidden');
        prioInput.setAttribute('name', 'plaatsvoorkeuren['+selectId+'][priority]');
        prioInput.setAttribute('value', 2);
        marktInput.setAttribute('type', 'hidden');
        marktInput.setAttribute('name', 'plaatsvoorkeuren['+selectId+'][marktId]');
        marktInput.setAttribute('value', marktId);
        plaatsIdSelect.setAttribute('data-name', 'plaatsvoorkeuren['+selectId+'][plaatsId]');
        plaatsIdSelect.setAttribute('data-id', 'voorkeur-'+selectId);
        plaatsIdSelect.classList.add('Select');
        plaatsIdSelect.classList.add('Select--MarktplaatsSelect');

        newSelectWrapper.appendChild(plaatsIdSelect);
        newWrapper.appendChild(prioInput);
        newWrapper.appendChild(marktInput);
        newWrapper.appendChild(newSelectWrapper);

        wrapper.parentNode.insertBefore(newWrapper, wrapper);


        decorators['plaatsvoorkeur-prototype'].call(prototype);
    }
  };

  var decorators = {
      'plaatsvoorkeur-prototype': function(){
          var self = this,
              removeBtn = this.querySelector('.PlaatsvoorkeurenForm__remove-wrapper'),
              addBtn = this.querySelector('.PlaatsvoorkeurenForm__add-wrapper'),
              form = _closest(this, 'form'),
              marktId = this.dataset.marktId,
              usedPlaatsen = this.dataset.usedPlaatsen,
              count = this.dataset.plaatsvoorkeurCount,
              maxUitbreidingen = this.dataset.maxUitbreidingen,
              selects = [],
              plaatsen = [],
              currentPlaatsSets = plaatsenSets;
              selectLoopCounter = 0,
              _getSelects = function(){
                return self.querySelectorAll('select');
              }
              _updateFirstSelect = function(data){
                var value = _getSelects()[0].value, i, j, selects = _getSelects();
                while (selects[0].firstChild) {
                    selects[0].removeChild(selects[0].firstChild);
                }
                selects[0].add(_createOption('Plaats'));
                for (i = 0; i < data.length; i++){
                    for (j = 0; j < data[i].length; j++){
                        selects[0].add(_createOption(data[i][j]));
                    }
                }
                selects[0].value = '';
              }
              _setPlaatsen = function (data) {
                  plaatsen = [];
                  var plaatsCount = _getSelects().length, i, j;
                  var skip = [];
                  var input = [
                      ['34'],
                      ['34', '33'],
                      ['32', '33'],
                      ['140', '141'],
                      ['51', '52', '53'],
                      ['51', '49', '50'],
                      ['54', '55', '56'],
                      ['56', '57', '58'],
                      ['1', '2', '3', '4'],
                      ['2', '3', '4', '5'],
                      ['3', '4', '5', '6'],
                      ['1', '2', '3'],
                      ['2', '3', '4'],
                      ['122', '123', '124'],
                      ['136', '137', '138'],
                      ['148', '149', '150'],
                      ['140', '141', '142'],
                      ['143', '144', '142'],
                      ['141', '143', '142'],
                      ["147", "148", "149"],
                      ["147", "148", "146"],
                      ["147", "145", "146"],
                      ["144", "145", "146"],
                  ];
                  input = currentPlaatsSets;
                  input = input.filter(function (i) {
                      return i.length === plaatsCount;
                  });
                  console.log(input);
                  var allPlaatsIds = [];
                  for (i = 0; i < input.length; i++){
                     var inputItem = input[i];
                     allPlaatsIds = allPlaatsIds.concat(input[i]);
                  }
                  skip = skip.concat(topscore(allPlaatsIds, plaatsCount));
                  for (i = 0; i < data.length; i++){
                      var d = data[i].slice(0), remove = [];
                      for (j = 0; j < allPlaatsIds.length; j++){
                          var index = d.indexOf(allPlaatsIds[j]);
                          if (index === 0 || index === d.length - 1){
                              remove.push(allPlaatsIds[j]);
                          }
                      }
                      for (j = 0; j < remove.length; j++){
                          d.remove(remove[j]);
                      }
                      var split = splitByArray(d, skip);
                      for (j = 0; j < split.length; j++){
                        plaatsen.push(split[j]);
                      }
                  }
                  plaatsen = plaatsen.filter(function (i) {
                      return i.length >= plaatsCount;
                  });
              },
              _init = function () {
                  selects = _getSelects();
                  var i,
                      initialValue = selects[0].value;
                  selectLoopCounter = 0;
                  for (i = 0; i < selects.length; i++) {
                      _clearOption(selects[i]);
                      _setSelectDisabledState(selects[i], i !== 0);
                  }
                  if (self.dataset.init !== 'set') {
                      form.addEventListener('change', function (e) {
                          _getData(e.target);
                      });
                  }
                  self.dataset.init = 'set';
                  _setPlaatsen(marktRows);
                  console.log(plaatsen);
                  removeBtn.classList[selects.length <= 1 ? 'add' : 'remove']('disabled');
                  addBtn.classList[selects.length >= parseInt(count) + parseInt(maxUitbreidingen) ? 'add' : 'remove']('disabled');
                  _updateFirstSelect(plaatsen);
                  if (initialValue && selects[0]) {
                      selects[0].value = initialValue;
                      _getData(selects[0]);
                  }
              },
              _clearOption = function(select) {
                    while (select.firstChild) {
                        select.removeChild(select.firstChild);
                    }
              },
              _getNeigbours = function (existingPlaatsen) {
                  var i,
                      j,
                      result = [],
                      skip = [];
                  for (i = 0; i < plaatsen.length; i++) {
                      for (j = 0; j < plaatsen[i].length; j++) {
                          if (existingPlaatsen.includes(plaatsen[i][j])) {
                              (plaatsen[i][j + 1]) && result.push(plaatsen[i][j + 1]);
                              (plaatsen[i][j - 1]) && result.push(plaatsen[i][j - 1]);
                          }
                      }
                  }
                  result = result.filter(function (x) {
                      return !existingPlaatsen.includes(x);
                  });
                  if (existingPlaatsen.length >= selects.length - 1) {
                      for (j = 0; j < result.length; j++) {
                          var newSet = existingPlaatsen.slice(0);
                          newSet.push(result[j]);
                          newSet = newSet.sort().join('-');
                          for (i = 0; i < currentPlaatsSets.length; i++) {
                              if (currentPlaatsSets[i].length === selects.length && currentPlaatsSets[i].sort().join('-') === newSet) {
                                  skip.push(result[j]);
                              }

                          }

                      }

                  }
                  result = result.filter(function (x) {
                      return !skip.includes(x);
                  });
                  return result;
              },
              _nextSelect = function(select) {
                var selectArray = Array.prototype.slice.call(selects),
                    next = selectArray[selectArray.indexOf(select) + 1];

                if (next)
                    return next;
                return;

              },
              _getSelectsData = function(select){
                  var a = [], i;
                for(i = 0; i < selects.length; i++){
                    if (selects[i].value){
                        a.push(selects[i].value);
                    }
                    if(selects[i] === select){
                        i = selects.length+1;
                    }
                }
                return a;
              },
              _getEnableSave = function(){
                var i;
                for(i = 0; i < selects.length; i++){
                    selects[i].setAttribute('name', selects[i].dataset.name);
                    selects[i].setAttribute('id', selects[i].dataset.id);
                }
              },
              _getData = function(select){
                    var nextSelect = _nextSelect(select);
                    if (select.value === '') {
                    }else{
                        var options = _getNeigbours(_getSelectsData(select))
                        self.classList[options.length ? 'remove' : 'add']('no-options');
                        _updateSelects(select, nextSelect, options);
                        if (nextSelect && options.length) {
                            selectLoopCounter++;
                            _getData(nextSelect);
                        }else{
                            _getEnableSave(select);
                        }
                    }
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
              _updateSelects = function(select, nextSelect, data) {
                var disable = false,
                    i, j;
                for (i = 0; i < selects.length; i++){
                    if (selects[i+1] && select === selects[i]){
                        i++;
                        disable = true;
                    }
                    _setSelectDisabledState(selects[i], disable);
                }
                if(nextSelect && data.length){
                    _setSelectDisabledState(nextSelect, false);
                    var nextSelectValue = nextSelect.value;
                    _clearOption(nextSelect);
                    for (j = 0; j < data.length; j++){
                        nextSelect.add(_createOption(data[j]));
                    }
                }
              };
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


