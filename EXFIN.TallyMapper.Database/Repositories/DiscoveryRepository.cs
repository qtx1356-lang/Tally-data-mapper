using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Data;
using EXFIN.TallyMapper.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace EXFIN.TallyMapper.Database.Repositories
{
    public class DiscoveryRepository : IDiscoveryRepository
    {
        public async Task<int> SaveScanAsync(DiscoveryScan scan)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var entity = new DiscoveryScanEntity
            {
                CompanyId = scan.CompanyId ?? string.Empty,
                CompanyName = scan.CompanyName ?? string.Empty,
                StartedAt = scan.StartedAt,
                CompletedAt = scan.CompletedAt,
                Status = scan.Status,
                CollectionCount = scan.CollectionCount,
                FieldCount = scan.FieldCount,
                ErrorCount = scan.ErrorCount,
                TechnicalDetails = scan.TechnicalDetails ?? string.Empty
            };

            db.DiscoveryScans.Add(entity);
            await db.SaveChangesAsync();

            scan.Id = entity.Id;
            return entity.Id;
        }

        public async Task UpdateScanStatusAsync(int scanId, string status, int collectionCount, int fieldCount, int errorCount, string technicalDetails)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var scan = await db.DiscoveryScans.FindAsync(scanId);
            if (scan != null)
            {
                scan.Status = status;
                scan.CompletedAt = DateTime.UtcNow;
                scan.CollectionCount = collectionCount;
                scan.FieldCount = fieldCount;
                scan.ErrorCount = errorCount;
                scan.TechnicalDetails = technicalDetails;

                await db.SaveChangesAsync();
            }
        }

        public async Task SaveCollectionsAndFieldsAsync(int scanId, List<DiscoveryCollection> collections)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var scan = await db.DiscoveryScans.FindAsync(scanId);
            string companyId = scan?.CompanyId ?? string.Empty;

            var favoriteNames = await db.FavoriteCollections
                .Where(f => f.CompanyId == companyId)
                .Select(f => f.CollectionName)
                .ToListAsync();

            foreach (var col in collections)
            {
                var colEntity = new DiscoveryCollectionEntity
                {
                    ScanId = scanId,
                    CompanyId = companyId,
                    Name = col.Name,
                    DisplayName = string.IsNullOrWhiteSpace(col.DisplayName) ? col.Name : col.DisplayName,
                    Source = col.Source.ToString(),
                    ObjectType = col.ObjectType ?? "Tally-related",
                    Category = col.Category.ToString(),
                    CategoryClassification = col.CategoryClassification.ToString(),
                    IsQueryable = col.IsQueryable,
                    IsReadable = col.IsReadable,
                    RecordCount = col.RecordCount,
                    Description = col.Description,
                    IsFavorite = favoriteNames.Contains(col.Name, StringComparer.OrdinalIgnoreCase)
                };

                db.DiscoveryCollections.Add(colEntity);
                await db.SaveChangesAsync();

                col.Id = colEntity.Id;

                foreach (var field in col.Fields)
                {
                    var fieldEntity = new DiscoveryFieldEntity
                    {
                        CollectionId = colEntity.Id,
                        Name = field.Name,
                        DisplayName = string.IsNullOrWhiteSpace(field.DisplayName) ? field.Name : field.DisplayName,
                        DataType = field.DataType.ToString(),
                        Nullable = field.Nullable,
                        Ordinal = field.Ordinal,
                        Source = field.Source.ToString(),
                        Description = field.Description
                    };

                    db.DiscoveryFields.Add(fieldEntity);
                }

                await db.SaveChangesAsync();
            }
        }

        public async Task<DiscoveryScan?> GetLatestScanAsync(string companyId)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var entity = await db.DiscoveryScans
                .Where(s => s.CompanyId == companyId)
                .OrderByDescending(s => s.StartedAt)
                .FirstOrDefaultAsync();

            if (entity == null) return null;

            return new DiscoveryScan
            {
                Id = entity.Id,
                CompanyId = entity.CompanyId,
                CompanyName = entity.CompanyName,
                StartedAt = entity.StartedAt,
                CompletedAt = entity.CompletedAt,
                Status = entity.Status,
                CollectionCount = entity.CollectionCount,
                FieldCount = entity.FieldCount,
                ErrorCount = entity.ErrorCount,
                TechnicalDetails = entity.TechnicalDetails
            };
        }

        public async Task<List<DiscoveryCollection>> GetCollectionsAsync(string companyId, bool includeSystem = false)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var latestScan = await db.DiscoveryScans
                .Where(s => s.CompanyId == companyId)
                .OrderByDescending(s => s.StartedAt)
                .FirstOrDefaultAsync();

            if (latestScan == null) return new List<DiscoveryCollection>();

            var query = db.DiscoveryCollections.Where(c => c.ScanId == latestScan.Id);
            if (!includeSystem)
            {
                query = query.Where(c => c.ObjectType != "System" && c.Category != "System");
            }

            var entities = await query.ToListAsync();

            var favoriteNames = await db.FavoriteCollections
                .Where(f => f.CompanyId == companyId)
                .Select(f => f.CollectionName)
                .ToListAsync();

            var result = new List<DiscoveryCollection>();
            foreach (var e in entities)
            {
                Enum.TryParse<SourceType>(e.Source, true, out var source);
                Enum.TryParse<CollectionCategory>(e.Category, true, out var category);
                Enum.TryParse<CategoryClassification>(e.CategoryClassification, true, out var classification);

                var fields = await GetFieldsAsync(e.Id);

                result.Add(new DiscoveryCollection
                {
                    Id = e.Id,
                    ScanId = e.ScanId,
                    CompanyId = e.CompanyId,
                    Name = e.Name,
                    DisplayName = e.DisplayName,
                    Source = source,
                    ObjectType = e.ObjectType,
                    Category = category,
                    CategoryClassification = classification,
                    IsQueryable = e.IsQueryable,
                    IsReadable = e.IsReadable,
                    RecordCount = e.RecordCount,
                    Description = e.Description,
                    IsFavorite = favoriteNames.Contains(e.Name, StringComparer.OrdinalIgnoreCase),
                    Fields = fields
                });
            }

            return result;
        }

        public async Task<List<DiscoveryField>> GetFieldsAsync(int collectionId)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var entities = await db.DiscoveryFields
                .Where(f => f.CollectionId == collectionId)
                .OrderBy(f => f.Ordinal)
                .ToListAsync();

            return entities.Select(e =>
            {
                Enum.TryParse<FieldDataType>(e.DataType, true, out var dataType);
                Enum.TryParse<SourceType>(e.Source, true, out var source);

                return new DiscoveryField
                {
                    Id = e.Id,
                    CollectionId = e.CollectionId,
                    Name = e.Name,
                    DisplayName = e.DisplayName,
                    DataType = dataType,
                    Nullable = e.Nullable,
                    Ordinal = e.Ordinal,
                    Source = source,
                    Description = e.Description
                };
            }).ToList();
        }

        public async Task SaveRelationshipsAsync(int scanId, List<TallyRelationship> relationships)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var scan = await db.DiscoveryScans.FindAsync(scanId);
            string companyId = scan?.CompanyId ?? string.Empty;

            foreach (var rel in relationships)
            {
                var entity = new DiscoveryRelationshipEntity
                {
                    ScanId = scanId,
                    CompanyId = companyId,
                    FromEntityId = rel.FromEntityId,
                    ToEntityId = rel.ToEntityId,
                    FromField = rel.FromField,
                    ToField = rel.ToField,
                    RelationshipType = rel.RelationshipType.ToString(),
                    Cardinality = rel.Cardinality.ToString(),
                    SourceType = rel.SourceType.ToString(),
                    Confidence = rel.Confidence.ToString(),
                    Description = rel.Description ?? string.Empty
                };

                db.DiscoveryRelationships.Add(entity);
            }

            await db.SaveChangesAsync();
        }

        public async Task SaveCanonicalFieldPathsAsync(int scanId, List<CanonicalFieldPath> paths)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var scan = await db.DiscoveryScans.FindAsync(scanId);
            string companyId = scan?.CompanyId ?? string.Empty;

            var favoritePaths = await db.FavoriteFieldPaths
                .Where(f => f.CompanyId == companyId)
                .Select(f => f.PathString)
                .ToListAsync();

            foreach (var p in paths)
            {
                var entity = new CanonicalFieldPathEntity
                {
                    ScanId = scanId,
                    CompanyId = companyId,
                    PathString = p.PathString,
                    EntityName = p.EntityName,
                    FieldName = p.FieldName,
                    DataType = p.DataType.ToString(),
                    IsValid = p.IsValid,
                    Confidence = p.Confidence.ToString(),
                    SourceType = p.SourceType.ToString(),
                    IsFavorite = favoritePaths.Contains(p.PathString, StringComparer.OrdinalIgnoreCase)
                };

                db.CanonicalFieldPaths.Add(entity);
            }

            await db.SaveChangesAsync();
        }

        public async Task SaveTallyObjectsAsync(int scanId, List<TallyObjectDefinition> objects)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var scan = await db.DiscoveryScans.FindAsync(scanId);
            string companyId = scan?.CompanyId ?? string.Empty;

            foreach (var obj in objects)
            {
                var entity = new TallyObjectEntity
                {
                    ScanId = scanId,
                    CompanyId = companyId,
                    Name = obj.Name,
                    DisplayName = string.IsNullOrWhiteSpace(obj.DisplayName) ? obj.Name : obj.DisplayName,
                    ObjectType = obj.ObjectType,
                    SourceType = obj.SourceType.ToString(),
                    Confidence = obj.Confidence.ToString(),
                    CustomType = obj.CustomType.ToString(),
                    RecognitionStatus = obj.RecognitionStatus.ToString(),
                    ParentObject = obj.ParentObject
                };

                db.TallyObjects.Add(entity);
            }

            await db.SaveChangesAsync();
        }

        public async Task<DiscoveryScan?> GetScanByIdAsync(int scanId)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var entity = await db.DiscoveryScans.FindAsync(scanId);
            if (entity == null) return null;

            return new DiscoveryScan
            {
                Id = entity.Id,
                CompanyId = entity.CompanyId,
                CompanyName = entity.CompanyName,
                TallyVersion = entity.TallyVersion,
                Build = entity.Build,
                StartedAt = entity.StartedAt,
                CompletedAt = entity.CompletedAt,
                Status = entity.Status,
                CollectionCount = entity.CollectionCount,
                FieldCount = entity.FieldCount,
                RelationshipCount = entity.RelationshipCount,
                ErrorCount = entity.ErrorCount,
                TechnicalDetails = entity.TechnicalDetails
            };
        }

        public async Task<List<DiscoveryScan>> GetScanHistoryAsync(string companyId)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var entities = await db.DiscoveryScans
                .Where(s => s.CompanyId == companyId)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync();

            return entities.Select(e => new DiscoveryScan
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                CompanyName = e.CompanyName,
                TallyVersion = e.TallyVersion,
                Build = e.Build,
                StartedAt = e.StartedAt,
                CompletedAt = e.CompletedAt,
                Status = e.Status,
                CollectionCount = e.CollectionCount,
                FieldCount = e.FieldCount,
                RelationshipCount = e.RelationshipCount,
                ErrorCount = e.ErrorCount,
                TechnicalDetails = e.TechnicalDetails
            }).ToList();
        }

        public async Task<List<TallyRelationship>> GetRelationshipsAsync(string companyId, int? scanId = null)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            int targetScanId = scanId ?? 0;
            if (targetScanId == 0)
            {
                var latest = await GetLatestScanAsync(companyId);
                if (latest == null) return new List<TallyRelationship>();
                targetScanId = latest.Id;
            }

            var entities = await db.DiscoveryRelationships
                .Where(r => r.ScanId == targetScanId)
                .ToListAsync();

            return entities.Select(e =>
            {
                Enum.TryParse<TallyRelationshipType>(e.RelationshipType, true, out var relType);
                Enum.TryParse<CardinalityType>(e.Cardinality, true, out var card);
                Enum.TryParse<SourceType>(e.SourceType, true, out var src);
                Enum.TryParse<DiscoveryConfidence>(e.Confidence, true, out var conf);

                return new TallyRelationship
                {
                    Id = e.Id,
                    ScanId = e.ScanId,
                    CompanyId = e.CompanyId,
                    FromEntityId = string.IsNullOrEmpty(e.FromEntityId) ? e.PrimaryCollection : e.FromEntityId,
                    ToEntityId = string.IsNullOrEmpty(e.ToEntityId) ? e.ForeignCollection : e.ToEntityId,
                    FromField = string.IsNullOrEmpty(e.FromField) ? e.PrimaryKeyField : e.FromField,
                    ToField = string.IsNullOrEmpty(e.ToField) ? e.ForeignKeyField : e.ToField,
                    RelationshipType = relType,
                    Cardinality = card,
                    SourceType = src,
                    Confidence = conf,
                    Description = e.Description
                };
            }).ToList();
        }

        public async Task<List<CanonicalFieldPath>> GetCanonicalFieldPathsAsync(string companyId, int? scanId = null)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            int targetScanId = scanId ?? 0;
            if (targetScanId == 0)
            {
                var latest = await GetLatestScanAsync(companyId);
                if (latest == null) return new List<CanonicalFieldPath>();
                targetScanId = latest.Id;
            }

            var favoritePaths = await GetFavoriteFieldPathsAsync(companyId);

            var entities = await db.CanonicalFieldPaths
                .Where(p => p.ScanId == targetScanId)
                .ToListAsync();

            return entities.Select(e =>
            {
                Enum.TryParse<FieldDataType>(e.DataType, true, out var dt);
                Enum.TryParse<DiscoveryConfidence>(e.Confidence, true, out var conf);
                Enum.TryParse<SourceType>(e.SourceType, true, out var src);

                return new CanonicalFieldPath
                {
                    Id = e.Id,
                    ScanId = e.ScanId,
                    CompanyId = e.CompanyId,
                    PathString = e.PathString,
                    EntityName = e.EntityName,
                    FieldName = e.FieldName,
                    DataType = dt,
                    IsValid = e.IsValid,
                    Confidence = conf,
                    SourceType = src,
                    IsFavorite = favoritePaths.Contains(e.PathString, StringComparer.OrdinalIgnoreCase)
                };
            }).ToList();
        }

        public async Task<List<TallyObjectDefinition>> GetTallyObjectsAsync(string companyId, int? scanId = null)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            int targetScanId = scanId ?? 0;
            if (targetScanId == 0)
            {
                var latest = await GetLatestScanAsync(companyId);
                if (latest == null) return new List<TallyObjectDefinition>();
                targetScanId = latest.Id;
            }

            var entities = await db.TallyObjects
                .Where(o => o.ScanId == targetScanId)
                .ToListAsync();

            return entities.Select(e =>
            {
                Enum.TryParse<SourceType>(e.SourceType, true, out var src);
                Enum.TryParse<DiscoveryConfidence>(e.Confidence, true, out var conf);
                Enum.TryParse<CustomType>(e.CustomType, true, out var custom);
                Enum.TryParse<RecognitionStatus>(e.RecognitionStatus, true, out var rec);

                return new TallyObjectDefinition
                {
                    Id = e.Name,
                    Name = e.Name,
                    DisplayName = e.DisplayName,
                    ObjectType = e.ObjectType,
                    SourceType = src,
                    Confidence = conf,
                    CustomType = custom,
                    RecognitionStatus = rec,
                    ParentObject = e.ParentObject
                };
            }).ToList();
        }

        public async Task TogglePathFavoriteAsync(string companyId, string pathString)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var existing = await db.FavoriteFieldPaths
                .FirstOrDefaultAsync(f => f.CompanyId == companyId && f.PathString == pathString);

            if (existing != null)
            {
                db.FavoriteFieldPaths.Remove(existing);
            }
            else
            {
                db.FavoriteFieldPaths.Add(new FavoriteFieldPathEntity
                {
                    CompanyId = companyId,
                    PathString = pathString
                });
            }

            await db.SaveChangesAsync();
        }

        public async Task<List<string>> GetFavoriteFieldPathsAsync(string companyId)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            return await db.FavoriteFieldPaths
                .Where(f => f.CompanyId == companyId)
                .Select(f => f.PathString)
                .ToListAsync();
        }

        public async Task ToggleFavoriteAsync(string companyId, string collectionName)

        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            var existing = await db.FavoriteCollections
                .FirstOrDefaultAsync(f => f.CompanyId == companyId && f.CollectionName == collectionName);

            if (existing != null)
            {
                db.FavoriteCollections.Remove(existing);
            }
            else
            {
                db.FavoriteCollections.Add(new FavoriteCollectionEntity
                {
                    CompanyId = companyId,
                    CollectionName = collectionName
                });
            }

            await db.SaveChangesAsync();
        }

        public async Task<List<string>> GetFavoritesAsync(string companyId)
        {
            using var db = new TallyDbContext();
            await db.Database.EnsureCreatedAsync();

            return await db.FavoriteCollections
                .Where(f => f.CompanyId == companyId)
                .Select(f => f.CollectionName)
                .ToListAsync();
        }
    }
}
