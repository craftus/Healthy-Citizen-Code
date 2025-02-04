const GraphQlContext = require('./GraphQlContext');
const { getQuickFilterConditions } = require('../../graphql/quick-filter/util');

module.exports = class DevExtremeContext extends GraphQlContext {
  async init() {
    const { sort = {}, filter, perPage, page } = this.args;
    const { limit, limitPlusOne, skip } = this._getLimitSkipForPagination(perPage, page);
    const {
      filterParser: { parse },
      butil: { MONGO },
    } = this.appLib;
    const { dxQuery, quickFilterId } = filter || {};
    const { conditions: dxConditions } = parse(dxQuery, this.appModel);
    const quickFilterConditions = await getQuickFilterConditions(this.appLib, quickFilterId, this.userContext);
    this.mongoParams = {
      conditions: MONGO.and(dxConditions, quickFilterConditions),
      sort: this._getSort(sort),
      perPage: limit,
      limit: limitPlusOne,
      skip,
    };

    return this;
  }
};
