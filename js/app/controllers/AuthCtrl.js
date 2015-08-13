define([
        'app',
        'components/authorize'
    ],
    function(app) {
        "use strict";

        app.controller('AuthController', ['$scope', '$http', 'authorize',
            function ($scope, $http, authorize) {

                function clearForm(form) {
                    $scope.login = '';
                    $scope.password = '';
                    $scope.currentDomain = $scope.domains[0];
                    form.$setPristine();
                }

                $scope.login = '';
                $scope.password = '';
                $scope.domains = [
                    {name:'mail.ru'},
                    {name:'inbox.ru'},
                    {name:'list.ru'},
                    {name:'bk.ru'}
                ];
                $scope.currentDomain = $scope.domains[0];
                $scope.loginError = false;

                $scope.auth = function(form) {
                    if (form.$valid) {

                        authorize.request($scope.login, $scope.currentDomain.name, $scope.password)
                            .then(function (data) {
                                $scope.$parent.checkAuthorization();
                            }, function (error) {
                                if (error === 'noauth') {
                                    $scope.loginError = true;
                                    clearForm(form);
                                } else {
                                    console.log(error);
                                }
                            });
                    }
                };
            }]);
    });
