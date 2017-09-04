concurApp.factory('GlobalMethodService', function ($resource, $q, $rootScope, $filter) {

    var factoryMethods = {};
    var _getDateOrTimeByFormat = function (date, format) {
        return $filter('date')(date, format);
    }

    var _getUniqueCode = function (length) {
        var text = "Code-";
        var combination = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++) {
            text += combination.charAt(Math.floor(Math.random() * combination.length));
        }
        return text;
    }

    _getMinuteDifferenceBetweenDates = function (startDate, endDate) {
        try {
            var diff = (endDate.getTime() - startDate.getTime()) / 1000;
            diff /= 60;
            return Math.abs(Math.round(diff));
        } catch (ex) {
            return null;
        }
    }

    _validateEmail = function (email) {
        var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        return re.test(email);
    }

    _validateRequiredFields = function (field) {
        var isValid = (field != null && field != '' && field.trim().length > 0);
        return isValid;
    }

    factoryMethods.getDateOrTimeByFormat = _getDateOrTimeByFormat;
    factoryMethods.getUniqueCode = _getUniqueCode;
    factoryMethods.getMinuteDifferenceBetweenDates = _getMinuteDifferenceBetweenDates;
    factoryMethods.validateEmail = _validateEmail;
    factoryMethods.validateRequiredFields = _validateRequiredFields;
    return factoryMethods;

});