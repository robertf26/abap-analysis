sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'dashboard2/test/integration/FirstJourney',
		'dashboard2/test/integration/pages/PackagesList',
		'dashboard2/test/integration/pages/PackagesObjectPage'
    ],
    function(JourneyRunner, opaJourney, PackagesList, PackagesObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('dashboard2') + '/index.html'
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