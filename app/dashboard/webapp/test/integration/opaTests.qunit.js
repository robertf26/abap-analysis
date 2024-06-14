sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'dashboard/test/integration/FirstJourney',
		'dashboard/test/integration/pages/PackagesList',
		'dashboard/test/integration/pages/PackagesObjectPage'
    ],
    function(JourneyRunner, opaJourney, PackagesList, PackagesObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('dashboard') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePackagesList: PackagesList,
					onThePackagesObjectPage: PackagesObjectPage
                }
            },
            opaJourney.run
        );
    }
);