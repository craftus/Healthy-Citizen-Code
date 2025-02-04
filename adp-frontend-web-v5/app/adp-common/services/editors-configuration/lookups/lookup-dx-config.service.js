;(function () {
  'use strict';

  angular
    .module('app.adpCommon')
    .factory('LookupDxConfig', LookupDxConfig);

  /** @ngInject */
  function LookupDxConfig(
    AdpLookupHelpers,
    LookupDataSource,
    LookupBtns
  ) {
    return {
      single: singleLookupConfig,
      multiple: multipleLookupConfig,
      tableSelector: tableSelectorConfig,
      gridEditorSingle: gridEditorSingle,
      gridEditorMultiple: gridEditorMultiple,
    };

    function singleLookupConfig(options) {
      var defaultsConfig = defaults(options);

      var lookupSingleConfig = {
        elementAttr: {
          'class': 'adp-select-box adp-lookup-selector',
          'lookup-selector': true,
        },
        buttons: LookupBtns.getFieldButtons(options, options.args),
        onOpened: function (event) {
          // WORKAROUND to set focus on select when dropdown is shown
          event.element.find('.adp-text-box input').focus();
          reloadLookupWithFormFilter(options, event.component);
        },
        itemTemplate: function (lookupData) {
          return createLabelForFormLookup(lookupData, options.args);
        },
        fieldTemplate: function (data, container) {
          fieldTemplate({
            data: data,
            args: options.args,
            container: container,
            component: this,
          });
        },
      };

      return _.assign(defaultsConfig, lookupSingleConfig);
    }

    function multipleLookupConfig(options) {
      var defaultsConfig = defaults(options);

      var lookupMultipleConfig = {
        elementAttr: {
          'class': 'adp-select-box adp-lookup-selector',
          'lookup-selector': true,
        },
        inputAttr: {
          'adp-qaid-field-control': options.args.path,
        },
        buttons: LookupBtns.getFieldButtons(options, options.args),
        itemTemplate: function (lookupData) {
          return createLabelForFormLookup(lookupData, options.args);
        },
        tagTemplate: function (lookupData, tagElement) {
          return tagTemplate({
            lookupData: lookupData,
            tagElement: tagElement,
            args: options.args,
            component: this,
          });
        },
        onOpened: function (e) {
          reloadLookupWithFormFilter(options, e.component);
        }
      };

      return _.assign(defaultsConfig, lookupMultipleConfig);
    }

    function gridEditorMultiple(options) {
      var defaultsConfig = defaults(options);

      var filterConfig = {
        elementAttr: {
          'class': 'adp-select-box adp-lookup-selector'
        },
        itemTemplate: function (lookupData) {
          return AdpLookupHelpers.lookupItemTemplate(lookupData, options.args);
        },
        tagTemplate: function (lookupData, tagElement) {
          return tagTemplate({
            lookupData: lookupData,
            tagElement: tagElement,
            args: options.args,
            component: this,
          });
        },
      };

      return _.assign(defaultsConfig, filterConfig);
    }

    function gridEditorSingle(options) {
      var defaultsConfig = defaults(options);

      var filterConfig = {
        elementAttr: {
          'class': 'lookup_cell_editor adp-select-box adp-lookup-selector adp-filter-lookup-selector'
        },
        itemTemplate: function (lookupData) {
          return AdpLookupHelpers.lookupItemTemplate(lookupData, options.args);
        },
        onOpened: function (event) {
          // WORKAROUND to set focus on select when dropdown is shown
          event.element.find('.adp-text-box input').focus();
        },
        fieldTemplate: function (data, container) {
          fieldTemplate({
            data: data,
            args: options.args,
            container: container,
            component: this,
          });

          setTimeout(function () {
            fixFocusForEditor(container);
          })
        },
      };

      return _.assign(defaultsConfig, filterConfig);
    }

    function tableSelectorConfig(options) {
      var items = getNamesForTables(options.args.fieldSchema.lookup);
      var hasSingleTable = items.length === 1;

      return {
        elementAttr: {
          'table-selector': true,
          'class': hasSingleTable ? ' hidden' : '',
        },
        inputAttr: {
          'adp-qaid-lookup-table-selector': options.args.path,
        },
        itemTemplate: function (data, index, element) {
          element.attr('adp-qaid-lookup-table-selector-item', options.args.path);
          return data.label;
        },
        value: items[0].value,
        items: items,
        valueExpr: 'value',
        displayExpr: 'label',
        onValueChanged: options.onTableChanged,
      };

      function getNamesForTables(lookup) {
        return _.map(lookup.table, function (table) {
          return {
            value: table.table,
            label: table.tableLabel || _.startCase(table.table),
          }
        });
      }
    }

    function tagTemplate(templateConf) {
      var removeBtn = $('<div class="dx-tag-remove-button">');
      var cmp = templateConf.component;

      removeBtn.on('click', function () {
        var val = cmp.option('value').slice();
        _.remove(val, ['_id', templateConf.lookupData._id]);
        cmp.option('value', val);

        removeBtn.off('click');
      });

      var content = $('<span>')
        .html(AdpLookupHelpers.selectionLabel(templateConf.lookupData, templateConf.args));

      $('<div class="dx-tag-content">')
        .attr('adp-qaid-field-tag', templateConf.args.path)
        .append(content, removeBtn)
        .appendTo(templateConf.tagElement);
    }

    function fieldTemplate(templateConf) {
      var data = templateConf.data;
      var args = templateConf.args;
      var container = templateConf.container;
      var placeholder = templateConf.component.option('placeholder');

      var label = _.isNil(data) ?
        '<div class="adp-text-box-label-empty">' + placeholder + '</div>' :
        AdpLookupHelpers.selectionLabel(data, args);

      var labelText = $('<div>').append(label).text();

      var tpl = $('<div class="adp-text-box-label">')
        .attr('adp-qaid-field-control', templateConf.args.path)
        .append(label);

      var textBox = $('<div class="adp-text-box">')
        .dxTextBox({
          placeholder: placeholder,
          value: _.isNil(data) ? '' : labelText,
          inputAttr: {
            'adp-qaid-lookup-input': templateConf.args.path
          }
        });

      container.append(tpl, textBox);
    }

    function createLabelForFormLookup(lookupData, args) {
      var item = AdpLookupHelpers.lookupItemTemplate(lookupData, args);
      item.append(LookupBtns.updateButton(lookupData, args));

      return item;
    }

    function defaults(options) {
      return {
        elementAttr: {
          'class': 'adp-select-box adp-lookup-selector'
        },
        value: options.args.data,
        showClearButton: true,
        searchEnabled: true,
        dataSource: LookupDataSource(options.args, options.selectedTableName),
        valueExpr: 'this',
        onValueChanged: options.onValueChanged,
        multiline: true,
        wrapItemText: true,
      }
    }

    // fixes focus for lookup editor, allow to use tab navigation while editing
    function fixFocusForEditor(container) {
      var gridCell = container.closest('.dx-editor-cell');
      var gridInstance = container.closest('[dx-data-grid]').dxDataGrid('instance');
      gridInstance && gridInstance.focus(gridCell);
    }

    function reloadLookupWithFormFilter(options, gridInstance) {
      var selectedTable = options.args.fieldSchema.lookup.table[options.selectedTableName];
      var hasFormFilter = !!selectedTable.where;

      if (hasFormFilter) {
        gridInstance.getDataSource().reload();
      }
    }
  }
})();
