sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'dashboard3',
            componentId: 'PackagesObjectPage',
            contextPath: '/Packages'
        },
        CustomPageDefinitions
    );
});