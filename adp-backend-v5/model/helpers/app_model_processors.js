const _ = require('lodash');
const { CallStackError } = require('../../lib/errors');

/**
 * Entire module will be passed to ejs as data to process app model schemes
 * @returns {{}}
 */
module.exports = (appLib) => {
  const m = {};
  const MAX_RECURSIVE_CALLS_NUMBER = 15;

  function getMacrosParams(macrosArgs, defaultParams = {}) {
    if (_.isPlainObject(macrosArgs[0])) {
      return _.merge({}, defaultParams, macrosArgs[0]);
    }

    const params = {};
    _.entries(defaultParams).forEach(([paramKey, paramVal], index) => {
      params[paramKey] = macrosArgs[index] || paramVal;
    });
    return params;
  }

  // More about M function: https://confluence.conceptant.com/pages/viewpage.action?pageId=8945882
  m.M = function (...args) {
    const macroName = args[0];
    if (!macroName) {
      throw new Error(`Macro name must be defined as first parameter.`);
    }
    const macro = this.macros[macroName];
    if (!macro) {
      throw new Error(`Unknown macro ${macroName}`);
    }

    const macroArgs = args.slice(1);
    const macroParams = getMacrosParams(macroArgs, macro.parameters);

    this.nestingLevel = (this.nestingLevel || 0) + 1;
    if (this.nestingLevel > MAX_RECURSIVE_CALLS_NUMBER) {
      throw new CallStackError(
        `The maximum number of recursive calls (${MAX_RECURSIVE_CALLS_NUMBER}) has been reached.`
      );
    }
    const result = macro.func.call(this, macroParams);
    this.nestingLevel--;
    return result;
  };

  m.ENV = function (varName) {
    return appLib.config[varName];
  };

  m.visualizationsModelSpecifications = function () {
    return '';
  };

  m.visualizationTypes = function () {
    // this should scan model/visualizations (in all schemas listed in
    // the APP_SCHEMA), read their specification.json and return the list
    // of available visualization types in the form {<key>:<name>}
    return '{pie_chart: "Pie Chart"}';
  };

  return m;
};
