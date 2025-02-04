const should = require('should');
const assert = require('assert');
const _ = require('lodash');

const {
  checkForEqualityConsideringInjectedFields,
  samples: { sampleData0, sampleData1, sampleData2, sampleDataToCompare0, sampleDataToCompare2 },
  getMongoConnection,
  setAppAuthOptions,
  prepareEnv,
  checkItemSoftDeleted,
  conditionForActualRecord,
  apiRequest,
} = require('../test-util');

// NOTE: Passing arrow functions (“lambdas”) to Mocha is discouraged (http://mochajs.org/#asynchronous-code)
describe('V5 Backend CRUD', function () {
  before(async function () {
    this.appLib = prepareEnv();

    setAppAuthOptions(this.appLib, {
      requireAuthentication: false,
      enablePermissions: false,
    });

    const [db] = await Promise.all([getMongoConnection(this.appLib.options.MONGODB_URI), this.appLib.setup()]);
    this.db = db;
  });

  after(async function () {
    await this.db.dropDatabase();
    await Promise.all([this.db.close(), this.appLib.shutdown()]);
  });

  beforeEach(async function () {
    const sampleDataModel2 = [{ data: 0 }, { data: 1 }, { data: 2 }, { data: 3 }].map((d) => ({
      ...d,
      ...conditionForActualRecord,
    }));
    await Promise.all([this.db.collection('model1s').deleteMany({}), this.db.collection('model2s').deleteMany({})]);
    await Promise.all([
      this.db.collection('model1s').insertOne(sampleData1),
      this.db.collection('model1s').insertOne(sampleData2),
      this.db.collection('model2s').insertMany(sampleDataModel2),
    ]);
  });

  // Create item
  describe('Create Item', function () {
    describe('1st level', function () {
      it('posts and stores 1st level data', async function () {
        const res = await apiRequest(this.appLib)
          .post('/model1s')
          .send({ data: sampleData0 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200);
        res.body.success.should.equal(true, res.body.message);
        res.body.should.have.property('id');
        const savedId = res.body.id;
        const res2 = await apiRequest(this.appLib)
          .get(`/model1s/${sampleData0._id}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200);
        res2.body.success.should.equal(true);
        const { data } = res2.body;

        checkForEqualityConsideringInjectedFields(data, sampleDataToCompare0);
        assert(data._id.toString() === savedId);
      });
    });

    describe('1st level, wrong path', function () {
      it('show error message', async function () {
        const res = await apiRequest(this.appLib)
          .post(`/model1s1/`)
          .send({ data: sampleData0.encounters[1].vitalSigns[1] })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(404);
        const { message, success } = res.body;
        const { getFullRoute } = this.appLib;
        const { API_PREFIX } = this.appLib.config;
        success.should.equal(false);
        message.should.equal(`${getFullRoute(API_PREFIX, '/model1s1/')} does not exist`);
      });
    });

    // Get Items ---------------------------------------------------------------------------
    describe('Get Items', function () {
      describe('1st level', function () {
        it('returns correct 1st level data', async function () {
          const res = await apiRequest(this.appLib)
            .get('/model1s')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          res.statusCode.should.equal(200, JSON.stringify(res, null, 4));
          res.body.success.should.equal(true, res.body.message);
          res.body.data.length.should.equal(1); // since the collection limit is 1
          checkForEqualityConsideringInjectedFields(res.body.data[0], sampleDataToCompare2); // since sorting is by _id
        });
      });

      describe('from model 2 capped to 3 items in return', function () {
        it('returns 3 items', async function () {
          const res = await apiRequest(this.appLib)
            .get(`/model2s`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          res.statusCode.should.equal(200, JSON.stringify(res, null, 4));
          res.body.success.should.equal(true, res.body.message);
          res.body.data.length.should.equal(3);
        });
      });

      describe('1st level with extra query parameter', function () {
        it('returns 3 items', async function () {
          const res = await apiRequest(this.appLib)
            .get(`/model2s?_=1489752996234`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          res.statusCode.should.equal(200, JSON.stringify(res, null, 4));
          res.body.success.should.equal(true, res.body.message);
          res.body.data.length.should.equal(3);
        });
      });
    });

    // Get Item ------------------------------------------------------------
    describe('Get item', function () {
      describe('1st level', function () {
        it('returns correct 1st level data', async function () {
          const res = await apiRequest(this.appLib)
            .get('/model1s/587179f6ef4807703afd0dff')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          res.statusCode.should.equal(200, JSON.stringify(res, null, 4));
          res.body.success.should.equal(true, res.body.message);
          checkForEqualityConsideringInjectedFields(res.body.data, sampleDataToCompare2);
        });
      });
    });

    // Update Item
    describe('Update Item', function () {
      describe('1st level', function () {
        it('puts and stores 1st level data', async function () {
          const putRes = await apiRequest(this.appLib)
            .put(`/model1s/${sampleData1._id}`)
            .send({ data: sampleData0 })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          putRes.statusCode.should.equal(200, JSON.stringify(putRes, null, 4));
          putRes.body.success.should.equal(true, putRes.body.message);

          const getRes = await apiRequest(this.appLib)
            .get(`/model1s/${sampleData1._id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          getRes.statusCode.should.equal(200, JSON.stringify(getRes, null, 4));
          getRes.body.success.should.equal(true, getRes.body.message);

          checkForEqualityConsideringInjectedFields(
            _.omit(getRes.body.data, ['_id']),
            _.omit(sampleDataToCompare0, ['_id'])
          );
        });

        it('puts empty object', async function () {
          const putRes = await apiRequest(this.appLib)
            .put(`/model1s/${sampleData1._id}`)
            .send({ data: {} })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          putRes.statusCode.should.equal(200, JSON.stringify(putRes, null, 4));
          putRes.body.success.should.equal(true, putRes.body.message);

          const getRes = await apiRequest(this.appLib)
            .get(`/model1s/${sampleData1._id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          getRes.statusCode.should.equal(200, JSON.stringify(getRes, null, 4));
          getRes.body.success.should.equal(true, getRes.body.message);
        });
      });
    });

    // Delete Item
    describe('Delete Item', function () {
      describe('1st level', function () {
        it('soft deletes 1st level data', async function () {
          const delRes = await apiRequest(this.appLib)
            .del(`/model1s/${sampleData1._id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          delRes.statusCode.should.equal(200, JSON.stringify(delRes, null, 4));
          delRes.body.success.should.equal(true, delRes.body.message);

          const getRes = await apiRequest(this.appLib)
            .get(`/model1s/${sampleData1._id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
          getRes.statusCode.should.equal(400, JSON.stringify(getRes, null, 4));
          getRes.body.success.should.equal(false);

          const deletedAt = await checkItemSoftDeleted(this.appLib.db, 'model1s', sampleData1._id);
          should(deletedAt).not.be.undefined();
        });
      });
    });
  });
});
