const _ = require('lodash');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));

const JSON5 = require('json5');
const ejs = require('ejs');
const { ObjectID } = require('mongodb');
const log = require('log4js').getLogger('filter/filter-parser');
const { ValidationError } = require('../errors');
const { getSchemaPathByFieldPath } = require('../util/unified-approach');
const { getFunction } = require('../util/memoize');
const { parseRelativeDateValue } = require('./util');

module.exports = (appLib) => {
  const m = {};

  function getFilterForField(fieldPath, operation, value, scheme, wholeFilter, meta) {
    const schemaPath = getSchemaPathByFieldPath(fieldPath);
    const fieldSchema = _.get(scheme, schemaPath);
    if (!fieldSchema) {
      throw new ValidationError(`Unable to find field by path '${fieldPath}'.`);
    }
    const fieldType = fieldSchema.type;
    if (fieldType.endsWith('[]')) {
      meta.hasArrayFieldInFilter = true;
    }
    const filterName = getFieldFilter(scheme, schemaPath);
    if (!filterName) {
      throw new ValidationError(`Unable to find filter for field by path '${fieldPath}'.`);
    }

    const context = {
      appLib,
      row: wholeFilter,
      modelSchema: scheme,
      fieldSchema,
      data: {
        fieldPath,
        operation,
        value,
      },
      action: 'view',
      path: fieldPath,
      schemaPath,
    };

    return getFilterFromMetaschema(filterName, context);

    function getFieldFilter(_scheme, _schemePath) {
      if (_schemePath === 'fields._id') {
        return 'objectId';
      }
      return _.get(_scheme, `${_schemePath}.filter`);
    }
  }

  function getFilterFromMetaschema(metaschemaFilterName, context) {
    const filterSpec = appLib.appModel.metaschema.filters[metaschemaFilterName];
    const { type, value } = _.get(filterSpec, 'where', {});

    if (type === 'function') {
      const filterName = value;
      const filterFunction = appLib.appModelHelpers.FiltersWhere[filterName];
      return filterFunction.call(context);
    }

    if (type === 'code') {
      const functionCode = value;
      const { args, values } = appLib.butil.getDefaultArgsAndValuesForInlineCode();
      return getFunction(args, functionCode).apply(context, values);
    }

    if (type === 'reference') {
      const referencedFilterName = value;
      return getFilterFromMetaschema(referencedFilterName, context);
    }

    if (type === 'template') {
      const template = value;
      return ejs.render(template, { _, ObjectID }, { context });
    }
  }

  const customUnaryOperations = {
    undefined(fieldPath) {
      return { [fieldPath]: null };
    },
    notUndefined(fieldPath) {
      return { [fieldPath]: { $ne: null } };
    },
  };

  function getFilterForObject(obj, scheme, meta) {
    const type = _.get(obj, 'type');
    let expression = _.get(obj, 'expression');
    if (!type || !expression) {
      throw new ValidationError(`Invalid filter, should have 'type' and 'expression' fields`);
    }
    if (_.isString(expression)) {
      try {
        expression = JSON5.parse(expression);
      } catch (e) {
        log.error(`Invalid expression string, must be parsable as object. ${e.message}`);
        throw new ValidationError(`Invalid expression string.`);
      }
    }

    const typeToFilter = {
      'Mongo Expression': getFilterForMongoExpression,
      'Database Field': getFilterForDatabaseField,
      'Relative Date': getFilterForRelativeDateField,
    };

    const filter = typeToFilter[type];
    if (!filter) {
      throw new ValidationError(`Invalid filter type specified, allowed types: ${typeToFilter.join(', ')}`);
    }
    return filter(expression, scheme, meta);
  }

  function getFilterForMongoExpression(expression) {
    if (!_.isPlainObject(expression)) {
      throw new ValidationError(`Invalid expression.`);
    }

    return expression;
  }

  function getFilterForDatabaseField(expression, scheme) {
    if (!_.isArray(expression) || expression.length !== 3) {
      throw new ValidationError('Invalid expression value, should be an [field, operation, field] array .');
    }

    const [f1, operation, f2] = expression;
    const f1Type = _.get(scheme, `fields.${f1}.type`);
    const f2Type = _.get(scheme, `fields.${f2}.type`);
    const groups = {
      string: ['String', 'Html', 'Code', 'Email', 'Phone', 'Url', 'Text', 'Barcode'],
      number: ['Number', 'Double', 'Int32', 'Int64', 'Decimal128'],
      currency: ['Currency'],
      weight: ['ImperialWeight', 'ImperialWeightWithOz'],
      Date: ['Date', 'DateTime'],
    };

    const allowedOperations = {
      '=': '$eq',
      '<>': '$ne',
      '<': '$lt',
      '>': '$gt',
      '<=': '$lte',
      '>=': '$gte',
    };
    const operator = allowedOperations[operation];
    if (!operator) {
      throw new ValidationError(`Unsupported operation ${operation}`);
    }
    if (!f1Type || !f2Type) {
      throw new ValidationError(`Invalid fields specified.`);
    }

    const sameType = f1Type === f2Type;
    const isComparable =
      sameType || _.find(groups, (groupTypes) => groupTypes.includes(f1Type) && groupTypes.includes(f2Type));
    if (!isComparable) {
      throw new ValidationError(`Specified fields are not comparable.`);
    }

    return { $expr: { [operator]: [`$${f1}`, `$${f2}`] } };
  }

  function getFilterForRelativeDateField(filterObj, scheme, meta) {
    const { fieldPath, operation, value, timezone } = filterObj;
    const dateInServerTz = parseRelativeDateValue(value);
    let dayJsInUserTz = dayjs(dateInServerTz).tz(timezone);

    const schemaPath = getSchemaPathByFieldPath(fieldPath);
    const fieldType = _.get(scheme, `${schemaPath}.type`);
    if (fieldType === 'Date') {
      // dates must be presented as midnight in user timezone
      dayJsInUserTz = dayJsInUserTz.millisecond(0).second(0).minute(0).hour(0);
    }
    const dateInUserTz = dayJsInUserTz.format();

    return getFilterForField(fieldPath, operation, dateInUserTz, scheme, meta);
  }

  /**
   * Devexterme filter expression parser.
   * Expression types^
   * 0. Truth check:
   *  - 'fieldPath' => { fieldPath: { $eq: true } }
   *  - ['fieldPath'] => { fieldPath: { $eq: true } }
   * 1. Unary:
   * - logical NOT ['!', _expression_] => { $nor: [_expression_] }
   * - custom unary operations defined in customUnaryOperations
   *
   * 2. Binary
   * - Expression with length of three:
   *  [leftOperand, operator, rightOperand]
   *
   * leftOperand {String} - fieldPath or other nested expression
   * rightOperand {any} - comparision value or other nested expression
   *
   * operators:
   *  - 'and' | 'or' - logical operators
   *  - type operators defined model/helpers/filters.
   *  For example default operators for String are '=', '<>'(not equal), '>', '>=', '<', '<=', 'contains', 'notcontains', 'startswith', 'endswith'
   *  Default operators might be redefined.
   *
   * - Expression with length of three+
   * It assumed that this is a chain of "or" or "and" -
   *  either one or the other, no combinations
   *  [nestedExpression, operator, nestedExpression, operator, ...rest]
   *  In this case operators are 'or', 'and'.
   *
   * @param expr {String|Array} - current filter expression (it changes while going deeper)
   * @param scheme - scheme for which expression is specified
   * @param wholeExpression - entire filter expression
   * @param meta
   * @return {Object} - mongo query
   */
  m.parse = function parse(expr, scheme, wholeExpression = expr, meta = {}) {
    try {
      if (!scheme) {
        throw new ValidationError('Parameter scheme must be specified.');
      }

      let expression;
      try {
        // string expr as array
        expression = JSON5.parse(expr);
      } catch (e) {
        // simple string or Array type
        expression = expr;
      }
      if (_.isEmpty(expression)) {
        return { conditions: {}, meta };
      }

      if (_.isString(expression)) {
        return { conditions: getFilterForField(expression, '=', true, scheme, meta), meta };
      }

      if (_.isPlainObject(expression)) {
        return { conditions: getFilterForObject(expression, scheme, meta), meta };
      }

      if (!_.isArray(expression)) {
        throw new ValidationError('Unexpected expression type. Expresion types expected: String, Array.');
      }

      const isNestedExpression = expression.length === 1 && expression[0].length;
      if (isNestedExpression) {
        return parse(expression[0], scheme, wholeExpression, meta);
      }

      const isUnaryOperator = expression.length === 2;
      if (isUnaryOperator) {
        if (expression[0] === '!') {
          const { conditions: nor } = parse(expression[1], scheme, wholeExpression, meta);
          const conditions = nor ? { $nor: [nor] } : null;
          return { conditions, meta };
        }

        const fieldPath = expression[0];
        const operationName = expression[1];
        const unaryOperation = customUnaryOperations[operationName];
        if (unaryOperation) {
          return { conditions: unaryOperation(fieldPath), meta };
        }

        // Extend the array size to three to handle "unary" operations specific for fieldPath type.
        // For example ['string', 'empty'] to ['string', 'empty', undefined] since value does not matter.
        expression.push(undefined);
      }

      if (expression.length % 2 !== 1) {
        throw new ValidationError(`Elements with odd size>3 are invalid: '${expr}'`);
      }

      // odd number of expressions - must be single connecting operator
      const operator = expression[1];
      const isLogicalOperator = ['and', 'or'].includes(operator);

      if (isLogicalOperator) {
        const hasAnotherOperator = expression.find((el, i) => i % 2 === 1 && el.toLowerCase() !== operator);

        if (hasAnotherOperator) {
          throw new ValidationError(
            `For expressions with 5+ size there must be only one connecting operator 'and' or 'or'.`
          );
        }

        const conditions = {};

        conditions[`$${operator}`] = expression
          .filter((el, i) => i % 2 === 0)
          .map((el) => parse(el, scheme, wholeExpression, meta))
          .map((result) => result.conditions);

        return { conditions, meta };
      }

      if (expression.length === 3) {
        const fieldName = expression[0];
        const value = expression[2];

        return { conditions: getFilterForField(fieldName, operator, value, scheme, wholeExpression, meta), meta };
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        throw e;
      }
      log.error(`Unable to parse filter expression ${expr}.`, e.stack);
      throw new ValidationError(`Unable to parse filter expression`);
    }

    throw new ValidationError(`Invalid filter expression format ${expr}`);
  };

  return m;
};
