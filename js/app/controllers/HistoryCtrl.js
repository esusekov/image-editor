define([
        'ng',
        'app',
        'components/checkAuth',
        'components/storageManager',
        'components/messenger',
        'filters/bytes',
        'filters/createDate'
    ],
    function(ng, app) {
        "use strict";

        app.controller('HistoryController', ['$scope', '$http', '$timeout', 'checkAuth', 'storageManager', 'messenger',
            function ($scope, $http, $timeout, checkAuth, storageManager, messenger) {

                var currentEmail = '';

                function getFinishedDownloads() {
                    storageManager.get(currentEmail)
                        .then(function(data) {
                            var downloads = data.items ? data.items['finished-downloads'] : [];
                            if ($scope.finishedDownloads.length > 0 && downloads.length > 0) {
                                $scope.finishedDownloads.unshift(downloads[0]);
                            } else {
                                $scope.finishedDownloads = downloads;
                            }
                        });
                }

                function getInprogressDownloads() {
                    storageManager.get('inprogressDownloads')
                        .then(function(data) {
                            $scope.inprogressDownloads = data.items || {}; //TODO переход из состояния с одним элементом к пустому объекту почему-то не анимируется
                        });
                }

                $scope.$on('storageChanged', function(event, changes) {
                    if (changes.hasOwnProperty('inprogressDownloads')) {
                        getInprogressDownloads();
                    } else {
                        getInprogressDownloads();
                        getFinishedDownloads();
                    }
                });

                $scope.deleteItem = function(index) {
                    $scope.finishedDownloads.splice(index, 1);
                };

                $scope.loaderFlag = true;
                $scope.authFlag = false;
                $scope.finishedDownloads = [];
                $scope.inprogressDownloads = {};

                $scope.isInProgress = function() {
                    return !ng.equals({}, $scope.inprogressDownloads);
                };

                $scope.tryToSendAgain = function(download) {
                    if (download.status) {
                        return;
                    }

                    var message = {
                        sender: 'history-popup',
                        action: 'saveFile',
                        fileName: download.fileName,
                        url: download.fileUrl,
                        path: download.path
                    };

                    messenger.sendMessage(message);
                };

                $scope.checkAuthorization = function() {
                    checkAuth.request()
                        .then(function (data) {
                            currentEmail = data.email;
                            getFinishedDownloads();
                            getInprogressDownloads();
                            $scope.loaderFlag = false;
                        }, function (error) {
                            if (error === "noauth") {
                                $scope.authFlag = true;
                                $scope.loaderFlag = false;
                            } else {
                                //TODO выводить ошибку? как?
                            }
                        });
                };

                $scope.checkAuthorization();
            }]);
    });
