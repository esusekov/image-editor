define(function() {
    "use strict";

    var objToString = ({}).toString;
    var slice = Array.prototype.slice;

    return {
        /**
         * Обрабатывает каждый элемент массива асинхронно, сохраняя при этом последовательность обработки.
         * @param {Array} items Массив.
         * @param {Function} item_callback Обработчик элемента.
         * @param {Function?} final_callback Финальный обработчик.
         * @example
         * asyncForeach([1, 2, 3], function(item, index, next_cb) {
         *     console.log(item);
         *     setTimeout(next_cb, 100);
         * }, function() {
         *     console.log('end');
         * });
         *
         * => 1
         * => 2
         * => 3
         * => "end"
         */
        asyncForeach: function(items, item_callback, final_callback) {
            var index = 0;
            var length = items.length;

            function inner() {
                if (index < length) {
                    item_callback(items[index], index++, inner);
                } else {
                    if (final_callback instanceof Function) {
                        final_callback();
                    }
                }
            }

            inner();
        },

        toArray: function(value) {
            switch (objToString.call(value)) {
                case '[object Array]':
                    return value;

                case '[object Arguments]':
                    return slice.call(value);

                case '[object Null]':
                case '[object Undefined]':
                    return [];
            }

            return [value];
        },

        /**
         * Возвращает список уникальных элементов.
         */
        uniq: function(array) {
            return array.filter(function(item, i, arr) {
                return arr.lastIndexOf(item) === i;
            }).sort();
        },

        splitIntoChunks: function(arr, chunkSize) {
            if (arr == null) {
                return;
            }

            chunkSize = chunkSize || arr.length;

            var chunks = [];

            for (var i = 0, n = arr.length; i < n;) {
                var j = i + chunkSize;
                var chunk = arr.slice(i, j);

                chunks.push(chunk);
                i = j;
            }

            return chunks;
        },

        /**
         * Возвращает пересечение двух массивов.
         */
        intersect: function(one, two, compareFunc) {
            return one.filter(function(oneItem) {
                if (compareFunc) {
                    return two.some(function(twoItem) {
                        return compareFunc(oneItem, twoItem);
                    });
                } else {
                    return two.indexOf(oneItem) !== -1;
                }
            });
        },

        /**
         * Возвращает разницу между двумя массивами.
         */
        diff: function(one, two, compareFunc) {
            return one.filter(function(oneItem) {
                if (compareFunc) {
                    return !two.some(function(twoItem) {
                        return compareFunc(oneItem, twoItem);
                    });
                } else {
                    return two.indexOf(oneItem) === -1;
                }
            });
        },
    };
});
