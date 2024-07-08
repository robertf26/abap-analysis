using PackageService as service from '../../srv/package-service';

annotate service.Packages with @(

    UI.PresentationVariant                        : {
        $Type         : 'UI.PresentationVariantType',
        GroupBy       : [
            masterLanguage,
            parent.name
        ],
        Total         : [count],
        Visualizations: [
            '@UI.Chart',
            '@UI.LineItem'
        ]
    },
    UI.LineItem                                   : [

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
        {
            $Type: 'UI.DataField',
            Label: 'Version',
            Value: version,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Parent Name',
            Value: parent.name,
        },
    ],

    UI.SelectionFields                            : [
        name,
        techName,
        parent.name
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

annotate service.Packages with @(UI.FieldGroup #Packages: {
    $Type: 'UI.FieldGroupType',
    Data : [
        {
            Value: name,
            Label: 'Name'
        },
        {
            Label: 'Technical Name',
            Value: techName,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Description',
            Value: description,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Responsible',
            Value: responsible,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Version',
            Value: version,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Master Languague',
            Value: masterLanguage,
        },
    ],
}, );

annotate service.Programs with @(UI.LineItem #Programs: [
    {
        $Type: 'UI.DataField',
        Label: 'Name',
        Value: name,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Type',
        Value: type,
    }
], );

annotate service.Packages with @(UI.LineItem #Packages: [
    {
        $Type: 'UI.DataField',
        Label: 'Name',
        Value: name,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Type',
        Value: type,
    },
        {
        $Type: 'UI.DataField',
        Label: 'Version',
        Value: version,
    }
], );


annotate service.Packages with @(UI.Facets: [

    {
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Packages',
    },
    {
        $Type : 'UI.ReferenceFacet',
        Target: 'childrenPrograms/@UI.LineItem#Programs',
    },
        {
        $Type : 'UI.ReferenceFacet',
        Target: 'childrenPackages/@UI.LineItem#Packages',
    },
]);
