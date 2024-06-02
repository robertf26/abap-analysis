using abap.db as db from '../db/data-model';

service PackageService {
    entity Packages as projection on db.Packages;
    entity Objects as projection on db.Objects;
    entity Classes as projection on db.Classes;
    entity Programs as projection on db.Programs;
}
