const Promise = require('bluebird');
const _ = require('lodash');
const log = require('log4js').getLogger('lib/queue');
const QueueError = require('../errors/queue-error');
const { getRedisConnection } = require('../util/redis');
const { Queue } = require('./util');

module.exports = (options) => {
  const m = {};
  m.redisClient = null;
  m.redisSubscriber = null;
  const queues = new Map();

  const { keyPrefix, redisUrl, removeOnComplete, removeOnFail } = options;

  m.isReady = () =>
    // RedisMock has field 'status', but has field cache.connected
    m.redisClient !== null && m.redisSubscriber !== null;

  m.init = async () => {
    if (!redisUrl) {
      return;
    }

    try {
      m.redisClient = await getRedisConnection({
        redisUrl,
        log,
        redisConnectionName: 'Bull_Redis_Client',
      });
      m.redisSubscriber = await getRedisConnection({
        redisUrl,
        log,
        redisConnectionName: 'Bull_Redis_Subscriber',
      });
    } catch (e) {
      log.error(`Unable to connect to Bull Redis by URL: ${redisUrl}.`);
      throw e;
    }
  };

  // implementation of https://github.com/OptimalBits/bull/blob/master/PATTERNS.md#reusing-redis-connections
  function createClient(type) {
    if (type === 'client') {
      return m.redisClient;
    }
    if (type === 'subscriber') {
      return m.redisSubscriber;
    }
    // 'bclient' type
    return getRedisConnection({
      redisUrl,
      options: { lazyConnect: false },
      log,
      redisConnectionName: `Bull_Redis_${_.startCase(type)}`,
    });
  }

  m.createQueue = (...args) => {
    if (!m.isReady()) {
      throw new QueueError(`Unable to createQueue, no connection to Bull Redis`);
    }

    const queueName = args[0];
    if (!_.isString(queueName)) {
      throw new QueueError(`Queue name must be set for createQueue`);
    }

    const additionalOptions = {
      defaultJobOptions: { removeOnComplete, removeOnFail },
      prefix: keyPrefix,
      createClient,
    };
    const lastIndex = args.length - 1;
    const lastArg = args[lastIndex];
    const isLastArgOptionsArg = _.isPlainObject(lastArg);
    if (isLastArgOptionsArg) {
      args[lastIndex] = { ...lastArg, ...additionalOptions };
    } else {
      args.push(additionalOptions);
    }

    const queue = new Queue(...args);
    queues.set(queueName, queue);

    return queue;
  };

  m.getQueue = (queueName) => {
    const queue = queues.get(queueName);
    if (!queue) {
      throw new QueueError(`Queue with name ${queueName} is not found`);
    }
    return queue;
  };

  // types: string[], start?: number, end?: number, asc?: boolean
  // ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused']
  // m.getJobs = (queueName, { types, start, end, asc }) => {
  //   const queue = m.getQueue(queueName);
  //   return queue.getJobs(types, start, end, asc);
  // };

  async function prepareJob(job, queueName, state = true) {
    if (!job) {
      return;
    }

    _.each(['timestamp', 'finishedOn', 'processedOn'], (dateField) => {
      const dateFieldTimestamp = job[dateField];
      if (dateFieldTimestamp) {
        job[dateField] = new Date(dateFieldTimestamp);
      }
    });

    job.queueName = queueName;

    if (_.isString(state)) {
      job.state = state;
    } else if (state === true) {
      job.state = await job.getState();
    }

    // job.logs = await queue.getJobLogs(job.id);
  }

  // Added queueName and state fields to source code of Job.prototype.toJSON
  m.getJobJson = (job) => ({
    id: job.id,
    name: job.name,
    data: job.data || {},
    queueName: job.queueName,
    state: job.state,
    opts: { ...job.opts },
    progress: job._progress,
    delay: job.delay, // Move to opts
    timestamp: job.timestamp,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    stacktrace: _.isArray(job.stacktrace) ? job.stacktrace[0] : null,
    returnvalue: job.returnvalue || null,
    finishedOn: job.finishedOn || null,
    processedOn: job.processedOn || null,
    creator: _.get(job, 'data.creator'),
  });

  m.getJobs = async ({ queueNames, jobTypes } = {}) => {
    const _queueNames = _.isEmpty(queueNames) ? queues.keys() : queueNames;
    const singleJobType = _.isArray(jobTypes) && jobTypes.length === 1 ? jobTypes[0] : undefined;
    const queuesJobs = [];
    await Promise.map(_queueNames, async (queueName) => {
      try {
        const queue = m.getQueue(queueName);
        const jobs = await queue.getJobs(jobTypes);
        await Promise.map(jobs, (job) => prepareJob(job, queueName, singleJobType));
        return queuesJobs.push(...jobs);
      } catch (e) {
        if (e instanceof QueueError) {
          // queue not found
          return;
        }
        log.warn(`Error occurred while getting jobs for queue '${queueName}'.`, e.stack);
      }
    });
    return queuesJobs;
  };

  m.getJob = async (queueName, jobId) => {
    const queue = m.getQueue(queueName);
    const job = await queue.getJob(jobId);
    await prepareJob(job, queueName);
    return job;
  };

  m.getJobLogs = (queueName, { jobId, start, end }) => {
    const queue = m.getQueue(queueName);
    return queue.getJobLogs(jobId, start, end);
  };

  m.getJobsByIds = async (queueName, jobIds) => {
    const queue = m.getQueue(queueName);
    const pipeline = m.redisClient.pipeline();
    _.each(jobIds, (jobId) => pipeline.hgetall(queue.toKey(jobId)));
    const redisResponses = await pipeline.exec();

    return Promise.map(redisResponses, (redisResponse, index) => {
      const jobId = jobIds[index];
      const job = getJobResponseByRedisData(queue, redisResponse, jobId);
      return prepareJob(job, queueName);
    });

    // this is how Job.fromId function gets value
    function getJobResponseByRedisData(_queue, redisJobData, jobId) {
      return require('bull/lib/utils').isEmpty(redisJobData) ? null : Queue.Job.fromJSON(_queue, redisJobData, jobId);
    }
  };

  m.resumeJob = (queueName) => {
    const queue = m.getQueue(queueName);
    return queue.resume();
  };

  m.pauseQueue = (queueName) => {
    const queue = m.getQueue(queueName);
    return queue.pause();
  };

  m.resumeQueue = (queueName) => {
    const queue = m.getQueue(queueName);
    return queue.resume();
  };

  // removeRepeatableByKey does not remove associated delayed job.
  // This approach is described here: https://github.com/OptimalBits/bull/issues/1400
  m.removeScheduledJob = async ({ queueName, jobKey, jobId }) => {
    const queue = m.getQueue(queueName);
    await queue.removeRepeatableByKey(jobKey);

    const jobs = await queue.getJobs(['delayed']);
    const jobToDelete = jobs.find((delayedJob) => {
      // IDs of repeatable jobs are composite, example: "repeat:2c835288a7a1df36a6c896e4c016a2a5:1564412682000"
      const tokens1 = String(delayedJob.id).split(':');
      const tokens2 = String(jobId).split(':');
      return tokens1[0] === tokens2[0] && tokens1[1] === tokens2[1];
    });

    if (jobToDelete) {
      await jobToDelete.remove();
      return jobToDelete;
    }
    return null;
  };

  m.getDelayedJob = async ({ queueName, jobId }) => {
    const queue = m.getQueue(queueName);
    const delayedJobs = await queue.getJobs(['delayed']);
    return delayedJobs.find((delayedJob) => {
      // IDs of repeatable jobs are composite, example: "repeat:2c835288a7a1df36a6c896e4c016a2a5:1564412682000"
      const tokens1 = String(delayedJob.id).split(':');
      const tokens2 = String(jobId).split(':');
      return tokens1[0] === tokens2[0] && tokens1[1] === tokens2[1];
    });
  };

  return m;
};
