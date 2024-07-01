using PackageService as service from '../../srv/package-service';

annotate service.Packages with @(

    UI.PresentationVariant                        : {
        GroupBy       : [masterLanguage],
        Total         : [count],
        Visualizations: [
            '@UI.Chart',
            '@UI.LineItem'
        ]
    },
    UI.LineItem                                   : [
        {
            $Type: 'UI.DataField',
            Label: 'Package ID',
            Value: ID,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Techincal Name',
            Value: techName,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Name',
            Value: name,
        },
    ],

    UI.SelectionFields :[
        name, techName
    ],


    Analytics.AggregatedProperty #numberofPackages: {
        Name                : 'NumberPackages',
        AggregationMethod   : 'sum',
        AggregatableProperty: count,
        ![@Common.Label]    : 'Number of Packages'
    },


    UI.Chart                                      : {
        Title              : 'Packages Chart',
        ChartType          : #Column,
        DynamicMeasures    : ['@Analytics.AggregatedProperty#numberofPackages', ],
        Dimensions         : ['masterLanguage'],
        MeasureAttributes  : [{
            DynamicMeasure: '@Analytics.AggregatedProperty#numberofPackages',
            Role          : #Axis1
        }],
        DimensionAttributes: [{
            Dimension: 'masterLanguage',
            Role     : #Category
        }, ]
    },
);
