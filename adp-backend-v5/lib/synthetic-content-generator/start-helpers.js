const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const JSON5 = require('json5');

const { combineModels } = require('../util/model');
const { mongoConnect } = require('../util/mongo');
const { getAbsolutePath } = require('../../config/util');
const { globSyncAsciiOrder } = require('../util/glob');

const defaultBatchName = new Date().toISOString();
const defaultCount = 10;
const defaultExcludeCollections = '["users","roles","files", "dxGridViews", "datasets"]';

function getEnv(corePath, schemaPath) {
  const coreEnv = dotenv.load({ path: path.resolve(corePath, '.env') }).parsed;
  const schemaEnv = {};
  _.each(schemaPath, (p) => {
    _.merge(schemaEnv, dotenv.load({ path: path.resolve(p, '.env') }).parsed);
  });

  return _.merge(coreEnv, schemaEnv);
}

// TODO: in the future get rid of default params, it should be set dynamically with pregenerators
// Pregenerators are launched sequentially with paramsForGeneratorFiles passed in it to build final paramsForGeneratorFiles.
async function getParamsForGeneratorFiles({ appLib, pregeneratorFiles, batchName, uploadDir }) {
  const pregeneratorSpecs = _.get(appLib, 'appModel.interface.app.generatorSpecification', []);
  const pregeneratorFunctions = {};

  _.each(pregeneratorFiles, (file) => {
    _.merge(pregeneratorFunctions, require(file));
  });

  // create new connection since reusing appLib.db causes weird low-level 'ERR_MULTIPLE_CALLBACK' errors
  const { db } = await mongoConnect(appLib.config.MONGODB_URI);
  // default params
  const paramsForGeneratorFiles = {
    random: require('../util/random').random,
    chance: require('../util/random').chance,
    ScgError: require('./errors/scg-error'),
    batchName,
    handleUpload: (file) => appLib.file.util.handleUpload({ files: [file], uploadDir }),
    db,
    dba: appLib.dba,
  };

  const invalidPregeneratorNames = [];
  await Promise.mapSeries(pregeneratorSpecs, (spec) => {
    const { generator: pregeneratorName, params: pregeneratorParams = {} } = spec;
    const pregeneratorFunction = pregeneratorFunctions[pregeneratorName];
    if (!pregeneratorFunction) {
      invalidPregeneratorNames.push(pregeneratorName);
    }
    pregeneratorParams.appConfig = appLib.config;
    return pregeneratorFunction({ pregeneratorParams, paramsForGeneratorFiles });
  });

  if (!_.isEmpty(invalidPregeneratorNames)) {
    throw new Error(
      `Invalid pregenerator specification. Unable to find pregenerators: ${invalidPregeneratorNames.join(', ')}`
    );
  }

  return paramsForGeneratorFiles;
}

function getHelperFiles(corePath, schemaPath, helperName) {
  return _.concat(
    globSyncAsciiOrder(`${corePath}/model/helpers/${helperName}/**/*.js`),
    globSyncAsciiOrder(`${corePath}/model/helpers/${helperName}.js`),
    _.flatten(
      schemaPath.map((p) => [
        ...globSyncAsciiOrder(`${p}/helpers/${helperName}/**/*.js`),
        ...globSyncAsciiOrder(`${p}/helpers/${helperName}.js`),
      ])
    )
  );
}

function getGenerators({ generatorFiles, paramsForGeneratorFiles }) {
  const generators = {};

  _.each(generatorFiles, (file) => {
    _.merge(generators, require(file)(paramsForGeneratorFiles));
  });

  return generators;
}

