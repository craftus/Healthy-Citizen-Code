const _ = require('lodash');
require('should');

const {
  auth: { user, loginWithUser },
  getMongoConnection,
  prepareEnv,
  apiRequest,
  setAppOptions,
} = require('../test-util');

const menuPart = {
  interface: {
    mainMenu: {
      type: 'Menu',
      fullName: 'Main Menu',
      default: '/jobs',
      fields: {
        menuDashboardLinkNoScopes: {
          type: 'MenuDashboardLink',
          fullName: 'menuDashboardLinkNoScopes',
          link: 'techDashboard',
          icon: {
            type: 'font-awesome',
            link: 'home',
          },
        },
        menuDashboardLinkWithScopes: {
          type: 'MenuDashboardLink',
          fullName: 'menuDashboardLinkWithScopes',
          link: 'demoDashboard',
          icon: {
            type: 'font-awesome',
            link: 'bar-chart',
          },
          scopes: {
            userOrGuestScope: {
              permissions: [['accessAsUser', 'accessAsGuest']],
            },
          },
        },
        menuDashboardLinkWithImpracticableScope: {
          type: 'MenuDashboardLink',
          fullName: 'menuDashboardLinkWithImpracticableScope',
          link: 'demoDashboard',
          icon: {
            type: 'font-awesome',
            link: 'bar-chart',
          },
          scopes: {
            impracticableScope: {
              permissions: ['accessAsSuperAdmin', 'accessFromDesktop', 'accessFromCar'],
            },
          },
        },
        menuItemNoScopes: {
          type: 'MenuItem',
          fullName: 'menuItemNoScopes',
          link: '/menuItemNoScopeLink',
          icon: {
            type: 'font-awesome',
            link: 'home',
          },
        },
        menuItemWithScopes: {
          type: 'MenuItem',
          fullName: 'menuItemWithScopes',
          link: '/menuItemWithScopesLink',
          icon: {
            type: 'font-awesome',
            link: 'user',
          },
          scopes: {
            userOrGuestScope: {
              permissions: [['accessAsUser', 'accessAsGuest']],
            },
          },
        },
        menuItemWithImpracticableScope: {
          type: 'MenuItem',
          fullName: 'menuItemWithScopes',
          link: '/menuItemWithImpracticableScope',
          icon: {
            type: 'font-awesome',
            link: 'user',
          },
          scopes: {
            impracticableScope: {
              permissions: ['accessAsSuperAdmin', 'accessFromDesktop', 'accessFromCar'],
            },
          },
        },
        menuGroupNoScopes: {
          type: 'MenuGroup',
          fullName: 'menuGroupNoScopes',
          icon: {
            type: 'font-awesome',
            link: 'book',
          },
          fields: {
            nestedMenuItemWithAvailableScopes: {
              type: 'MenuItem',
              fullName: 'nestedMenuItemWithAvailableScopes',
              link: '/refrigerantTypes',
              scopes: {
                userOrGuestScope: {
                  permissions: [['accessAsUser', 'accessAsGuest']],
                },
              },
            },
            nestedMenuItemWithImpracticableScope: {
              type: 'MenuItem',
              fullName: 'nestedMenuItemWithImpracticableScope',
              link: '/manufacturers',
              scopes: {
                impracticableScope: {
                  permissions: ['accessAsSuperAdmin', 'accessFromDesktop', 'accessFromCar'],
                },
              },
            },
          },
        },
        menuGroupWithScopes: {
          type: 'MenuGroup',
          fullName: 'menuGroupWithScopes',
          icon: {
            type: 'font-awesome',
            link: 'book',
          },
          scopes: {
            userOrGuestScope: {
              permissions: [['accessAsUser', 'accessAsGuest']],
            },
          },
          fields: {
            nestedMenuItemWithAvailableScopes: {
              type: 'MenuItem',
              fullName: 'nestedMenuItemWithAvailableScopes',
              link: '/refrigerantTypes',
              scopes: {
                userOrGuestScope: {
                  permissions: [['accessAsUser', 'accessAsGuest']],
                },
              },
            },
            nestedMenuItemWithImpracticableScope: {
              type: 'MenuItem',
              fullName: 'nestedMenuItemWithImpracticableScope',
              link: '/manufacturers',
              scopes: {
                impracticableScope: {
                  permissions: ['accessAsSuperAdmin', 'accessFromDesktop', 'accessFromCar'],
                },
              },
            },
          },
        },
        menuGroupWithImpracticableScope: {
          type: 'MenuGroup',
          fullName: 'menuGroupWithImpracticableScope',
          icon: {
            type: 'font-awesome',
            link: 'book',
          },
          scopes: {
            impracticableScope: {
              permissions: ['accessAsSuperAdmin', 'accessFromDesktop', 'accessFromCar'],
            },
          },
          fields: {
            nestedMenuItemWithAvailableScopes: {
              type: 'MenuItem',
              fullName: 'nestedMenuItemWithAvailableScopes',
              link: '/refrigerantTypes',
              scopes: {
                userOrGuestScope: {
                  permissions: [['accessAsUser', 'accessAsGuest']],
                },
              },
            },
            nestedMenuItemWithImpracticableScope: {
              type: 'MenuItem',
              fullName: 'nestedMenuItemWithImpracticableScope',
              link: '/manufacturers',
              scopes: {
                impracticableScope: {
                  permissions: ['accessAsSuperAdmin', 'accessFromDesktop', 'accessFromCar'],
                },
              },
            },
          },
        },
      },
    },
  },
};

