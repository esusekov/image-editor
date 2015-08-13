define(['app'], function(app) {
    "use strict";

    app.directive('statusText', function() {
        return function(scope, element, attrs) {
            var status = scope.download.status;
            var statusText = '';
            if (!status) {
                statusText = 'Ошибка загрузки';
            }
            element.append(statusText);
        };
    });

    app.directive('statusClass', function() {
        return function(scope, element, attrs) {
            var status = scope.download.status;
            var statusClass = '';
            if (status) {
                statusClass = 'history-popup-list-item-status-ok';
            } else {
                statusClass = 'history-popup-list-item-status-error';
            }
            element.addClass(statusClass);
        };
    });

});
