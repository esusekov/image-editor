define(['app',
        'components/getToken',
        'components/checkAuth',
        'components/readPath',
        'components/fileUrlAnalyzer',
        'components/messenger'
    ],
    function(app) {
    "use strict";

    app.controller('CloudController', ['$scope', '$http', '$timeout', '$location', 'getToken', 'checkAuth',
        'readPath', 'fileUrlAnalyzer', 'messenger',
        function ($scope, $http, $timeout, $location, getToken, checkAuth, readPath, fileUrlAnalyzer, messenger) {

            function pickFolders(element) {
                return element.kind === "folder";
            }

            var parsedFileUrl = fileUrlAnalyzer.analyze($location.absUrl());
            var page = parsedFileUrl.isPage;

            $scope.currentItems = [];
            $scope.currentPath = '/';
            $scope.loaderFlag = true;
            $scope.fileName = parsedFileUrl.fileName;
            $scope.fileExtension = parsedFileUrl.fileExtension;
            $scope.fileUrl = parsedFileUrl.fileUrl;
            $scope.goodExtensionFlag = /.(?:(jpe?g|png|gif|txt|pdf|mht|exe)$)/i.test($scope.fileExtension);
            $scope.shiftStyle = null;

            $scope.$watch('currentPath', function(){
                var array = $scope.currentPath.slice(1).split('/').slice(0,-1);
                var objArray = [];

                for (var i = 0; i < array.length; i++) {
                    objArray.push({
                        folderName: array[i],
                        index: i
                    });
                }

                $scope.pathArray = array;

                var maxNumberOfElements = 3;
                if (array.length > maxNumberOfElements) {
                    objArray = [{folderName: '. . .', index: -1}].concat(objArray.slice(-maxNumberOfElements));
                }
                $scope.visibleArray = [{folderName: 'Облако', index: -1}].concat(objArray);
            });

            $scope.setFileStructure = function() {
                getToken.request()
                    .then(function(token) {
                        return readPath.request($scope.currentPath, token, 1, '{"order":"desc","type":"size"}');
                    })
                    .then(function (list) {
                        console.log(list);
                        $scope.currentItems = (list || []).filter(pickFolders);
                    });
            };

            $scope.openFolder = function(index) {
                $scope.currentPath += $scope.currentItems[index].name + '/';
                $scope.setFileStructure();
            };

            $scope.goToFolder = function(index) {
                if (index === $scope.pathArray.length-1) {
                    return;
                }

                if (index < 0) {
                    $scope.currentPath = '/';
                } else {
                    $scope.currentPath = '/' + $scope.pathArray.slice(0, index + 1).join('/') + '/';
                }

                $scope.setFileStructure();
            };

            $scope.isFolder = function(index) {
                return $scope.currentItems[index].type === "folder";
            };

            $scope.saveFile = function(form) {
                if (form.$valid) {
                    var fullFileName;

                    if ($scope.goodExtensionFlag) {
                        fullFileName = $scope.fileName + $scope.fileExtension;
                    } else {
                        fullFileName = $scope.fileName;
                    }

                    var fullPath = $scope.currentPath + fullFileName;
                    var message;

                    if (page) {
                        message = {
                            sender: 'cloud-popup',
                            action: 'savePage',
                            fileName: fullFileName,
                            path: fullPath
                        };
                    } else {
                        message = {
                            sender: 'cloud-popup',
                            action: 'saveFile',
                            fileName: fullFileName,
                            url: $scope.fileUrl,
                            path: fullPath
                        };
                    }

                    messenger.sendMessage(message);
                    $scope.closePopup();
                }
            };

            $scope.checkAuthorization = function() {
                checkAuth.request().
                    then(function (data) {
                        $scope.setFileStructure();
                        $scope.shiftStyle = null;
                        $scope.loaderFlag = false;
                    }, function (error) {
                        if (error === 'noauth') {
                            $scope.shiftStyle = {'-webkit-transform': 'translate3d(-500px, 0, 0)'};
                            $scope.loaderFlag = false;

                        } else {
                            //TODO переводить на экран авторизации или выводить ошибку?
                        }
                    });
            };

            $scope.closePopup = function() {
                var message = {
                    sender: 'cloud-popup',
                    action: 'remove'
                };
                messenger.sendMessage(message);
            };

            $scope.getPattern = function() { //TODO нужна ли эта функция вообще?
                return $scope.goodExtensionFlag ? "/^[0-9a-zA-ZА-яЁё_#-]+$/" : "/[0-9a-zA-ZА-яЁё_.#-]+$/";
            };

            $scope.checkAuthorization();
    }]);
});
