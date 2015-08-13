var app = angular.module('app', [ ]);

app.run(function($fabric) {
    $fabric.isTouchSupported = true;
});

app.factory('$fabric', function($window) {
    return $window.fabric;
});

app.factory('imageService', function($http, $fabric) {
    function base64ArrayBuffer(arrayBuffer) {
        var base64    = '';
        var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        var bytes         = new Uint8Array(arrayBuffer);
        var byteLength    = bytes.byteLength;
        var byteRemainder = byteLength % 3;
        var mainLength    = byteLength - byteRemainder;

        var a, b, c, d;
        var chunk;

        // Main loop deals with bytes in chunks of 3
        for (var i = 0; i < mainLength; i = i + 3) {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

            // Use bitmasks to extract 6-bit segments from the triplet
            a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
            c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
            d = chunk & 63;               // 63       = 2^6 - 1

            // Convert the raw binary segments to the appropriate ASCII encoding
            base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder == 1) {
            chunk = bytes[mainLength];

            a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

            // Set the 4 least significant bits to zero
            b = (chunk & 3)   << 4; // 3   = 2^2 - 1

            base64 += encodings[a] + encodings[b] + '==';
        } else if (byteRemainder == 2) {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

            a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4

            // Set the 2 least significant bits to zero
            c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

            base64 += encodings[a] + encodings[b] + encodings[c] + '=';
        }

        return base64;
    }

    return {
        getImage: function() {
            var params = {
                format: 'src',
                'results_per_page': 1,
                'api_key': 'MzI2NDM'
            };

            return $http.get('http://thecatapi.com/api/images/get', {params: params, responseType: 'arraybuffer'}).then(function(response) {
                console.log(response);
                if (response.status < 400 && response.data) {

                    return "data:image/jpeg;base64," + base64ArrayBuffer(response.data);
                }
            });
        }
    };
});

app.directive('colorPicker', function($window) {
   return {
       restrict: 'E',
       replace: true,
       templateUrl: '../templates/color-picker.html',
       scope: {
           chooseColor: '&',
           chooseWidth: '&'
       },
       link: function(scope, element) {
           scope.colors = [
               {
                   value: '#f00'
               },
               {
                   value: 'blue'
               },
               {
                   value: 'yellow'
               },
               {
                   value: 'green'
               },
               {
                   value: 'black'
               },
               {
                   value: 'white'
               }
           ];

           scope.choose = function(color) {
               scope.chooseColor({color: color.value});
           };

           scope.handlePickerClick = function() {
               console.log(element[0].clientWidth);
           };

           scope.resizeHandler = function() {
               scope.chooseWidth({width: element[0].clientWidth / 2});
           };

           $window.addResizeListener(element[0],scope.resizeHandler);
       }
   }
});


app.controller('PopupController', function($scope, $fabric, $element, imageService) {

    $scope.canvas = new $fabric.Canvas('c', {
        isDrawingMode: true,
        backgroundColor: '#888'
    });

    $scope.canvas.freeDrawingBrush.color = '#fff';
    $scope.canvas.freeDrawingBrush.width = 10;

    $scope.color = '#fff';

    $scope.clear = function() {
        $scope.canvas.clear();
    };

    $scope.chooseColor = function(color) {
        $scope.canvas.freeDrawingBrush.color = $scope.color = color;
    };

    $scope.chooseWidth = function(width) {
        $scope.canvas.freeDrawingBrush.width = width;
    };

    $scope.changeDrawMode = function() {
        $scope.canvas.isDrawingMode = !$scope.canvas.isDrawingMode;
    };

    $scope.addText = function() {
        $scope.canvas.add(new $fabric.IText("Text", {
            fontSize: 40,
            fill: $scope.color,
            left: 100,
            top: 100
        }));

        $scope.canvas.isDrawingMode = false;
    };

    $scope.addImage = function() {
        imageService.getImage().then(function(data) {
            $scope.canvas.setBackgroundImage(data, $scope.canvas.renderAll.bind($scope.canvas), {alignX: 'max', alignY: 'max'});
        });
    };

    $scope.canvas.on('mouse:down', function(event) {
        if (event.e.which === 1) {
            $element.addClass('drawing');
        }
    });

    $scope.canvas.on('mouse:up', function(event) {
        if (event.e.which === 1) {
            $element.removeClass('drawing');
        }
    });

    console.log($fabric.isTouchSupported);

});

angular.bootstrap(document.body, ['app']);