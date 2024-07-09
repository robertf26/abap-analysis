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

//Package Object Page

annotate service.Packages with @(
    UI.FieldGroup #Packages: {
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
    },
    UI.HeaderInfo          : {
        TypeName      : 'Package',
        TypeNamePlural: 'Packages'
    }
);

annotate service.Objects with @(
    UI.LineItem #Objects: [
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
    ],
    UI.HeaderInfo        : {
        TypeName      : 'ABAP Object',
        TypeNamePlural: 'ABAP Objects'
    }
);

annotate service.Programs with @(
    UI.LineItem #Programs: [
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
    ],
    UI.HeaderInfo        : {
        TypeName      : 'Program',
        TypeNamePlural: 'Progams'
    }
);

annotate service.Classes with @(
    UI.LineItem #Classes: [
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
    ],
    UI.HeaderInfo       : {
        TypeName      : 'Class',
        TypeNamePlural: 'Classes'
    }
);

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
        Target: 'childrenPackages/@UI.LineItem#Packages',
    },
    {
        $Type : 'UI.ReferenceFacet',
        Target: 'childrenPrograms/@UI.LineItem#Programs',
    },
    {
        $Type : 'UI.ReferenceFacet',
        Target: 'childrenClasses/@UI.LineItem#Classes',
    },
        {
        $Type : 'UI.ReferenceFacet',
        Target: 'childrenObjects/@UI.LineItem#Objects',
    },

]);

//Classes Object Page

annotate service.Classes with @(UI.FieldGroup #Classes: {
    $Type: 'UI.FieldGroupType',
    Data : [
        {
            Value: name,
            Label: 'Name'
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
                {
            $Type: 'UI.DataField',
            Label: 'Source Code',
            Value: sourceCode,
        },
    ],
}, );

annotate service.Classes with @(UI.Facets: [

{
    $Type : 'UI.ReferenceFacet',
    Target: '@UI.FieldGroup#Classes',
}, ]);

//Objects Object Page

annotate service.Objects with @(UI.FieldGroup #Objects: {
    $Type: 'UI.FieldGroupType',
    Data : [
        {
            Value: name,
            Label: 'Name'
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
        }
    ],
}, );

annotate service.Objects with @(UI.Facets: [

{
    $Type : 'UI.ReferenceFacet',
    Target: '@UI.FieldGroup#Objects',
}, ]);

//Program Object Page

annotate service.Programs with @(UI.FieldGroup #Program: {
    $Type: 'UI.FieldGroupType',
    Data : [
        {
            Value: name,
            Label: 'Name'
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
                {
            $Type: 'UI.DataField',
            Label: 'Source Code',
            Value: sourceCode,
        },
    ],
}, );

annotate service.Programs with @(UI.Facets: [

{
    $Type : 'UI.ReferenceFacet',
    Target: '@UI.FieldGroup#Program',
}, ]);
