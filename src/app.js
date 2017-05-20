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

  function fetchRate (base, to) {
    return fetch(API_RATE + '?alt=json&moedas=' + base)
      .then(function (response) {
        return response.json();
      })
  }

  function updateRates (state) {
    startLoading();

    fetchRate(state.base, state.to)
      .then(function (data) {
        var currency = data.valores[state.base];
        state.rate = formatNumber(currency.valor);
        state.rate_payoneer = formatNumber(state.rate * 0.98);
        state.last_quote = formatDate(timestampToDate(currency.ultima_consulta));

        localforage.setItem(dbKeys.rates, state);

        return state;
      })
      .then(function (state) {
        updateRatesUi(state);
        stopLoading();
      });
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
