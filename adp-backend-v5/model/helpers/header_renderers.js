/**
 * HeaderRenderers ares used to render header if form fields for complex types(Object, Array) and Groups
 *
 * @param {object} args
 *
 * args.fieldData
 * args.formData
 * args.fieldSchema
 * args.pathToDat
 */

module.exports = () => {
  const m = {
    schemaField(args) {
      const name = _.get(args, `fieldData[${args.index}][$key]`) || '[undefined name]';
      const type = _.get(args, `fieldData[${args.index}].type`) || '[undefined type]';

      return `${name} : ${type}`;
    },
  };
  return m;
};
