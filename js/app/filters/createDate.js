define(['app'], function(app) {
    "use strict";

    app.filter('createDate', function() {
        return function(number) {
            if (Number.isNaN(parseFloat(number)) || number == null ||
                !Number.isFinite(parseFloat(number))) return '--';
            var date = new Date(number);
            var monthNames = [ 'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек' ];
            var day = date.getDate().toString();
            var month = monthNames[date.getMonth()];
            var year = date.getFullYear().toString();
            var hour = ("0" + date.getHours()).slice(-2);
            var minutes = ("0" + date.getMinutes()).slice(-2);
            return day + ' ' + month + ' ' + year + ' ' + hour + ':' + minutes;
        }
    });
});