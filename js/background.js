require(['require-config'], function() {
    "use strict";

    require(['ng',
        'app',
        'components/checkAuth',
        'components/sendFile',
        'components/dataManager',
        'components/downloadManager',
        'components/messenger'
    ], function(ng, app) {

        app.run(['$rootScope','checkAuth', 'sendFile', 'dataManager', 'downloadManager', 'messenger',
            function($rootScope, checkAuth, sendFile, dataManager, downloadManager, messenger) {

                function tabsHandler(url) {
                    chrTabs.query({currentWindow: true},
                        function (tabs) {
                            var findCloudTab = tabs.some(function (tab) {
                                if (/cloud.mail.ru/.test(tab.url)) {
                                    chrTabs.update(tab.id, {highlighted: true, active: true, url: url});
                                    return true;
                                }
                                return false;
                            });
                            if (!findCloudTab) {
                                chrTabs.create({url: url});
                            }
                        }
                    );
                }

                function init() {
                    checkAuth.request().
                        then(function (data) {
                            currentEmail = data.email;
                            downloadManager.setManager(currentEmail);

                            browserAction.onClicked.removeListener(iconAction);
                            browserAction.setPopup({'popup': 'history-popup.html'});
                        }, function (error) {
                            browserAction.setPopup({'popup': ''});
                            browserAction.onClicked.addListener(iconAction);
                        });
                }

                function iconAction() {
                    tabsHandler('https://e.mail.ru/login');//"https://e.mail.ru/login?page=" + encodeURIComponent(cloudUrl));
                }

                function updateIcon() {
                    checkAuth.request().
                        then(function (data) {
                            if (currentEmail !== data.email) {
                                init();
                            }

                            browserAction.setIcon({path: "img/icon21.png"});
                        }, function (error) {
                            if (error == "noauth") {
                                browserAction.setIcon({path: "img/icon19_not_logged_in.png"});
                            } else {
                                browserAction.setIcon({path: "img/icon19_error.png"});
                            }
                        });
                }

                function sendMessage(message) {
                    chrTabs.query(
                        {windowId: -2, active: true},
                        function (tabs) {
                            var port = chrTabs.connect(tabs[0].id);
                            messenger.sendMessage(message, port);
                        }
                    )
                }

                function messageHandler(message) {
                    console.log(message);
                    switch (message.sender) {
                        case 'cloud-popup':
                            if (message.action === 'remove') {
                                sendMessage({
                                    recipient: 'content-script',
                                    action: 'removePopup'
                                });
                            }

                            if (message.action === 'saveFile') {
                                dataManager.fileToBinary(message.url, message.fileName)
                                    .then(function(data) {
                                        sendFile.exec(data.formData, message.url, message.fileName, message.path);
                                    });
                            }

                            if (message.action === 'savePage') {
                                dataManager.pageToBinary(message.fileName)
                                    .then(function(data) {
                                        sendFile.exec(data.formData, null, message.fileName, message.path);
                                    });
                            }
                            break;

                        case 'history-popup':
                            if (message.action === 'saveFile') {
                                dataManager.fileToBinary(message.url, message.fileName)
                                    .then(function(data) {
                                        sendFile.exec(data.formData, message.url, message.fileName, message.path);
                                    });
                            }
                            break;

                        case 'content-script':
                            if (message.action === 'addContextMenu') {
                                console.log(message);
                                addContextMenu(message.type);
                            }

                            if (message.action === 'removeContextMenu') {
                                console.log(message);
                                removeContextMenu(message.type);
                            }
                            break;
                    }
                }

                function addContextMenu(type) {
                    switch (type) {
                        case "image":
                            if (!imageContextMenuID) {
                                imageContextMenuID = chrContextMenus.create({
                                    title: "Сохранить картинку в облаке",
                                    contexts: [ "image" ],
                                    onclick: function (info, tab) {
                                        var port = chrTabs.connect(tab.id);
                                        var message = {
                                            recipient: 'content-script',
                                            action: 'addPopup',
                                            fileUrl: info.srcUrl,
                                            isPage: false
                                        };
                                        messenger.sendMessage(message, port);
                                    }
                                });
                            }
                            break;


                        case "file":
                            if (!fileContextMenuID) {
                                fileContextMenuID = chrContextMenus.create({
                                    title: "Сохранить файл в облаке",
                                    contexts: [ "link" ],
                                    onclick: function (info, tab) {
                                        var port = chrTabs.connect(tab.id);
                                        var message = {
                                            recipient: 'content-script',
                                            action: 'addPopup',
                                            fileUrl: info.linkUrl,
                                            isPage: false
                                        };
                                        messenger.sendMessage(message, port);
                                    }
                                });
                            }
                            break;
                    }
                }

                function removeContextMenu(type) {
                    switch (type) {
                        case "image":
                            if (imageContextMenuID) {
                                chrContextMenus.remove(imageContextMenuID);
                                imageContextMenuID = null;
                            }
                            break;

                        case "file":
                            if (fileContextMenuID) {
                                chrContextMenus.remove(fileContextMenuID);
                                fileContextMenuID = null;
                            }
                            break;
                    }
                }

                var browserAction = chrome.browserAction;
                var chrDownloads = chrome.downloads;
                var chrTabs = chrome.tabs;
                var chrRuntime = chrome.runtime;
                var chrContextMenus = chrome.contextMenus;

                var currentEmail;
                var cloudUrl = "http://horizon.win87.dev.mail.ru";//"https://cloud.mail.ru";
                var fileContextMenuID;
                var imageContextMenuID;
                var pageContextMenuID;

                browserAction.setPopup({
                    'popup': 'history-popup.html'
                });

                $rootScope.$on('messageReceived', function(event, message) {
                    messageHandler(message);
                });

                chrDownloads.onCreated.addListener(function(item) {
                    console.log(item.startTime);
                    console.log(item);
                    console.log(item.filename);
                    if (item.state === "in_progress" && item.filename) {

                        var isPage = false;

                        if (item.mime === "text/html") {
                            isPage = true;
                        }

                        sendMessage({
                            recipient: 'content-script',
                            action: 'addDownloadPopup',
                            fileUrl: item.url,
                            isPage: isPage
                        });
                    }
                });

                chrDownloads.onChanged.addListener(function(delta) {
                    console.log(delta);
                    if (delta.filename) {
                        chrDownloads.search({id: delta.id}, function(items) {
                            var item = items[0];
                            if (item.mime !== "text/html") {
                                sendMessage({
                                    recipient: 'content-script',
                                    action: 'addDownloadPopup',
                                    fileUrl: item.url,
                                    isPage: false
                                });
                            }
                        });
                    }
                });

                pageContextMenuID = chrContextMenus.create({
                    title: "Сохранить в облаке всю страницу",
                    onclick: function (info, tab) {
                        var port = chrTabs.connect(tab.id);
                        var message = {
                            recipient: 'content-script',
                            action: 'addPopup',
                            fileUrl: info.pageUrl,
                            isPage: true
                        };
                        messenger.sendMessage(message, port);
                    }
                });

                init();

                setInterval(function () {
                    updateIcon();
                }, 3000);

            }]);

        ng.bootstrap(document.body, ['app']);
    });
});