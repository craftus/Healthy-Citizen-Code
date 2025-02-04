;(function () {
  'use strict';

  angular
    .module('app.hcForms')
    .factory('HcValidationService', HcValidationService);

  function HcValidationService (
    DATE_FORMAT,
    HcSchemaService,
    $log
  ) {
    var TEMPLATE_REGEX = {
      VAL: /(\$val)/,
      ARG_VAL: /\$(\w+)/,
      FULL_NAME: /@(\w+)/,
      MATCHED_VAL: /#(\w+)/,
    };

    var VALIDATION_RULES = {
      regex: function (viewValue, modelValue, validationArguments) {
        if (!viewValue) return true;
        var regex = new RegExp(validationArguments['regex'], validationArguments['regexOptions']);

        return regex.test(viewValue);
      },

      min: function (viewValue, modelValue, validationArguments, form, field) {
        var rule = 'min' + field.type;

        return this[rule].apply(this, arguments);
      },

      minString: function (viewValue, modelValue, validationArguments) {
        var limit = parseInt(validationArguments.length);

        if (!viewValue) return true;
        return viewValue.length >= limit;
      },

      minNumber: function (viewValue, modelValue, validationArguments) {
        var limit = parseFloat(validationArguments.limit);

        if (!viewValue) return true;
        return viewValue >= limit;
      },

      minDate: function (viewValue, modelValue, validationArguments, form) {
        var matchedField = validationArguments.limit.slice(1);
        var matchedValue = form[matchedField].$viewValue;
        
        var valueDate = moment(viewValue);
        var matchedDate = moment(matchedValue);

        var viewValueIsValid = moment(viewValue, DATE_FORMAT, true).isValid();
        var matchedValueIsValid = moment(matchedValue, DATE_FORMAT, true).isValid();

        if (!viewValueIsValid || !matchedValueIsValid) return true;

        return moment(valueDate).isSameOrAfter(matchedDate);
      },

      max: function (viewValue, modelValue, validationArguments, form, field) {
        var rule = 'max' + field.type;

        return this[rule].apply(this, arguments);
      },

      maxString: function (viewValue, modelValue, validationArguments) {
        var limit = parseInt(validationArguments.length);

        if (!viewValue) return true;
        return viewValue.length <= limit;
      },

      maxNumber: function (viewValue, modelValue, validationArguments) {
        var limit = parseFloat(validationArguments.limit);

        if (!viewValue) return true;
        return viewValue < limit;
      },

      maxDate: function (viewValue, modelValue, validationArguments, form) {
        var matchedField = validationArguments.limit.slice(1);
        var matchedValue = form[matchedField].$viewValue;

        var valueDate = moment(viewValue);
        var matchedDate = moment(matchedValue);

        var viewValueIsValid = moment(viewValue, DATE_FORMAT, true).isValid();
        var matchedValueIsValid = moment(matchedValue, DATE_FORMAT, true).isValid();

        if (!viewValueIsValid || !matchedValueIsValid) return true;

        return moment(valueDate).isSameOrBefore(matchedDate);
      },

      maxLength: function (viewValue, modelValue, validationArguments) {
        return this.maxString.apply(this, arguments);
      },

      minLength: function (viewValue, modelValue, validationArguments) {
        return this.minString.apply(this, arguments);
      },

      // TODO: replace with equalTo rule;
      passwordMatch: function(viewValue, modelValue, validationArguments, form) {
        var fieldValue = viewValue;
        var matchedValue = form[validationArguments.matchedField].$viewValue;

        return fieldValue === matchedValue;
      },

      notInFuture: function(viewValue) {
        if (!viewValue) return true;

        var limit = moment();
        var date = moment(viewValue);

        return date.isBefore(limit);
      },

      // noop(), always valid
      imperialHeightRange: function () {
        return true;
      },

      // TODO: uncomment/remove when backend reimplements
      // TODO: replace by min-max or whatever rule it's
      // notAfterEncounterDischargeDate: function (viewValue, modelValue, validationArguments, form) {
      //   var matchedField = 'dischargeDate';
      //   var matchedValue = form[matchedField].$viewValue;
      //
      //   var valueDate = moment(viewValue, DATE_FORMAT);
      //   var matchedDate = moment(matchedValue, DATE_FORMAT);
      //
      //   if (!viewValue || !matchedValue) return true;
      //
      //   return valueDate.isBefore(matchedDate);
      // },
      //
      // // TODO: replace by min-max or whatever rule it's
      // notBeforeEncounterAdmissionDate: function (viewValue, modelValue, validationArguments, form) {
      //   var matchedField = 'admissionDate';
      //   var matchedValue = form[matchedField].$viewValue;
      //
      //   var valueDate = moment(viewValue, DATE_FORMAT);
      //   var matchedDate = moment(matchedValue, DATE_FORMAT);
      //
      //   if (!viewValue || !matchedValue) return true;
      //
      //   return valueDate.isAfter(matchedDate);
      // },
    };

    function addValidators(field, form) {
      var model = form[field.keyName];

      return angular.extend(
        model.$validators,
        _getValidators(field, form)
      );
    }

    function _getValidators(field, form) {
      var validators = _.filter(field.validate, _filterNotFound);
      var result = {};

      validators.map(_addValidator.bind(null, form, field, result));

      return result;
    }

    function _filterNotFound(validator) {
      var validatorName = validator.validator;
      var isFound = validatorName in VALIDATION_RULES;

      if (!isFound) $log.debug(validatorName, ' does not implemented yet.');

      return isFound;
    }

    function _addValidator(form, field, result, validator) {
      var validatorName = validator.validator;

      result[validatorName] = function (viewValue, modelValue) {
        return VALIDATION_RULES[validatorName](
          viewValue,
          modelValue,
          validator['arguments'],
          form,
          field
        );
      }
    }

    function updateMessages(field, form) {
      var messages = {};
      var validators = _.filter(field.validate, _filterNotFound);

      // TODO: refactor
      _.each(validators, function (validator) {
        var validatorName = validator.validator,
            message = _getMessage(field, validator);

        messages[validatorName] = message
          .replace(TEMPLATE_REGEX.VAL, _replaceByValue.bind(null, form, field))
          .replace(TEMPLATE_REGEX.ARG_VAL, _replaceByValueArg.bind(null, validator))
          .replace(TEMPLATE_REGEX.MATCHED_VAL, _replaceByMatchedValue.bind(null, validator, field, form))
          .replace(TEMPLATE_REGEX.FULL_NAME, _replaceByFullName.bind(null, validator, field))
          .replace(/@@/g, '@')
          .replace(/\$\$/g, '$');
      });

      return messages;
    }

    function _getMessage(field, validator) {
      var type = field.type === 'Date' && 'date' in validator.errorMessages ? 'date' : 'default';

      return validator.errorMessages[type];
    }

    function _replaceByValue(form, field) {
      var model = form[field.keyName];

      if (field.type === 'Date') {
        return moment(model.$viewValue).format(DATE_FORMAT);
      }

      return model.$viewValue;
    }

    function _replaceByValueArg(validator, _, argName) {
      return validator['arguments'][argName] || argName;
    }

    function _replaceByMatchedValue(validator, field, form, _, argName) {
      var argument = validator['arguments'][argName];

      if (argument[0] === '$') {
        var matchedFieldName = validator['arguments'][argName].slice(1);
        var value = form[matchedFieldName].$viewValue;

        return field.type === 'Date' ? moment(value).format(DATE_FORMAT) : value;
      } else {
        return field.type === 'Date' ? moment(argument).valueOf() : argument;
      }
    }

    function _replaceByFullName(validator, field, _, argName) {
      var argument = validator['arguments'][argName];

      if (argument[0] === '$') {
        var matchedFieldName = validator['arguments'][argName].slice(1);
        var fields = HcSchemaService.getCurrentSchema().fields;

        return fields[matchedFieldName].fullName;
      } else {
        return field.type === 'Date' ? moment(argument).valueOf() : argument;
      }
    }

    return {
      addValidators: addValidators,
      updateMessages: updateMessages
    };
  }
})();
