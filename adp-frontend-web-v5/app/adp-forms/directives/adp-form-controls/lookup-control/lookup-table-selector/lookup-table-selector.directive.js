(function () {
  'use strict';

  angular
    .module('app.adpForms')
    .directive('lookupTableSelector', lookupTableSelector);

  function lookupTableSelector(LookupDxConfig) {
    return {
      restrict: 'E',
      scope: {
        props: '=',
      },
      templateUrl: 'app/adp-forms/directives/adp-form-controls/lookup-control/lookup-table-selector/lookup-table-selector.html',
      replace: true,
      link: function (scope) {
       var removeWatcher = scope.$watch('props', function (props) {
          if (_.isNil(props)) {
            return;
          }
          scope.config = LookupDxConfig.tableSelector(scope.props);
          removeWatcher();
        });
      }
    }
  }
})();
