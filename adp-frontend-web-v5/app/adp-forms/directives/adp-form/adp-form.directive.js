;(function () {
  'use strict';

  angular
    .module('app.adpForms')
    .directive('adpForm', adpForm);

  /**
   * @typedef {Object} CloneParams
   * Special params for cloning DataSets
   * @property {String} parentCollectionName - name of collection to clone
   * @property {String[]} projections - list of fieldNames to clone from parent collection
   */

  /**
   * @typedef {Object} schemaActionsStrategy
   * adpForm directive provides different types of providing Submit and other actions.
   * schemaActionsStrategy allows to specify these action from Schema.
   * However sometimes outer form environment requires some action to call to
   * close modal, for example, or cancel editing and rollback data.
   *
   * Such actions are optional and should be provided in formOptions.
   *
   * If such options provided, than actions template is built inside form based on schema.
   *
   * @property {Function} [onComplete] - called after form successfully submitted
   * @property {Function} [onCancel] - called if data editing was canceled
   */

  /**
   * @typedef {Object} localActionsStrategy
   * adpForm directive provides different types of providing Submit and other actions.
   * localActionsStrategy allows to specify these action from formOptions.
   * Any outer actions are handled outside adpForm.
   *
   * If such options provided, than actions template is built based outside of form.

   * @property {Function} submit - async function for api request
   */

  /**
   * @ngdoc directive
   * @module app.adpForms
   * @name app.adpForms:adpForm
   *
   * @param {Object} args - Unified args
   * @param {Object} formOptions
   * @param {Boolean} formOptions.disableFullscreen - allows to disable fullScreen
   * @param {CloneParams} formOptions.cloneParams
   * @param {Object} formOptions.schemaActionsStrategy
   * @param {Object} formOptions.localActionsStrategy
   * @param {Object} formOptions.cloneParams
   */
  function adpForm(
    AdpFieldsService,
    AdpFormService,
    RequiredExpression,
    ShowExpression,
    $timeout,
    UploadError,
    ErrorHelpers,
    $q,
    AdpFormActionHandler
  ) {
    return {
      restrict: 'E',
      scope: {
        args: '<',
        formOptions: '<',
      },
      transclude: {
        'header': '?formHeader',
        'body': '?formBody',
        'footer': '?formFooter',
      },
      templateUrl: 'app/adp-forms/directives/adp-form/adp-form.html',
      link: function (scope, element) {
        init();

        function init() {
          scope.args.row = _.cloneDeep(scope.args.row) || {};
          // TODO: need to keep args updated for any arg mutation, so it need a better abstraction

          scope.groupingType = AdpFormService.getGroupingType(scope.args);
          scope.topScopeFields = scope.groupingType ?
            AdpFieldsService.getFormGroupFields(scope.args.fieldSchema.fields, scope.groupingType) :
            AdpFieldsService.getFormFields(scope.args.fieldSchema.fields);

          scope.loading = false;
          scope.uploaderCnt = 0;
          scope.hasFooter = _.hasIn(scope, 'formOptions.submitCb');
          scope.cloneParams = scope.formOptions.cloneParams;

          scope.formContext = {
            visibilityMap: {},
            requiredMap: {},
            errorCount: {},
            rootForm: scope.form,
          };

          _.each(scope.topScopeFields.groups, function (group, name) {
            scope.formContext.visibilityMap[name] = true;
          });

          applyActionClass(scope.args.action);
          bindEvents();
        }

        function applyActionClass(action) {
          if (!action) {
            return;
          }

          scope.formActionClass = 'form-action-' + action;
        }

        // there are two functions to bind events:
        // the second one is for avoiding error for form when nested form are not rendered
        // the first one keep order of event triggered by child directives
        function bindEvents() {
          scope.$on('adpFileUploaderInit', function () {
            scope.uploaderCnt++;
          });

          scope.$watch('[loading]', updateDisabledState);
          scope.$watch(function () { return angular.toJson(scope.form) }, onFormUpdate);

          initActionsStrategy();
        }

        function initActionsStrategy() {
          scope.submit = submit;
          var schemaStrategy = _.hasIn(scope, 'formOptions.schemaActionsStrategy');
          if (schemaStrategy) {
            setSchemaActionsStrategy();
          } else {
            scope.submitAction = _.get(scope, 'formOptions.localActionsStrategy.submit');
          }
        }

        function setSchemaActionsStrategy() {
          scope.formHooks = {
            onCancel: _.get(scope, 'formOptions.schemaActionsStrategy.onCancel', null),
            onComplete: _.get(scope, 'formOptions.schemaActionsStrategy.onComplete', null),
          };

          scope.execFormAction = function (action, name) {
            var actionCb = AdpFormActionHandler(action, name);

            var type = _.get(action, 'htmlAttributes.type', 'button');
            if (type === 'submit') {
              scope.submitAction = actionCb;
            } else {
              actionCb.apply(scope.args, [scope.args, scope.formHooks]);
            }
          }
        }

        function submit(args, cloneParams) {
          if (scope.form.$invalid) {
            scrollToError();
            return;
          }

          scope.loading = true;

          return handleFileUpload()
            .then(function () {
              return scope.submitAction.apply(args, [args, scope.formHooks, cloneParams]);
            })
            .catch(function (error) {
              ErrorHelpers.handleError(error, 'Unknown error in form');
            })
            .finally(function () {
              scope.loading = false;
            });
        }

        function handleFileUpload() {
          if (scope.uploaderCnt === 0) {
            return $q.when();
          }

          var uploadersFinished = 0;

          return $q(function (resolve) {
            var removeEndListenerFn = scope.$on('adpFileUploadComplete', onUploadComplete);
            var removeErrorListenerFn = scope.$on('adpFileUploadError', onUploadError);
            scope.$broadcast('adpFileUploadStart');

            function onUploadComplete() {
              uploadersFinished++;

              if (uploadersFinished >= scope.uploaderCnt) {
                removeListeners();
                resolve();
              }
            }

            function onUploadError(_e, response) {
              removeListeners();
              throw new UploadError(response.message);
            }

            function removeListeners() {
              removeEndListenerFn();
              removeErrorListenerFn();
            }
          });
        }

        function updateDisabledState(values) {
          if (!element || !element.find('[type="submit"]').length) return;
          var loading = values[0];

          element.toggleClass('adp-disabled-form', loading);

          element.find('[type="submit"]')
            .prop('disabled', loading);
        }

        function onFormUpdate(newVal, oldVal) {
          if (newVal === oldVal) {
            return;
          }

          AdpFormService.forceValidation(scope.form);

          ShowExpression.eval({
            args: scope.args,
            visibilityMap: scope.formContext.visibilityMap,
            groups: scope.topScopeFields.groups,
          });

          RequiredExpression.eval({
            args: scope.args,
            requiredMap: scope.formContext.requiredMap,
            form: scope.form,
          });

          if (scope.form.$submitted) {
            scope.errorCount = AdpFormService.countErrors(scope.form);
            scope.formContext.errorCount = scope.errorCount;
          }
        }

        // refactor: form move to service
        function scrollToError() {
          AdpFormService.setFormDirty(scope.form);
          var firstFieldWithError = document.querySelector('.ng-invalid[ng-model]');
          var $errorNode = $(firstFieldWithError).closest('adp-form-field-container');
          var $ngForm = $($errorNode).closest('ng-form');
          var $scrollTarget;

          $scrollTarget = $ngForm.length > 0 ? $ngForm : $errorNode;

          var $scrollContainer = $('[uib-modal-window="modal-window"]');
          var scrollPos;

          if ($scrollContainer.length === 0) {
            scrollPos = $scrollTarget.offset().top;
            $scrollContainer = $('html, body');
          } else {
            scrollPos = $scrollTarget.offset().top - $scrollContainer.offset().top + $scrollContainer.scrollTop()
          }

          $($scrollContainer).animate({
            scrollTop: scrollPos
          }, 300);
        }
      }
    }
  }
})();
