angular.module('uiSwitch', [])

.directive('switch', function(){
  return {
    restrict: 'AE'
  , replace: true
  , transclude: true
  , template: function(element, attrs) {
      var html = '';
      if (attrs.ngTrueValue == undefined)
      {
          attrs.ngTrueValue = true;
      }
      if (attrs.ngFalseValue == undefined) {
          attrs.ngFalseValue = false;
      }
      html += '<span';
      html +=   ' class="switch' + (attrs.class ? ' ' + attrs.class : '') + '"';
      html += attrs.ngModel && !attrs.ngDisabled ? ' ng-click="' + attrs.ngModel + '=' + '(' + attrs.ngModel +'=='+attrs.ngTrueValue+'?'+attrs.ngFalseValue+':'+attrs.ngTrueValue+ ')' + (attrs.ngChange ? '; ' + attrs.ngChange + '()"' : '"') : '';
      html += ' ng-class="{ checked:' + attrs.ngModel + '==' + attrs.ngTrueValue + ' , disabled:' + attrs.ngDisabled + '}"';
      html +=   '>';
      html +=   '<small></small>';
      html +=   '<input type="checkbox"';
      html +=     attrs.id ? ' id="' + attrs.id + '"' : '';
      html +=     attrs.name ? ' name="' + attrs.name + '"' : '';
      html +=     attrs.ngModel ? ' ng-model="' + attrs.ngModel + '"' : '';
      html += ' ng-true-value="' + attrs.ngTrueValue + '" ng-false-value="' + attrs.ngFalseValue + '" style="display:none" />';
      html +=     '<span class="switch-text">'; /*adding new container for switch text*/
      html +=     attrs.on ? '<span class="on">'+attrs.on+'</span>' : ''; /*switch text on value set by user in directive html markup*/
      html +=     attrs.off ? '<span class="off">'+attrs.off + '</span>' : ' ';  /*switch text off value set by user in directive html markup*/
      html += '</span>';
      return html;
    }
  }
});
