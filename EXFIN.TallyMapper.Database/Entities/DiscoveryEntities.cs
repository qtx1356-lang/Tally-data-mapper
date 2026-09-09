using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EXFIN.TallyMapper.Database.Entities
{
    public class DiscoveryScanEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string TallyVersion { get; set; } = "TallyPrime 3.0+";
        public string Build { get; set; } = "Release 3.0.1";
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public string Status { get; set; } = "Completed";
        public int CollectionCount { get; set; }
        public int FieldCount { get; set; }
        public int RelationshipCount { get; set; }
        public int ErrorCount { get; set; }
        public string TechnicalDetails { get; set; } = string.Empty;
    }

    public class DiscoveryCollectionEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int ScanId { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Source { get; set; } = "ODBC";
        public string ObjectType { get; set; } = "Tally-related";
        public string Category { get; set; } = "Other";
        public string CategoryClassification { get; set; } = "Inferred";
        public string Confidence { get; set; } = "Verified";
        public string CustomType { get; set; } = "Standard";
        public bool IsQueryable { get; set; } = true;
        public bool IsReadable { get; set; } = true;
        public bool IsExpandable { get; set; } = true;
        public int? RecordCount { get; set; }
        public string? Description { get; set; }
        public bool IsFavorite { get; set; }
    }

    public class DiscoveryFieldEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int CollectionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DataType { get; set; } = "String";
        public bool Nullable { get; set; } = true;
        public int Ordinal { get; set; }
        public string Source { get; set; } = "ODBC";
        public string Confidence { get; set; } = "Verified";
        public string CustomType { get; set; } = "Standard";
        public bool IsOdbcExposed { get; set; } = true;
        public string? Description { get; set; }
    }

    public class DiscoveryRelationshipEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int ScanId { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string FromEntityId { get; set; } = string.Empty;
        public string ToEntityId { get; set; } = string.Empty;
        public string FromField { get; set; } = string.Empty;
        public string ToField { get; set; } = string.Empty;
        public string RelationshipType { get; set; } = "References";
        public string Cardinality { get; set; } = "ManyToOne";
        public string SourceType { get; set; } = "ODBC";
        public string Confidence { get; set; } = "Verified";
        public string Description { get; set; } = string.Empty;

        // Legacy compatibility properties
        [NotMapped]
        public string PrimaryCollection { get => FromEntityId; set => FromEntityId = value; }
        [NotMapped]
        public string ForeignCollection { get => ToEntityId; set => ToEntityId = value; }
        [NotMapped]
        public string PrimaryKeyField { get => FromField; set => FromField = value; }
        [NotMapped]
        public string ForeignKeyField { get => ToField; set => ToField = value; }
    }

    public class CanonicalFieldPathEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int ScanId { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string PathString { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public string DataType { get; set; } = "String";
        public bool IsValid { get; set; } = true;
        public string Confidence { get; set; } = "Verified";
        public string SourceType { get; set; } = "TDL";
        public bool IsFavorite { get; set; }
    }

    public class TallyObjectEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int ScanId { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string ObjectType { get; set; } = "Master";
        public string SourceType { get; set; } = "TDL";
        public string Confidence { get; set; } = "Verified";
        public string CustomType { get; set; } = "Standard";
        public string RecognitionStatus { get; set; } = "Recognized";
        public string? ParentObject { get; set; }
    }

    public class FavoriteCollectionEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string CollectionName { get; set; } = string.Empty;
    }

    public class FavoriteFieldPathEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public string PathString { get; set; } = string.Empty;
    }
}

