(function() {
  'use strict';

  // from core
  angular.module('app.default', []).controller('DefaultController', DefaultController); // exposes app model to the interface, loads data if necessary

  /** @ngInject */
  function DefaultController( // this implements custom page linked to datatables rows vial link action
    $state,
    APP_CONFIG,
    $http,
    $location // ideally I'd like to use $routeParams, but angular-route.js doesn't seem to be loaded
  ) {
    var vm = this;
    vm.data = $state.current.data;
    vm.loading = false;
    vm.APP_CONFIG = APP_CONFIG;
    vm.INTERFACE = window.adpAppStore.appInterface();

    var pathParts = $location.$$path.split('/');
    if (pathParts[2] && !APP_CONFIG.appSuffix) {
      var id = pathParts[2];
      vm.data.id = id;
      vm.loading = true;
      getPageData().then(onSuccess);
    }

    function getPageData() {
      var params = {
        method: vm.data.parameters.dataLinkMethod,
        url: APP_CONFIG.apiUrl + vm.data.parameters.dataLink.replace(/:id/g, id),
      };
      return $http(params);
    }

    function onSuccess(response) {
      vm.loading = false;
      vm.data = _.merge(vm.data, response.data);
    }
  }
})();
