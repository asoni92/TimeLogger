var DemoRequest = concurApp.controller('DemoRequest', ['$scope', '$modal', function($scope, $modal){

    $scope.init = function(){
        //write the init process here
        $scope.getDemoRequests();
    }

    $scope.demoRequestGridOptions = {
        enableSorting: false,
        paginationPageSizes: [25, 50, 75],
        paginationPageSize: 25,
        columnDefs: [
            {
                field: 'requestedTime',
                displayName: 'REQUESTED TIME',
                enableColumnMenu: false,
                width: '*'
            },
            {
                field: 'lastName',
                displayName: 'LAST NAME',
                enableSorting: true,
                width: '*'
            },
            {
                field: 'firstName',
                displayName: 'FIRST NAME',
                enableColumnMenu: false,
                width: '*'
            },
            {
                field: 'company',
                displayName: 'COMPANY',
                enableColumnMenu: false,
                width: '*'
            },
            {
                field: 'state',
                displayName: 'STATE',
                enableColumnMenu: false,
                width: '*'
            },
            {
                field: 'phone',
                displayName: 'PHONE',
                enableColumnMenu: false,
                width: '*'
            },
            {
                field: 'email',
                displayName: 'EMAIL',
                enableColumnMenu: false,
                width: '*'
            },
            {
                field: 'action',
                displayName: '',
                cellTemplate: '<div><button type="submit" ng-show="!row.entity.scheduledStatus" class="btn btn-grey btn-sm">SCHEDULE</button>'+
                '<button type="submit" ng-show="row.entity.scheduledStatus" class="btn btn-success btn-sm"><i class="fa fa-check"></i>SCHEDULED</button>'+
                '<button type="submit" class="btn btn-default btn-sm">QUESTIONS</button></div>',
                enableColumnMenu: false,
                width: '*'
            }
        ],
        rowHeight: 40,
        enableColumnResize: true,

        onRegisterApi: function (gridApi) {
            $scope.grid1Api = gridApi;
        }
    };

    $scope.getDemoRequests = function(){
        $scope.demoRequestGridOptions.data = $scope.demoRequestsData;
    }

    $scope.openDiscoveryQuestionsModal = function(){
        var modalInstance = $modal.open({
            templateUrl: '/app/demoRequest/discoveryQuestions/discoveryQuestionsMdlCtrl.html',
            controller: 'discoveryQuestionsMdlCtrl',
            size: 'md'
        });
    }

    $scope.demoRequestsData = [
            {
                requestedTime: '04/02 @ 2:30',
                lastName: 'Morrison',
                firstName: 'Grant',
                company: 'Harrison Bennini',
                state: 'MI',
                phone: '415-555-6789',
                email: 'g.morrison@gmail.com',
                scheduledStatus: false
            },
            {
                requestedTime: '04/02 @ 4:30 PM',
                lastName: 'Lawson',
                firstName: 'Norris',
                company: 'Google',
                state: 'CA',
                phone: '415-786-9876',
                email: 'norris_l@gmail.com',
                scheduledStatus: false
            },
            {
                requestedTime: '04/02 @ 11:30 AM',
                lastName: 'Melissa',
                firstName: 'Yamaguchi',
                company: 'Northwestern University',
                state: 'IL',
                phone: '567-998-3209',
                email: 'melissa.y@norwest.edu.org',
                scheduledStatus: true
            },
            {
                requestedTime: '04/02 @ 4:30 PM',
                lastName: 'Eliopolous',
                firstName: 'Ahkmed',
                company: ' Ars Technica',
                state: 'AZ',
                phone: '345-667-0987',
                email: 'e.eliopolous@arstech.com',
                scheduledStatus: true
            },
            {
                requestedTime: '04/02 @ 12:30 PM',
                lastName: 'Marcus',
                firstName: 'Phillip',
                company: 'Amazon',
                state: 'TN',
                phone: '677-098-2387',
                email: 'pmarcus@amazon.com',
                scheduledStatus: false
            }
        ];

    $scope.init();
}]);