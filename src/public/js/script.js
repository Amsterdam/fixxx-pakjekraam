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
    'modal-close': function(e){
      var modal = _closest(this, '.modal');
      if (modal) {
        this.handled = true;
        modal.parentNode.removeChild(modal);
      }
      document.body.classList.remove('modal-active');
    },
    'modal': function(e){
      e && e.preventDefault();
      var
        el = this.hash && document.getElementById(this.hash.substring(1)) || this.dataset.contentId && document.getElementById(this.dataset.contentId),
        url = this.href,
        form = _closest(this, 'form'),
        rootElem = this.dataset.root && document.querySelector(this.dataset.root) || document.body,
        template = '<div class="modal-inner">[[CONTENT]]</div><a href="#" class="modal-close" data-handler="modal-close">SLUITEN</a><a href="#" class="modal-close--bg" data-handler="modal-close"></a>';
        var content = false;

      var _render = function(content){
        var modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = template.replace('[[CONTENT]]', content);
        var fields = modal.querySelectorAll('select, input');
        for (var i = 0; i < fields.length; i++){
          var f = fields[i];
          f.dataset.id && f.setAttribute('id', f.dataset.id);
          f.dataset.name && f.setAttribute('name', f.dataset.name);
        }
        rootElem.appendChild(modal);
        // form && changers['change'].call(form);
        setTimeout(function(){
          modal.classList.add('active');
        }, 300);
      };

      if (el) {
        content = el.innerHTML;
        _render(content);
      } else if (url) {
        helpers.ajax(url, function(response){
          if (response.status >= 200 && response.status < 400) {
            var r = document.createElement('div');
            r.innerHTML = response.responseText;

            (content = r.querySelector('main')) && _render(content.innerHTML);
          } else {
            w.location = url;
          }
        });
      } else {
        w.location = url;
      }
      document.body.classList.add('modal-active');

    },
    'clear-select': function(e){
        var parent = this.parentNode,
            select = parent.querySelector('select'),
            _click = function(){
                select.value = '';
            };
        e && e.preventDefault();
        _click();

    },
    'remove-voorkeur': function(e){
        var voorkeur = _closest(this, '.PlaatsvoorkeurenForm__list-item'),
            form = _closest(this, 'form'),
            remove = voorkeur.classList.contains('remove'),
            plaatsIdsInputs = voorkeur.querySelectorAll('input[type="hidden"]'),
            container = _closest(this, '.PlaatsvoorkeurenForm__list'),
            dataAttrs = ['name'],
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
        voorkeur.classList[remove ? 'remove' : 'add']('remove');
        for (var i = 0; i < plaatsIdsInputs.length; i++){
            for (var j = 0; j < dataAttrs.length; j++){
                if (remove){
                    plaatsIdsInputs[i].setAttribute(dataAttrs[j], plaatsIdsInputs[i].getAttribute('data-' + dataAttrs[j]));
                }else{
                    plaatsIdsInputs[i].setAttribute('data-' + dataAttrs[j], plaatsIdsInputs[i].getAttribute(dataAttrs[j]));
                    plaatsIdsInputs[i].removeAttribute(dataAttrs[j]);
                }
            }
        }
        helpers.trigger(form, 'submit');
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
        //decorators['plaatsvoorkeur-prototype'].call(prototype);
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
    }
  };

  var decorators = {
      'aanwezigheid-form': function () {
          var form = this,
               body = _closest(this, 'body'),
               redirectTo = './?error=aanwezigheid-saved',
               _getFormData = function(){
                var out = [],
                    hiddenFields = form.querySelectorAll('input[name*="[marktId]"], input[name*="[marktDate]"], input[name*="[attending]"]:checked');
                for (var i = 0; i < hiddenFields.length; i++){
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
              _addAlert = function(alertText){
                var base = document.createElement('div');
                base.classList.add('Alert');
                base.textContent = alertText;
                body.appendChild(base);
              },
              _formChange = function(e){
                console.log('change');
                console.log(_getFormData());
                  if(e) {
                    _submit();
                  }
              },
              _submit = function(e){
                    if (e && e.x !== 0) {
                        return;
                    }
                    _addAlert('Bezig met bewaren');
                    body.classList.add('in-progress');
                    form.request = helpers.ajax({
                    type: form.method,
                    url: form.action,
                    data: _getFormData(),
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
              _init = function(){
              };
          _init();
          form.addEventListener('change', _formChange);
          form.addEventListener('submit', _submit);
      },
      'voorkeur-form': function () {
          var form = this,
              vasteplaatsCount = form.dataset.vasteplaatsCount,
              slider = form.querySelectorAll('input[type="range"]'),
              body = _closest(this, 'body'),
              extra = form.querySelectorAll('.PlaatsvoorkeurenForm__list-item__min-extra'),
              optional = form.querySelectorAll('.PlaatsvoorkeurenForm__list-item__optional'),
              explain = form.querySelectorAll('.PlaatsvoorkeurenForm__list-item__explain'),
              minSlider = form.querySelector('input[name="minimum"]'),
              maxSlider = form.querySelector('input[name="extra-count"]'),
              redirectTo = './?error=plaatsvoorkeuren-saved',
              _submit = function(e){
                    if (e && e.x !== 0) {
                        return;
                    }
                    _addAlert('Bezig met bewaren');
                    body.classList.add('in-progress');
                    form.request = helpers.ajax({
                    type: form.method,
                    url: form.action,
                    data: _getFormData(),
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
               _getFormData = function(){
                var out = [],
                        items = form.querySelectorAll('.PlaatsvoorkeurenForm__list-item'),
                        erkenningsNummer = form.querySelector('[name="erkenningsNummer"]').value,
                        marktId = form.querySelector('[name="marktId"]').value,
                        marktDate = form.querySelector('[name="marktDate"]').value,
                        minimum = form.querySelector('[name="minimum"]:checked').value,
                        extra = form.querySelector('[name="extra-count"]:checked').value,
                        maximum = parseInt(minimum, 10) + parseInt(extra, 10),
                        anywhere = form.querySelector('[name="anywhere"]:checked') && form.querySelector('[name="anywhere"]:checked').value;
                out.push(encodeURIComponent('erkenningsNummer') + '=' + encodeURIComponent(erkenningsNummer));
                out.push(encodeURIComponent('redirectTo') + '=' + encodeURIComponent(redirectTo));
                anywhere && out.push(encodeURIComponent('anywhere') + '=' + encodeURIComponent(anywhere));
                out.push(encodeURIComponent('marktId') + '=' + encodeURIComponent(marktId));
                out.push(encodeURIComponent('marktDate') + '=' + encodeURIComponent(marktDate));
                out.push(encodeURIComponent('minimum') + '=' + encodeURIComponent(minimum));
                out.push(encodeURIComponent('maximum') + '=' + encodeURIComponent(maximum));
                for (var i = 0; i < items.length; i++){
                    var
                        plaatsId = items[i].querySelector('[name*="plaatsId"]'),
                        priority = items[i].querySelector('[name*="priority"]'),
                        marktId = items[i].querySelector('[name*="marktId"]');
                    if (plaatsId && priority && marktId){
                        out.push(encodeURIComponent(plaatsId.getAttribute('name')) + '=' + encodeURIComponent(plaatsId.value));
                        out.push(encodeURIComponent(priority.getAttribute('name')) + '=' + encodeURIComponent(priority.value));
                        out.push(encodeURIComponent(marktId.getAttribute('name')) + '=' + encodeURIComponent(marktId.value));

                    }
                }
                return out.join('&').replace(/%20/g, '+');;
              },
              _addAlert = function(alertText){
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
              _clearElem = function (elem) {
                  while (elem.firstChild) {
                      elem.removeChild(elem.firstChild);
                  }
              },
              _addKraamCount = function (elem, kraamCount) {
                  var j;
                  for (j = 0; j < kraamCount; j++) {

                      var kraam = document.createElement('span');
                      kraam.classList.add('kraam');
                      elem.appendChild(kraam);
                  }
              },
              _formChange = function (e) {
                  if(e) {
                    _submit();
                  }
              },
              _init = function(){
                  var minVal = form.querySelector('input[name="minimum"]:checked') ? form.querySelector('input[name="minimum"]:checked').value : 1,
                      maximum = form.querySelector('input[name="maximum"]').value || 1,
                      extra = parseInt(maximum, 10) - parseInt(minVal, 10);
                  form.querySelector('input[id="extra-count-'+extra+'"]').checked = true;
                      var maxVal = form.querySelector('input[name="extra-count"]:checked').value;
                  for (i = 0; i < explain.length; i++) {
                      var min = explain[i].querySelector('.min');
                      var max = explain[i].querySelector('.max');
                      var extr = explain[i].querySelector('.extra');
                      var minM = explain[i].querySelector('.minMulti');
                      var maxM = explain[i].querySelector('.maxMulti');
                      max.textContent = maxVal;
                      min.textContent = minVal;
                      extr.classList[maxVal < 1 ? 'add' : 'remove']('hidden');
                      maxM.classList[maxVal <= 1 ? 'add' : 'remove']('hidden');
                      minM.classList[minVal <= 1 ? 'add' : 'remove']('hidden');
                  }
              }
          _init();
          form.addEventListener('change', _formChange);
          form.addEventListener('submit', _submit);
      },
      'initial-modal': function(){
          var self = this,
              el = window.location.hash && window.location.hash.split('modal-').length == 2 && document.getElementById(window.location.hash.split('modal-')[1]);
            if (el){
                handlers['modal'].call(el);
            }
      },
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
                  var plaatsCount = _getSelects().length;
                  var skip = [];
                  var input = [
                      ['34', '33'],
                      ['51', '52', '53'],
                      ['51', '49', '50'],
                      ['54', '55', '56'],
                      ['56', '57', '58'],
                      ['122', '123', '124'],
                      ['140', '141'],
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
                  var allPlaatsIds = [];
                  for (i = 0; i < input.length; i++){
                     var inputItem = input[i];
                     allPlaatsIds = allPlaatsIds.concat(input[i]);
                  }
                  skip = skip.concat(topscore(allPlaatsIds, plaatsCount));

                  for (i = 0; i < data.length; i++){
                      var d = data[i], remove = [];
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
                    a = [], i;
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

  var domain = location.domain;



}(window, document.documentElement);


