;(function () {
  'use strict';

  angular
    .module('app.adpForms')
    .directive('adpFormFieldObject', adpFormFieldObject);

  function adpFormFieldObject() {
    return {
      restrict: 'E',
      scope: {
        args: '<',
        formContext: '<',
      },
      templateUrl: 'app/adp-forms/directives/adp-form-fields/adp-form-field-object/adp-form-field-object.html'
    }
  }
})();
