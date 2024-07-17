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
        ID,
        type,
        createdAt,
        masterSystem
    ],


    Analytics.AggregatedProperty #numberofPackages: {
        Name                : 'NumberPackages',
        AggregationMethod   : 'sum',
        AggregatableProperty: count,
        ![@Common.Label]    : ' '
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
    UI.Chart #PackageResponsibility : {
        $Type : 'UI.ChartDefinitionType',
        ChartType : #Bar,
        Title : 'Package Responsibilities',
        Description : 'Distribution of responsibilities across different packages',
        Dimensions : [
            responsible,
        ],
        DimensionAttributes : [
            {
                $Type : 'UI.ChartDimensionAttributeType',
                Dimension : responsible,
                Role : #Category,
            },
        ],
        DynamicMeasures : [
            '@Analytics.AggregatedProperty#numberofPackages',
        ],
        MeasureAttributes : [
            {
                $Type : 'UI.ChartMeasureAttributeType',
                DynamicMeasure : '@Analytics.AggregatedProperty#numberofPackages',
                Role : #Axis1,
            },
        ],
    },
    UI.PresentationVariant #PackageRespOverview : {
        $Type : 'UI.PresentationVariantType',
        Visualizations : [
            '@UI.Chart#PackageResponsibility',
        ],
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
            {
                $Type: 'UI.DataField',
                Label: 'Created At',
                Value: createdAt,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Created by',
                Value: createdBy,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Changed at',
                Value: changedAt,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Changed by',
                Value: changedBy,
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
        },
        {
            $Type: 'UI.DataField',
            Label: 'Version',
            Value: version,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Description',
            Value: description,
        }
    ],
    UI.HeaderInfo       : {
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
        },
        {
            $Type: 'UI.DataField',
            Label: 'Version',
            Value: version,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Description',
            Value: description,
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
        },
        {
            $Type: 'UI.DataField',
            Label: 'Version',
            Value: version,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Description',
            Value: description,
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
    },
    {
        $Type: 'UI.DataField',
        Label: 'Description',
        Value: description,
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
            Label: 'Type',
            Value: type,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Description',
            Value: description,
        },
        {
            $Type: 'UI.DataField',
            Label: 'final',
            Value: final,
        },
        {
            $Type: 'UI.DataField',
            Label: 'abstract',
            Value: abstract,
        },
        {
            $Type: 'UI.DataField',
            Label: 'visibility',
            Value: visibility,
        },
        {
            $Type: 'UI.DataField',
            Label: 'category',
            Value: category,
        },
        {
            $Type: 'UI.DataField',
            Label: 'sharedMemoryEnabled',
            Value: sharedMemoryEnabled,
        },
        {
            $Type: 'UI.DataField',
            Label: 'modeled',
            Value: modeled,
        },
        {
            $Type: 'UI.DataField',
            Label: 'fixPointArithmetic',
            Value: fixPointArithmetic,
        },
        {
            $Type: 'UI.DataField',
            Label: 'activeUnicodeCheck',
            Value: activeUnicodeCheck,
        },

        {
            $Type: 'UI.DataField',
            Label: 'Master Language',
            Value: masterLanguage,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Master System',
            Value: masterSystem,
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
            Label: 'Created At',
            Value: createdAt,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Created by',
            Value: createdBy,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Changed at',
            Value: changedAt,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Changed by',
            Value: changedBy,
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
            Label: 'Type',
            Value: type,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Description',
            Value: description,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Master Language',
            Value: masterLanguage,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Master System',
            Value: masterSystem,
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
            Label: 'Created At',
            Value: createdAt,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Created by',
            Value: createdBy,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Changed at',
            Value: changedAt,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Changed by',
            Value: changedBy,
        },
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
            Label: 'Master System',
            Value: masterSystem,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Locked By Editor',
            Value: lockedByEditor,
        },
        {
            $Type: 'UI.DataField',
            Label: 'programType',
            Value: programType,
        },
        {
            $Type: 'UI.DataField',
            Label: 'sourceObjectStatus',
            Value: sourceObjectStatus,
        },
        {
            $Type: 'UI.DataField',
            Label: 'fixPointArithmetic',
            Value: fixPointArithmetic,
        },
        {
            $Type: 'UI.DataField',
            Label: 'activeUnicodeCheck',
            Value: activeUnicodeCheck,
        },
        {
            $Type: 'UI.DataField',
            Label: 'descriptionTextLimit',
            Value: descriptionTextLimit,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Master System',
            Value: masterSystem,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Created At',
            Value: createdAt,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Created by',
            Value: createdBy,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Changed at',
            Value: changedAt,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Changed by',
            Value: changedBy,
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
annotate service.Packages with {
    responsible @Common.ValueList #ResponsibilityList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Packages',
        PresentationVariantQualifier : 'PackageRespOverview',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : responsible,
                ValueListProperty : 'responsible',
            },
        ],
    }
};

