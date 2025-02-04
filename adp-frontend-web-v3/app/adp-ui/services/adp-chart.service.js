;(function () {
  'use strict';

  angular
    .module('app.adpUi')
    .factory('AdpChartService', AdpChartService);

  /** @ngInject */
  function AdpChartService (
    AdpChartDataGetterService,
    CONSTANTS,
    $q,
    $http
  ){
    function setData(model) {
      var promise = model.data.type === 'url' ? _request(model.data) : $q.when(model.data);

      return promise
        .then(function (response) {
          var data = !!response.data ? response.data.data : response;
          return AdpChartDataGetterService.setData(model, data);
        });
    }

    function _request(params) {
      return $http({
        method: params.method.toUpperCase(),
        url: CONSTANTS.apiUrl + params.link
      });
    }

    function evalOptions(options, dataset, chartIndex) {
      _.each(options, function (option, key) {
        var isObject = _.isObject(option);

        if (isObject && option.type === 'function') {
          options[key] = new Function(option['arguments'].join(','), option.code);
        }

        if (isObject && option.type === 'code') {
          options[key] = new Function(
            ['chartIndex', 'dataset'],
            'return ' + option.code
          )(chartIndex, dataset);
        }

        if (isObject || _.isArray(option)) {
          evalOptions(option, dataset, chartIndex);
        }
      });

      return options;
    }

    return {
      setData: setData,
      evalOptions: evalOptions
    };
  }
})();
