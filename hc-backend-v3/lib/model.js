/**
 * @module model-util
 * This module provides utilities shared between multiple applications and allows models manipulation for
 * Conceptant applications.
 */
module.exports = function () {

    const log = require('log4js').getLogger('lib/model');
    const mongoose = require("mongoose");
    const fs = require("fs");
    const merge = require("merge");
    const async = require("async");
    const glob = require("glob");
    const moment = require('moment');
    const _ = require('lodash');
    const butil = require('./backend-util')();

    const schemaTransformers = require('./schema-transformers')();
    const Schema = mongoose.Schema;

    let m = {};

    /**
     * Contains model's metaschema
     * @type {{}}
     */
    m.metaschema = {};

    /**
     * Maps HC schema master file types to mongoose types
     * @enum {Object}
     */
    m.mongooseTypesMapping = {
        "String": String,
        "Date": Date,
        "Number": Number,
        "Boolean": Boolean,
        "Mixed": mongoose.Schema.Types.Mixed,
        "ObjectID": mongoose.Schema.Types.ObjectId,
        "String[]": [String],
        "Date[]": [Date],
        "Number[]": [Number],
        "Boolean[]": [Boolean],
        "Mixed[]": [mongoose.Schema.Types.Mixed],
        "ObjectID[]": [mongoose.Schema.Types.ObjectId],
        // the following fields will only contain file names
        "Image": String,
        "Video": String,
        "Audio": String,
        "File": [mongoose.Schema.Types.Mixed],
        "Image[]": [String],
        "Video[]": [String],
        "Audio[]": [String],
        "File": [mongoose.Schema.Types.Mixed],
        "Location": [Number]
    };

    /**
     * Combines all files in a directory into a single JSON representing the HC master schema
     * @param path path to the directory containing parts of the schema
     * @returns {Object} JSON containing the master model
     */
    m.getCombinedModel = (appModelPath, backendModelPath) => {
        const files = _.concat(glob.sync(appModelPath + "**/*.json"), glob.sync(`${backendModelPath}/**/*.json`));
        let model = {};
        files.forEach(function (file) {
            log.trace("Merging", file);
            let content = "";
            let parsedContent;
            try {
                content = fs.readFileSync(file);
                parsedContent = JSON.parse(content);
            } catch (e) {
                throw new Error(`Unable to parse model: "${e}" in file "${file}". Source: \n${content}`);
            }
            model = merge.recursive(true, model, parsedContent);
        });
        m.metaschema = model.metaschema;
        return model;
    };

    // Generating the mongoose model -------------------------------------------------------------

    /**
     * Gets complete mongoose-compatible schema definition based on JSON application model
     * @param {string} name name of the conceptant JSON element to generate mongoose schema definition for
     * @param {Object} obj - conceptant JSON element top generate mongoose schema for
     * @param {Object} mongooseModel mongoose quivalent of the model will go into this parameter
     */
    m.getMongooseSchemaDefinition = (name, obj, mongooseModel) => {
        /**
         * Sets one mongoose model attribute based on the parameters
         * @param obj app JSON model describing the attribute
         * @param objAttr app JSON attribute name
         * @param model mongoose model JSON
         * @param modelAttr mongoose model JSON attribtue name
         * @param useDefault if true then set the attribute to default value defined in schema.js
         */
        let setMongooseModelAttribute = function (obj, objAttr, model, modelAttr, useDefault) {
            if (obj[objAttr]) {
                model[modelAttr] = obj[objAttr];
            } else if (useDefault) {
                model[modelAttr] = m.metaschema[modelAttr].default;
            }
        };
        if (obj.type == "Group") {
            // do nothing
        } else if (obj.type == "Schema") {
            obj.fields["generatorBatchNumber"] = {
                "type": "String",
                "visible": false,
                //"comment": "Do not set this to anything for real records, they may get wiped out as autogenerated otherwise", // this will be eliminated by backed
                "generated": true,
                "fullName": "Generator Batch Number",
                "description": "Set to the ID of generator batch for synthetic records"
            };
            for (let field in obj.fields) {
                if (obj.fields.hasOwnProperty(field)) {
                    m.getMongooseSchemaDefinition(field, obj.fields[field], mongooseModel);
                }
            }
        } else if (obj.type == "Subschema") {
            // TODO: Move this into validateModelPart
            obj.fields["_id"] = {
                "type": "ObjectID",
                "visible": false,
                //"comment": "This is internal fields identifying each element of subschema", // this will be eliminated by backend
                "generated": true,
                "fullName": "Subschema element id",
                "description": "Subschema element id",
                "generatorSpecification": ["_id()"] // need to specify here because of the order of operations
            };
            mongooseModel[name] = [{}];
            for (let field in obj.fields) {
                if (obj.fields.hasOwnProperty(field)) {
                    m.getMongooseSchemaDefinition(field, obj.fields[field], mongooseModel[name][0]);
                }
            }
        } else if (obj.type == "Object") {
            mongooseModel[name] = {};
            for (let field in obj.fields) {
                if (obj.fields.hasOwnProperty(field)) {
                    m.getMongooseSchemaDefinition(field, obj.fields[field], mongooseModel[name]);
                }
            }
        } else if (obj.type == "Array") {
            mongooseModel[name] = [{}];
            for (let field in obj.fields) {
                if (obj.fields.hasOwnProperty(field)) {
                    m.getMongooseSchemaDefinition(field, obj.fields[field], mongooseModel[name][0]);
                }
            }
            // TODO: currently lookups are only supported for individual ObjectID. Add support of any types of fields and arrays of fields in the future
        } else if (obj.type == "ObjectID") {
            mongooseModel[name] = {type: Schema.Types.ObjectId, index: '2d'};
        } else if (obj.type == "Location") {
            mongooseModel[name] = {type: [Number]};
            setMongooseModelAttribute(obj, 'index', mongooseModel[name], 'index', true);
            if (obj.hasOwnProperty('lookup') && obj["lookup"].hasOwnProperty("table")) {
                //mongooseModel[name]["ref"] = obj.lookup["table"];
            }
        } else {
            mongooseModel[name] = {
                type: m.mongooseTypesMapping[obj.type]
            };
            setMongooseModelAttribute(obj, 'unique', mongooseModel[name], 'unique', false);
            setMongooseModelAttribute(obj, 'index', mongooseModel[name], 'index', false);
            // TODO: min, max
            // TODO: ref: http://stackoverflow.com/questions/26008555/foreign-key-mongoose ?
            // TODO:  min/maxLength, validator, validatorF, default, defaultF, listUrl from definition?
            if (obj.hasOwnProperty('list')) {
                if (appModelHelpers.Lists[obj.list]) {
                    mongooseModel[name].enum = Object.keys(appModelHelpers.Lists[obj.list]);
                } else {
                    throw new Error(`List "${obj.list}" in attribute "${name}" is not defined, please update helpers/lists.js. Attribute Specification: ${JSON.stringify(obj, null, 2)}`);
                }
            }
            /*
             if(obj.hasOwnProperty('validate')) {
             delete mongooseModel[name].validate; // appModel validator definitions are not compatible with mongoose
             }
             */
        }
    };

    /**
     * Validates that the app model matches metaschema
     * Also augments the model with defaults for subtypes, lookups etc
     * @returns {Array} array containing list of problems in the model
     */
    // TODO: rewrite using m.traverseAppModel ?
    // TODO: split this method into multiple functions, it's getting big
    m.validateAndCleanupAppModel = () => {
        let errors = [];
        let allowedAttributes = _.keys(appModel.metaschema);

        let setAttribute = (part, attr) => {
            if (appModel.metaschema.hasOwnProperty(attr) && appModel.metaschema[attr].hasOwnProperty('default') && !part.hasOwnProperty(attr)) {
                part[attr] = appModel.metaschema[attr].default;
            }
        };

        let validateModelPart = (part, path) => {
            // merge type defaults
            part.type = _.get(part, 'type', appModel.metaschema.type.default);
            let defaults = _.get(appModel, `typeDefaults.fields.${part.type}`, {});
            let doNotOverwrite = (objValue, srcValue) => { // objValue is the target value
                if (_.isArray(objValue) && _.isArray(srcValue)) {
                    return srcValue.concat(objValue);
                } else if ('undefined' == typeof objValue) {
                    return _.cloneDeep( srcValue );
                } else {
                    return objValue;
                }
            };
            _.mergeWith(part, defaults, doNotOverwrite);
            // merge subtype defaults
            if (part.hasOwnProperty('subtype')) {
                let defaults = _.get(appModel, `subtypeDefaults.fields.${part.subtype}`, {});
                _.mergeWith(part, defaults, doNotOverwrite);
            }
            // convert transformers to arrays
            if (part.hasOwnProperty('transform')) {
                if ('string' == typeof part.transform) {
                    part.transform = [part.transform];
                }
            }
            if (part.hasOwnProperty('defaultSortBy')) {
                if ('object' != typeof part.defaultSortBy) {
                    errors.push(`defaultSortBy in ${path.join('.')} has incorrect format, must be an object`);
                } else {
                    _.each(part.defaultSortBy, (val, key) => {
                        if (val !== -1 && val !== 1) {
                            errors.push(`defaultSortBy in ${path.join('.')} has incorrect format, the sorting order must be either 1 or -1`);
                        }
                        if (!part.fields.hasOwnProperty(key) && key !== '_id') {
                            errors.push(`defaultSortBy in ${path.join('.')} refers to nonexisting field "${key}"`);
                        }
                    })
                }
            }
            // expand validators
            if (part.hasOwnProperty('validate')) {
                if ('string' == typeof part.validate) {
                    part.validate = [part.validate];
                }
                part.validate = _.map(part.validate, (handler) => {
                    let matches;
                    let handlerSpec;
                    if ('string' == typeof handler && ( matches = handler.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\((.*)\))?$/) )) {
                        let handlerName = matches[1];
                        let matchedArguments = matches[3].split(',');
                        if (appModel.validatorShortcuts[handlerName]) {
                            handlerSpec = {
                                validator: handlerName,
                                arguments: _.mapValues(appModel.validatorShortcuts[handlerName].arguments, (o) => {
                                    return o.replace(/\$(\d+)/g, (match, p1) => {
                                        return matchedArguments[parseInt(p1) - 1];
                                    });
                                }),
                                errorMessages: appModel.validatorShortcuts[handlerName].errorMessages
                            }
                        } else {
                            errors.push(`No validator shortcut is provided for validator ${handlerName}`);
                        }
                    } else if ('object' === typeof handler && handler.validator) {
                        handlerSpec = handler;
                    } else {
                        errors.push(`Unable to expand validator ${JSON.stringify(handler)} for ${path.join('.')}`);
                    }
                    return handlerSpec;
                });
                // make sure all validators exist
                _.forOwn(part.validate, (val, key) => {
                    if (!appModelHelpers.Validators.hasOwnProperty(val.validator)) {
                        errors.push(`Validator "${val.validator}" doesn't exist in ${path.join('.')}`);
                    }
                });
            }
            // make sure all transformers exist
            if (part.hasOwnProperty('transform')) {
                _.forEach(part.transform, (val, key) => {
                    if (_.isArray(val)) {
                        if (!appModelHelpers.Transformers.hasOwnProperty(val[0])) {
                            errors.push(`Transformer "${val[0]}" doesn't exist in ${path.join('.')}`);
                        }
                        if (!appModelHelpers.Transformers.hasOwnProperty(val[1])) {
                            errors.push(`Transformer "${val[1]}" doesn't exist in ${path.join('.')}`);
                        }
                        if (val.length > 2) {
                            errors.push(`Transformer "${val}" doesn't look right in ${path.join('.')} (if array then must contain only two elements)`);
                        }

                    } else if (!appModelHelpers.Transformers.hasOwnProperty(val)) {
                        errors.push(`Transformer "${val}" doesn't exist in ${path.join('.')}`);
                    }
                });
            }
            // lookups
            if (part.hasOwnProperty('lookup')) {
                if (!part.hasOwnProperty('transform')) { // if there is transform, it's already an array, see above
                    part.transform = [];
                }
                part.transform.push("addLookupDetails");
                if (!part.lookup.table) {
                    errors.push(`Lookup in ${path.join('.')} doesn't have property "table"`);
                } else {
                    // TODO: add support for multiple tables
                    let validateLookupTable = (tableName, foreignKey, label) => {
                        if (!appModel.models[tableName]) {
                            errors.push(`Lookup in ${path.join('.')} refers to nonexisting collection "${tableName}"`);
                        } else {
                            if (!foreignKey) {
                                errors.push(`Lookup in ${path.join('.')} doesn't have property "foreignKey"`);
                            } else if (!appModel.models[tableName].fields[foreignKey] && part.lookup.foreignKey !== '_id') {
                                errors.push(`Lookup in ${path.join('.')} refers to nonexisting foreignKey "${foreignKey}"`);
                            }
                            if (!label) {
                                errors.push(`Lookup in ${path.join('.')} doesn't have property "label"`);
                            } else if (!appModel.models[tableName].fields[label]) {
                                errors.push(`Lookup in ${path.join('.')} refers to nonexisting label "${label}"`);
                            }
                        }
                    };
                    if(_.isString(part.lookup.table)) {
                        validateLookupTable(part.lookup.table, part.lookup.foreignKey, part.lookup.label);
                    } else {
                        _.keys(part.lookup.table).forEach((key,val) => {
                            validateLookupTable(key, val.foreignKey, val.label);
                        });
                    }
                    if (!part.lookup.id) {
                        errors.push(`Lookup in ${path.join('.')} doesn't have property "id"`);
                    } else {
                        // TODO: validate ID uniqueness? Currently appLookups are only detected in lib/app.js#addRoutesToSubschemas
                    }
                }
            }
            // make sure schema and subschema names are plural
            if (( 'Schema' == part.type || 'Subschema' == part.type) && !path[path.length - 1].endsWith('s')) {
                errors.push(`Schema and subschema names must be plural in ${path.join('.')}`);
            }
            // add _id field to schemas and subschemas
            /*
            if ('Schema' == part.type) {
                part.fields["_id"] = {
                    "type": "ObjectID",
                    "visible": false,
                    "comment": "Added to implicitly include in all datatables",
                    "generated": true,
                    "fullName": "Schema element id",
                    "description": "Schema element id"
                };
            }
            if ('Subschema' == part.type) {
                part.fields["_id"] = {
                    "type": "ObjectID",
                    "visible": false,
                    "comment": "Added to implicitly include in all datatables",
                    "generated": true,
                    "fullName": "Subschema element id",
                    "description": "Subschema element id",
                    "generatorSpecification": ["_id()"] // need to specify here because of the order of operations
                };
            }
            */
            // make sure all required attributes are in place
            _.forOwn(appModel.metaschema, (val, key) => {
                if (val.required && !part.hasOwnProperty(key)) {
                    errors.push(`Attribute ${path.join('.')} doesn't have required property "${key}"`);
                }
            });
            // make sure all defaults are set for visible
            if (part.type) {
                if (part.type === 'Schema' || part.type === 'Subschema') {
                    setAttribute(part, 'requiresAuthentication');
                    setAttribute(part, 'defaultSortBy');
                } else {
                    setAttribute(part, 'visible');
                    setAttribute(part, 'visibilityPriority');
                    setAttribute(part, 'width');
                }
            }
            // validate and cleanup individual fields
            _.forOwn(part, (val, key) => {
                if (!_.includes(allowedAttributes, key)) { // attribute of app model is listed in metadata
                    errors.push(`Unknown attribute ${_.concat(path, key).join('.')}`);
                } else {
                    if ('fields' == key) {  // process fileds
                        validateModelParts(val, _.concat(path, key));
                    }
                    if (appModel.metaschema[key].hasOwnProperty('list') && !_.includes(appModel.metaschema[key].list, val)) { // value is allowed in metaschema
                        errors.push(`Invalid value for ${_.concat(path, key).join('.')}`);
                    }
                    if (_.includes(['comment'], key)) {
                        delete part[key];
                    }
                    if ('list' == key && 'string' == typeof val && !appModelHelpers.Lists.hasOwnProperty(val)) { // list mentioned in app model exists in lists.js
                        errors.push(`Attribute ${_.concat(path, key).join('.')} refers to unknown list ${val}`);
                    }
                }
            });
        };

        let validateModelParts = (parts, path) => {
            _.forOwn(parts, (val, key) => {
                validateModelPart(val, _.concat(path, key));
            });
        };

        let validateInterfacePart = (part, path) => {
            // expand file references (such as external templates or data)
            //supportsExternalData
            _.forEach( _.reduce(m.metaschema, function(res, val, key) {if(val.supportsExternalData) {res.push(key)} return res}, []), (reference) => {
                if (part.hasOwnProperty(reference) && 'object' === typeof part[reference]) {
                    if( part[reference].type && 'file' === part[reference].type && 'string' === typeof part[reference].link ) {
                        let isJson = part[reference].link.endsWith('.json');
                        part[reference] = fs.readFileSync( `${process.env.APP_MODEL_DIR}/model/files/${part[reference].link}`, 'utf-8' );
                        if(isJson) {
                            part[reference] = JSON.parse(part[reference]);
                        }
                    }
                }
            });
            // validate and cleanup individual fields
            _.forOwn(part, (val, key) => {
                if ('fields' == key) {  // process fileds
                    validateInterfaceParts(val, _.concat(path, key));
                }
                if (_.includes(['comment'], key)) {
                    delete part[key];
                }
            });
        };

        let validateInterfaceParts = (parts, path) => {
            _.forOwn(parts, (val, key) => {
                validateInterfacePart(val, _.concat(path, key));
            });
        };

        validateModelParts(appModel.models, []);

        if(appModel.interface) {
            validateInterfaceParts(appModel.interface, []); // TODO: add test for this
            _.forEach( ['loginPage', 'charts', 'pages'], (interfacePart) => {
                if(appModel.interface[interfacePart]) {
                    validateInterfaceParts(appModel.interface[interfacePart], []);
                }
            });
        }
        return errors;
    };

    /**
     * Generates mongoose models based on models JSON and puts them in m.mongooseModels hash
     * Note that some methods require m.mongoos_models to be populated before they work correctly
     * @param db the mongoose db connection
     * @param models JSON defining the model
     * @param cb callback(err)
     */
    m.generateMongooseModels = (db, models, cb) => {
        async.eachOfSeries(models, function (model, name, cb) {
            let mongooseSchemaDefinition = {};
            m.getMongooseSchemaDefinition(null, model, mongooseSchemaDefinition);
            let err;
            try {
                const schema = new mongoose.Schema(mongooseSchemaDefinition, {strict: false, versionKey: false});
                if (model.schemaTransform) {
                    if ('string' == typeof model.schemaTransform) {
                        model.schemaTransform = [model.schemaTransform];
                    }
                    model.schemaTransform.forEach((transformer) => {
                        schemaTransformers[transformer](schema);
                    });
                }
                //log.trace( `Generating model ${name}:\n${JSON.stringify(mongooseSchemaDefinition,null,4)}` );
                db.model(name, schema);
            } catch (e) {
                err = "Error: " + e + ". Unable to generate mongoose model " + name;
                log.error("MDL001", err);
            }
            cb(err);
        }, cb);
    };
    return m;
};
