using abap.db as db from '../db/data-model';

service PackageService {
    @readonly
    @(
        Aggregation       : {ApplySupported: {
            $Type                 : 'Aggregation.ApplySupportedType',
            Transformations       : [
                'aggregate',
                'groupby',
                'concat',
                'identity',
                'filter',
                'search',
                'bottomcount',
                'topcount',
                'orderby',
                'top',
                'skip'
            ],
            GroupableProperties   : [
                'masterLanguage','responsible', 'parent_ID', 'masterSystem'
            ],
            AggregatableProperties: [
                {Property: count},
                {Property: ID}
            ]
        }},
        Common.SemanticKey: [ID]
    )
    entity Packages as select from db.Packages{
        *, 
        1 as count: Integer
    };
    entity Objects as projection on db.Objects;
    entity Classes as projection on db.Classes;
    entity Programs as projection on db.Programs;
}
