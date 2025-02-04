;(function () {
  'use strict';

  angular
    .module('app.adpDataGrid')
    .factory('FilterOperation', FilterOperation);

  /** @ngInject */
  function FilterOperation(AdpSchemaService) {
    var commonOperations = {
      equality: ['=', '<>'],
      equalityOnly: ['='],
      string: ['contains', 'notcontains', 'startswith', 'endswith', '=', '<>'],
      numeric: ['=', '<>', '<', '>', '<=', '>=', 'between'],
    };

    var operationsByType = {
      String: commonOperations.string,
      'String[]': commonOperations.string,
      'Int32[]': commonOperations.numeric,
      'Int64[]': commonOperations.numeric,
      Email: commonOperations.string,
      Phone: commonOperations.string,
      Text: commonOperations.string,
      Url: commonOperations.string,
      Currency: commonOperations.numeric,
      Number: commonOperations.numeric,
      Double: commonOperations.numeric,
      Int32: commonOperations.numeric,
      Int64: commonOperations.numeric,
      Decimal128: commonOperations.numeric,

      Date: commonOperations.numeric,
      DateTime: commonOperations.numeric,
      Time: commonOperations.numeric,

      List: commonOperations.equality,
      'List[]': commonOperations.equality,

      Boolean: commonOperations.equalityOnly,
      TriStateBoolean: commonOperations.equalityOnly,

      File: commonOperations.string,
      Image: commonOperations.string,
      Audio: commonOperations.string,
      Video: commonOperations.string,
      'File[]': commonOperations.string,
      'Image[]': commonOperations.string,
      'Audio[]': commonOperations.string,
      'Video[]': commonOperations.string,
      Location: commonOperations.string,

      ObjectID: commonOperations.equality,
      ImperialWeight: commonOperations.numeric,
      ImperialWeightWithOz: commonOperations.numeric,
      ImperialHeight: commonOperations.numeric,

      LookupObjectID: commonOperations.equality,
      'LookupObjectID[]': commonOperations.equality,
      Html: commonOperations.string,
    };

    function get(field) {
      var type = AdpSchemaService.getFieldType(field);
      return operationsByType[type];
    }

    function getValidOperation(operation, field) {
      if (validForType(operation, field.type)) {
        return operation;
      } else {
        return getSelected(field);
      }
    }

    function validForType(operation, type) {
      var operations = operationsByType[type];

      return operations.includes(operation);
    }

    function getSelected(field) {
      var operations = get(field);

      if (_.isNil(operations)) {
        return;
      }

      return operations[0];
    }

    function encode(operation) {
      var codings = {
        '=': 'equals',
        '<>': 'notequals',
        '<': 'less',
        '>': 'more',
        '<=': 'lessorequal',
        '>=': 'moreorequal',
      };

      return codings[operation] || operation;
    }

    function decode(operation) {
      var codings = {
        'equals': '=',
        'notequals': '<>',
        'less': '<',
        'more': '>',
        'lessorequal': '<=',
        'moreorequal': '>=',
      };

      return codings[operation] || operation;
    }

    function supportedTypes() {
      return Object.keys(operationsByType);
    }

    function hasBetweenOperation(type) {
      var operations = operationsByType[type] || [];
      return operations.includes('between');
    }

    return {
      supportedTypes: supportedTypes,
      get: get,
      getSelected: getSelected,
      encode: encode,
      decode: decode,
      getValidOperation: getValidOperation,
      hasBetweenOperation: hasBetweenOperation,
    }
  }
})();
