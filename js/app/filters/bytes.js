define(['app'], function(app) {
    "use strict";

    app.filter('bytes', function() {
        return function(bytes, precision) {
            if (Number.isNaN(parseFloat(bytes)) || !Number.isFinite(parseFloat(bytes)) || bytes == null) return '--';
            if (typeof precision === 'undefined') precision = 1;
            if (bytes <= 0) return '0.0 б';

            var units = ['б', 'Кб', 'Мб', 'Гб', 'Тб', 'Пб'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));

            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
        }
    });
});
