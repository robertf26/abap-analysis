using {
    cuid,
    sap.common.CodeList
} from '@sap/cds/common';

namespace abap.db;

entity Packages : cuid {
  
  techName  : String;

  name : String not null  @mandatory;
  type : String;
  responsible : String;
  masterLanguage : String;
  masterSystem : String;
  description : String;
  version : String;
  changedAt : Date;
  changedBy : String;
  createdAt : Date;
  createdBy : String;

  parent : Association to Packages;
  childrenPackages : Association to many Packages on childrenPackages.parent = $self;
  childrenObjects: Association to many Objects on childrenObjects.parent = $self;
  childrenClasses: Association to many Objects on childrenClasses.parent = $self;
  childrenPrograms: Association to many Objects on childrenPrograms.parent = $self;
}

entity Objects : cuid {

  name : String not null  @mandatory;
  type : String;
  responsible : String;
  masterLanguage : String;
  masterSystem : String;
  description : String;
  version : String;
  changedAt : Date;
  changedBy : String;
  createdAt : Date;
  createdBy : String;

  parent : Association to Packages;
}

entity Classes : cuid {

  final : Boolean;
  abstract: Boolean;
  visibility : String;
  category : String;
  sharedMemoryEnabled : Boolean;
  modeled : Boolean;
  fixPointArithmetic : Boolean;
  activeUnicodeCheck : Boolean;
  sourceCode : LargeString;
  name : String not null  @mandatory;
  type : String;
  responsible : String;
  masterLanguage : String;
  masterSystem : String;
  description : String;
  version : String;
  changedAt : Date;
  changedBy : String;
  createdAt : Date;
  createdBy : String;

  parent : Association to Packages;
  
}

entity Programs : cuid {
  lockedByEditor : Boolean;
  programType : String;
  sourceObjectStatus: String;
  fixPointArithmetic : Boolean;
  activeUnicodeCheck : Boolean;
  descriptionTextLimit : Int16;
  sourceCode : LargeString;
  
  name : String not null  @mandatory;
  type : String;
  responsible : String;
  masterLanguage : String;
  masterSystem : String;
  description : String;
  version : String;
  changedAt : Date;
  changedBy : String;
  createdAt : Date;
  createdBy : String;

  parent : Association to Packages;
  
}

entity transportRequest : cuid {
  
}
