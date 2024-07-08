sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'dashboard2',
            componentId: 'PackagesObjectPage',
            contextPath: '/Packages/childrenPackages'
        },
        CustomPageDefinitions
    );
});