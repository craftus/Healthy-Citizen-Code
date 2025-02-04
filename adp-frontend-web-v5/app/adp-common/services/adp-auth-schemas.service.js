;(function() {
  'use strict';

  /**
   * @ng-service
   * Backend does not provide schema for Login, SignUp pages and for
   * type=Password field.
   *
   * Service provides hardcoded schemas for such pages until Backend
   * implements it.
   */
  angular
    .module('app.adpCommon')
    .service('AdpAuthSchemas', AdpAuthSchemas);

  /** @ngInject */
  function AdpAuthSchemas(AdpUnifiedArgs) {
    var AUTH_ACTIONS = {
      LOGIN: 'login',
      LOGIN_OTP: 'loginOtp',
      REGISTER: 'register',
      FORGOT_PASSWORD: 'forgotPassword',
      RESET_PASSWORD: 'resetPassword',
      UPDATE_PASSWORD: 'updatePassword',
    }
    function loginArgs() {
      return getArgs(AUTH_ACTIONS.LOGIN, loginSchema());
    }

    function loginSchema() {
      var password = getPasswordModelField();
      removeRegexValidator(password);
      var loginField = getModelField('login');
      loginField.fullName = 'Login or Email';
      _.unset(loginField, 'validate');

      return {
        type: 'Schema',
        schemaName: 'login',
        fields: {
          login: loginField,
          password: password,
          recaptcha: getRecaptchaField(),
        }
      }
    }

    function loginOtpArgs() {
      return getArgs(AUTH_ACTIONS.LOGIN_OTP, loginOtpSchema());
    }

    function loginOtpSchema() {
      var twoFactorTokenField = getModelField('twoFactorToken');

      twoFactorTokenField.showInForm = true;

      return {
        type: 'Schema',
        schemaName: 'login-otp',
        fields: {
          twoFactorToken: twoFactorTokenField,
        }
      }
    }

    function registrationArgs() {
      return getArgs(AUTH_ACTIONS.REGISTER, registrationSchema());
    }

    function registrationSchema() {
      var fields = {
        login: getModelField('login'),
        email: getModelField('email'),
        password: getPasswordModelField(),
        passwordConfirmation: getPasswordConfirmation(),
        recaptcha: getRecaptchaField(),
      };

      var requireMfa = window.adpAppStore.appInterface().app.auth.requireMfa;

      if (requireMfa) {
        fields.enableTwoFactor = getModelField('enableTwoFactor');
        _.set(fields, 'enableTwoFactor.formRenderer.renderMode', 'register');

        fields.twoFactorRequirementText = getModelField('twoFactorRequirementText');
      }

      return {
        type: 'Schema',
        schemaName: 'singup',
        fields: fields
      }
    }

    function forgotPasswordArgs() {
      return getArgs(AUTH_ACTIONS.FORGOT_PASSWORD, forgotPasswordSchema());
    }

    function forgotPasswordSchema() {
      return {
        type: 'Schema',
        schemaName: 'forgotPassword',
        fields: {
          email: getModelField('email'),
          recaptcha: getRecaptchaField(),
        }
      }
    }

    function resetPasswordArgs() {
      return getArgs(AUTH_ACTIONS.RESET_PASSWORD, resetPasswordSchema());
    }

    function resetPasswordSchema() {
      return {
        type: 'Schema',
        schemaName: 'resetPassword',
        fields: {
          password: getPasswordModelField(),
          passwordConfirmation: getPasswordConfirmation(),
        }
      }
    }

    function passwordUpdateArgs() {
      return getArgs(AUTH_ACTIONS.UPDATE_PASSWORD, passwordUpdateSchema());
    }

    function passwordUpdateSchema() {
      var password = getPasswordModelField();

      return {
        type: 'Schema',
        fields: {
          password: password,
          passwordConfirmation: getPasswordConfirmation(),
        }
      }
    }

    function getArgs(action, schema) {
      return AdpUnifiedArgs.getHelperParamsWithConfig({
        path: '',
        action: action,
        schema: schema,
        formData: null,
      });
    }

    function getModelField(fieldName) {
      var APP_MODEL = window.adpAppStore.appModel();
      var path = fieldPath(fieldName);
      var field = _.cloneDeep(_.get(APP_MODEL, path));
      addReadWritePermissions(field);
      field.showInForm = true;

      return field;
    }

    function getPasswordModelField() {
      var field = getModelField('password');
      field.type = 'PasswordAuth';

      return field;
    }

    function fieldPath(fieldName) {
      var PATH_PREFIX = 'users.fields.';
      return PATH_PREFIX + fieldName;
    }

    function addReadWritePermissions(field) {
      field.fieldInfo = { write: true, read: true };
    }

    function getPasswordConfirmation() {
      var field = getPasswordModelField();

      field.fieldName = 'passwordConfirmation';
      field.fullName = 'Verify Password';
      field.validate = [
        {
          validator: 'passwordMatch',
          arguments: {
            matchedField: 'password'
          },
          errorMessages: {
            default: 'Passwords do not match'
          }
        }
      ];

      return field;
    }

    function getRecaptchaField() {
      var field = {
        type: 'Recaptcha',
        fullName: 'Recaptcha',
        fieldName: 'recaptcha',
        showInForm: true,
        required: true,
      };

      addReadWritePermissions(field);

      return field;
    }

    // check for details https://jira.conceptant.com/browse/HC-1362
    function removeRegexValidator(field) {
      field.validate = field.validate.filter(function (v) {
        return v.validator !== 'regex'
      });
    }

    return {
      loginArgs: loginArgs,
      loginOtpArgs: loginOtpArgs,
      registrationArgs: registrationArgs,
      resetPasswordArgs: resetPasswordArgs,
      forgotPasswordArgs: forgotPasswordArgs,
      passwordUpdateArgs: passwordUpdateArgs,
      actions: AUTH_ACTIONS,
    }
  }
})();