annotate service.Packages with @(
    UI.Chart #visualFilter : {
        $Type : 'UI.ChartDefinitionType',
        ChartType : #Bar,
        Dimensions : [
            parent_ID,
        ],
        DynamicMeasures : [
            '@Analytics.AggregatedProperty#numberofPackages',
        ],
    },
    UI.PresentationVariant #visualFilter : {
        $Type : 'UI.PresentationVariantType',
        Visualizations : [
            '@UI.Chart#visualFilter',
        ],
    }
);
annotate service.Packages with {
    ID @(Common.ValueList #visualFilter : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Packages',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : ID,
                    ValueListProperty : 'parent_ID',
                },
            ],
            PresentationVariantQualifier : 'visualFilter',
        },
        Common.Label : 'Parent ID'
)};

annotate service.Packages with {
    responsible @Common.Text : {
            $value : name,
            ![@UI.TextArrangement] : #TextFirst,
        }
};
annotate service.Packages with @(
    UI.Chart #visualFilter1 : {
        $Type : 'UI.ChartDefinitionType',
        ChartType : #Bar,
        Dimensions : [
            type,
        ],
        DynamicMeasures : [
            '@Analytics.AggregatedProperty#numberofPackages',
        ],
    },
    UI.PresentationVariant #visualFilter1 : {
        $Type : 'UI.PresentationVariantType',
        Visualizations : [
            '@UI.Chart#visualFilter1',
        ],
    }
);
annotate service.Packages with {
    type @(Common.Label : ' Type'
)};
annotate service.Packages with @(
    UI.Chart #visualFilter2 : {
        $Type : 'UI.ChartDefinitionType',
        ChartType : #Line,
        Dimensions : [
            createdAt,
        ],
        DynamicMeasures : [
            '@Analytics.AggregatedProperty#numberofPackages',
        ],
        DimensionAttributes : [
            {
                Dimension : createdAt,
                Role : #Series,
            },
        ],
    },
    UI.PresentationVariant #visualFilter2 : {
        $Type : 'UI.PresentationVariantType',
        Visualizations : [
            '@UI.Chart#visualFilter2',
        ],
    }
);
annotate service.Packages with {
    createdAt @(Common.Label : 'createdAt'
)};
annotate service.Packages with {
    createdAt @Common.Text : {
            $value : name,
            ![@UI.TextArrangement] : #TextSeparate,
        }
};
annotate service.Packages with @(
    UI.SelectionVariant #visualFilter : {
        SelectOptions : [
            {
                $Type : 'UI.SelectOptionType',
                PropertyName : count,
                Ranges : [
                    {
                        Sign : #I,
                        Option : #EQ,
                        Low : 0,
                    },
                ],
            },
        ],
    }
);
annotate service.Packages with @(
    UI.Chart #visualFilter3 : {
        $Type : 'UI.ChartDefinitionType',
        ChartType : #Bar,
        Dimensions : [
            masterSystem,
        ],
        DynamicMeasures : [
            '@Analytics.AggregatedProperty#numberofPackages',
        ],
    },
    UI.PresentationVariant #visualFilter3 : {
        $Type : 'UI.PresentationVariantType',
        Visualizations : [
            '@UI.Chart#visualFilter3',
        ],
    }
);


annotate service.Packages with {
    masterSystem @(Common.ValueList #visualFilter : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Packages',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : masterSystem,
                    ValueListProperty : 'masterSystem',
                },
            ],
            PresentationVariantQualifier : 'visualFilter3',
        },
        Common.Label : 'master system'
)};
annotate service.Packages with {
    masterSystem @Common.Text : masterLanguage
};
