'use strict';

var concurApp = angular.module('concurApp', ['ngResource', 'ui.router', 'ngRoute', 'LocalStorageModule', 'angular.chosen',
    'ngTouch', 'ui.grid', 'ui.grid.autoResize', 'ui.grid.selection', 'ui.grid.exporter', 'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.cellNav',
    'uiSwitch', 'ui.keypress', 'ui.grid.resizeColumns', 'ui.grid.pagination', 'ui.bootstrap', 'ui.utils','ngFileUpload','ui.bootstrap','btorfs.multiselect','jlareau.pnotify', 'pascalprecht.translate','am.multiselect', 'angular.css.injector','ngCookies','ipCookie','multipleSelect', 'rt.asyncseries'])
.controller('concurMainCtrl', ['$scope', '$rootScope', '$state', 'cssInjector', 'GlobalVariableService', '$cookieStore', function ($scope, $rootScope,$state, cssInjector, GlobalVariableService, $cookieStore) {
    cssInjector.removeAll();
    var link = document.createElement('link'),
    oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    if(GlobalVariableService.company == null || GlobalVariableService.company == 'microsoft') {
        link.href = '/app/assets/angular/images/favicon.ico';
    } else {
        link.href = '/app/assets/angular/images/favicon2.ico';
        cssInjector.add("/app/assets/angular/css/oracle.css");
    }
    if (oldLink) {
        document.head.removeChild(oldLink);
    }
    document.head.appendChild(link);    
}]);

