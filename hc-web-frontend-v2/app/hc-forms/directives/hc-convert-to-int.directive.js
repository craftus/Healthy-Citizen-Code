;(function () {
  'use strict';

  angular
    .module('app.hcForms')
    .directive('hcConvertToNumber', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$parsers.push(function(val) {
          return val != null ? parseInt(val, 10) : null;
        });
        ngModel.$formatters.push(function(val) {
          return val != null ? '' + val : null;
        });
      }
    };
  });
})();