/**
 * CustomActions are called when a user clicks a button in DataTables linked to a custom action
 *
 * Each handler receives single parameter - data that the DataTables row represents
 */

module.exports = function () {
    var m = {
        "showTest": function (row) {
            alert(JSON.stringify(row));
        }
    };
    return m;
};