const authPart = {
  interface: {
    app: {
      auth: {
        requireAuthentication: true,
        enablePermissions: true,
      },
    },
  },
};

describe('V5 Backend Menu Permissions', function () {
  before(async function () {
    this.appLib = prepareEnv();

    const db = await getMongoConnection(this.appLib.options.MONGODB_URI);
    this.db = db;
  });

  after(async function () {
    await this.db.dropDatabase();
    await this.db.close();
  });

  beforeEach(async function () {
    await Promise.all([
      this.db.collection('users').deleteMany({}),
      this.db.collection('mongoMigrateChangeLog').deleteMany({}),
    ]);
    await Promise.all([this.db.collection('users').insertOne(user)]);
  });

  afterEach(function () {
    return this.appLib.shutdown();
  });

  it('should correctly strip down menu for user', async function () {
    const { appLib } = this;
    setAppOptions(appLib, menuPart, authPart);

    await appLib.setup();
    const token = await loginWithUser(appLib, user);

    const res = await apiRequest(appLib)
      .get('/app-model')
      .set('Accept', 'application/json')
      .set('Authorization', `JWT ${token}`)
      .expect('Content-Type', /json/);
    res.statusCode.should.equal(200, JSON.stringify(res, null, 4));
    res.body.success.should.equal(true, res.body.message);

    const menuItemDefaults = appLib.appModel.typeDefaults.fields.MenuItem;
    const menuGroupDefaults = appLib.appModel.typeDefaults.fields.MenuGroup;

    const { fields: menuFields } = res.body.data.interface.mainMenu;
    const {
      menuDashboardLinkNoScopes,
      menuDashboardLinkWithScopes,
      menuDashboardLinkWithImpracticableScope,
      menuItemNoScopes,
      menuItemWithScopes,
      menuItemWithImpracticableScope,
      menuGroupNoScopes,
      menuGroupWithScopes,
      menuGroupWithImpracticableScope,
    } = menuFields;
    const srcMenuFields = menuPart.interface.mainMenu.fields;

    _.isEqual(menuDashboardLinkNoScopes, srcMenuFields.menuDashboardLinkNoScopes).should.be.true();
    const menuDashboardLinkWithScopesOmitted = _.omit(srcMenuFields.menuDashboardLinkWithScopes, ['scopes']);
    _.isEqual(menuDashboardLinkWithScopes, menuDashboardLinkWithScopesOmitted).should.be.true();
    _.isUndefined(menuDashboardLinkWithImpracticableScope).should.be.true();

    _.isEqual(menuItemNoScopes, { ...menuItemDefaults, ...srcMenuFields.menuItemNoScopes }).should.be.true();
    const menuItemWithScopesOmitted = _.omit(srcMenuFields.menuItemWithScopes, ['scopes']);
    _.isEqual(menuItemWithScopes, { ...menuItemDefaults, ...menuItemWithScopesOmitted }).should.be.true();
    _.isUndefined(menuItemWithImpracticableScope).should.be.true();

    let menuGroupNoScopesOmitted = _.omit(srcMenuFields.menuGroupNoScopes, [
      'fields.nestedMenuItemWithAvailableScopes.scopes',
      'fields.nestedMenuItemWithImpracticableScope',
    ]);
    menuGroupNoScopesOmitted = addTypeDefaultsForGroup(menuGroupNoScopesOmitted, menuGroupDefaults, menuItemDefaults);
    _.isEqual(menuGroupNoScopes, menuGroupNoScopesOmitted).should.be.true();

    let menuGroupWithScopesOmitted = _.omit(srcMenuFields.menuGroupWithScopes, [
      'scopes',
      'fields.nestedMenuItemWithAvailableScopes.scopes',
      'fields.nestedMenuItemWithImpracticableScope',
    ]);
    menuGroupWithScopesOmitted = addTypeDefaultsForGroup(
      menuGroupWithScopesOmitted,
      menuGroupDefaults,
      menuItemDefaults
    );
    _.isEqual(menuGroupWithScopes, { ...menuGroupDefaults, ...menuGroupWithScopesOmitted }).should.be.true();

    _.isUndefined(menuGroupWithImpracticableScope).should.be.true();
  });

  function addTypeDefaultsForGroup(group, menuGroupDefaults, menuItemDefaults) {
    const newGroup = { ...menuGroupDefaults, ...group };
    _.each(newGroup.fields, (field, path) => {
      if (field.type === 'MenuItem') {
        newGroup.fields[path] = { ...menuItemDefaults, ...field };
      }
    });
    return newGroup;
  }
});
