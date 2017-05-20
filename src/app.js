(function () {
  'use strict';

  var API_RATE = 'http://api.promasters.net.br/cotacao/v1/valores';
  var state = {
    base: 'USD',
    to: 'BRL',
    rate: '?',
    rate_payoneer: '?',
    last_quote: '?'
  };

  var dbKeys = {
    rates: 'rates'
  }

  var ui = {
    rate: document.querySelector('.hue-js-rate'),
    ratePayoneer: document.querySelector('.hue-js-rate-payoneer'),
    lastQuote: document.querySelector('.hue-js-last-quote'),
    refreshContainer: document.querySelector('.hue-js-refresh'),
    refreshButton: document.querySelector('.hue-refresh--btn')
  };

  ui.refreshButton.addEventListener('click', function () {
    updateRates(state);
  });

  localforage.getItem(dbKeys.rates)
    .then(function (rate) {
      state = rate || state;
      updateRates(state);
    })
    .catch(function (error) {
      console.error(error);
    });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(function () {
        console.log('Service worker registered');
      });
  }

  function startLoading () {
    requestAnimationFrame(function () {
      ui.refreshContainer.classList.add('hue-refresh--is-loading');
    });
  }

  function stopLoading () {
    requestAnimationFrame(function () {
      ui.refreshContainer.classList.remove('hue-refresh--is-loading');
    });
  }

  function updateRatesUi (state) {
    requestAnimationFrame(function () {
      ui.rate.textContent = state.rate;
      ui.ratePayoneer.textContent = state.rate_payoneer;
      ui.lastQuote.textContent = state.last_quote;

      var body = document.body;

      body.classList.remove('hue-success');
      body.classList.remove('hue-warn');
      body.classList.remove('hue-danger');

      if (state.rate > 3.20) {
        body.classList.add('hue-success');
      } else if (state.rate > 3.05) {
        body.classList.add('hue-warn');
      } else {
        body.classList.add('hue-danger');
      }
    });
  }

  function fetchFromNetworkRate (base, callback) {
    var url = apiUrl(base);
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          callback(response);
        }
      }
    };

    request.open('GET', url);
    request.send();
  }

  function updateRates (state) {
    var url = apiUrl(state.base);
    var hasPendingRequest = true;
    startLoading();

    if ('caches' in window) {
      caches.match(url).then(function (response) {
        if (response) {
          response.json().then(function (data) {
            if (hasPendingRequest) {
              updateStateRate(data);
            }
          })
        }
      })
    }

    fetchFromNetworkRate(state.base, updateStateRate)

    function updateStateRate (data) {
      var currency = data.valores[state.base];
      state.rate = formatNumber(currency.valor);
      state.rate_payoneer = formatNumber(state.rate * 0.98);
      state.last_quote = formatDate(timestampToDate(currency.ultima_consulta));

      localforage.setItem(dbKeys.rates, state);
      updateRatesUi(state);
      stopLoading();
      hasPendingRequest = false;
    }
  }

  function apiUrl (base) {
    return API_RATE + '?alt=json&moedas=' + state.base;
  }

  function formatNumber (number) {
    return Math.round(number * 100) / 100;
  }

  function timestampToDate (timestamp) {
    return new Date(timestamp * 1000);
  }

  function formatDate (date) {
    return date.toLocaleString()
  }
})();