function validateArgs(args) {
  const { corePath, schemaPath = [], mongoUrl, count = defaultCount, batchName = defaultBatchName, uploadDir } = args;
  let { excludeCollections, includeCollections } = args;

  const errors = [];

  if (!mongoUrl) {
    errors.push(`Argument 'mongoUrl' must be specified.`);
  }
  if (!_.isNumber(count) || count < 0) {
    errors.push(`Argument 'count' must be a positive number.`);
  }
  if (!corePath) {
    errors.push(`Argument 'corePath' must be specified.`);
  }
  const corePathAbsolute = path.resolve(process.cwd(), corePath);
  if (!fs.pathExistsSync(corePathAbsolute)) {
    errors.push(`Argument 'corePath' must be an existing directory (relative or absolute).`);
  }

  const appRoot = path.resolve(__dirname, '../../');
  const schemaAbsolutePaths = schemaPath
    .split(',')
    .map((p) => getAbsolutePath(appRoot, p))
    .filter((p) => p);

  _.each(schemaAbsolutePaths, (p) => {
    if (!fs.pathExistsSync(p)) {
      errors.push(`Argument 'schemaPath' contains '${p}', which must be an existing directory (relative or absolute).`);
    }
  });

  if (!batchName) {
    errors.push(`Argument 'batchName' must be specified.`);
  }
  if (excludeCollections && includeCollections) {
    errors.push(
      'Arguments excludeCollections and includeCollections are mutually exclusive, they should not be specified in the same call'
    );
  }

  if (includeCollections) {
    const includeCollectionsErrMsg = `Argument includeCollections=${includeCollections} must be an array of collection names if specified`;
    try {
      const parsed = JSON5.parse(includeCollections);
      if (!_.isArray(parsed)) {
        errors.push(includeCollectionsErrMsg);
      } else {
        includeCollections = parsed;
      }
    } catch (e) {
      errors.push(includeCollectionsErrMsg);
    }
  } else {
    const excludeCollectionsErrMsg = `Argument excludeCollections=${excludeCollections} must be an array of collection names if specified`;
    excludeCollections = excludeCollections || defaultExcludeCollections;
    try {
      const parsed = JSON5.parse(excludeCollections);
      if (!_.isArray(parsed)) {
        errors.push(excludeCollectionsErrMsg);
      } else {
        excludeCollections = parsed;
      }
    } catch (e) {
      errors.push(excludeCollectionsErrMsg);
    }
  }

  return {
    errors,
    args: {
      corePath: corePathAbsolute,
      schemaPath: schemaAbsolutePaths,
      mongoUrl,
      count,
      batchName,
      uploadDir,
      excludeCollections,
      includeCollections,
    },
  };
}

async function prepareAppLib(corePath, schemaPath) {
  const appLib = {};
  require('dotenv').load({ path: path.resolve(`${__dirname}/../../.env`) });

  appLib.errors = require('../errors');
  appLib.butil = require('../util/util');

  appLib.transformers = require('../transformers')(appLib);
  const helperDirPaths = [`${corePath}/model/helpers`, ...schemaPath.map((p) => `${p}/helpers`)];
  const buildAppModelCodeOnStart = false;
  appLib.helperUtil = await require('../helper-util')(appLib, helperDirPaths, buildAppModelCodeOnStart);
  appLib.dba = require('../database-abstraction')(appLib);

  const { model } = await combineModels({
    modelSources: [`${corePath}/model/model`, ...schemaPath.map((p) => `${p}/model`)],
    log: console.log.bind(console),
    appModelProcessors: appLib.appModelHelpers.appModelProcessors,
    macrosDirPaths: [...schemaPath.map((p) => `${p}/macros`), `${corePath}/model/macros`],
  });
  appLib.appModel = model;
  mergePregenerators(appLib.appModel);

  appLib.accessCfg = require('../access/access-config');
  appLib.allActionsNames = [...appLib.accessCfg.DEFAULT_ACTIONS, ..._.keys(appLib.appModelHelpers.CustomActions)];

  appLib.accessUtil = require('../access/access-util')(appLib);
  appLib.file = require('../file')(appLib);
  appLib.getAuthSettings = () => appLib.appModel.interface.app.auth;
  return appLib;

  function mergePregenerators(appModel) {
    const pregenerators = appModel.interface.app.generatorSpecification;
    if (_.isEmpty(pregenerators)) {
      return;
    }

    const deduplicatedPregenerators = [];
    const handledGenerators = new Set();
    _.each(pregenerators, (obj) => {
      const pregeneratorName = obj.generator;
      if (handledGenerators.has(pregeneratorName)) {
        return;
      }
      const lastDeclaredPregenerator = _.findLast(
        pregenerators,
        (declaredLast) => pregeneratorName === declaredLast.generator
      );
      deduplicatedPregenerators.push(lastDeclaredPregenerator);
      handledGenerators.add(pregeneratorName);
    });

    appModel.interface.app.generatorSpecification = deduplicatedPregenerators;
  }
}

function injectListValues(appLib) {
  const userPermissions = new Set(Object.values(appLib.accessCfg.PERMISSIONS));
  const inlineContext = {};
  return appLib.accessUtil.injectListValues(userPermissions, inlineContext, appLib.appModel.models);
}

module.exports = {
  validateArgs,
  prepareAppLib,
  mongoConnect,
  injectListValues,
  getParamsForGeneratorFiles,
  getGenerators,
  getHelperFiles,
  getEnv,
};
