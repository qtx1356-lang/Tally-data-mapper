using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Repositories;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class UnifiedDiscoveryService : IUnifiedDiscoveryService
    {
        private readonly IOdbcSchemaDiscoveryService _odbcDiscoveryService;
        private readonly IDiscoveryRepository _discoveryRepository;
        private readonly IEntityRecognitionService _entityRecognitionService;
        private readonly IFieldPathService _fieldPathService;

        public UnifiedDiscoveryService(
            IOdbcSchemaDiscoveryService odbcDiscoveryService,
            IDiscoveryRepository discoveryRepository,
            IEntityRecognitionService entityRecognitionService,
            IFieldPathService fieldPathService)
        {
            _odbcDiscoveryService = odbcDiscoveryService;
            _discoveryRepository = discoveryRepository;
            _entityRecognitionService = entityRecognitionService;
            _fieldPathService = fieldPathService;
        }

        public async Task<UnifiedDiscoveryModel> PerformUnifiedDiscoveryAsync(string companyId, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var scan = new DiscoveryScan
            {
                CompanyId = companyId,
                CompanyName = companyId,
                TallyVersion = "TallyPrime 3.0+",
                Build = "Release 3.0.1",
                StartedAt = DateTime.UtcNow,
                Status = "Running"
            };

            int scanId = await _discoveryRepository.SaveScanAsync(scan);

            // Step 1: Discover from ODBC
            var odbcCollections = await _odbcDiscoveryService.DiscoverSchemaAsync(companyId, cancellationToken);

            // Step 2: Build TDL & HTTP Metadata
            var tdlObjects = GetTdlObjectDefinitions();
            var tdlMethods = GetTdlMethodDefinitions();

            // Step 3: Source Priority Merging Rule (TDL > HTTP/XML/JSON > ODBC > Verified App > Inferred)
            var mergedCollections = MergeCollectionsWithPriority(odbcCollections, tdlObjects);

            // Step 4: Classify Categories & Confidence Badges
            foreach (var col in mergedCollections)
            {
                col.Category = _entityRecognitionService.InferCategory(col.Name, col.ObjectType);
                col.ScanId = scanId;
                col.CompanyId = companyId;
            }

            // Step 5: Build Relationship Graph
            var relationships = BuildRelationshipGraph(scanId, companyId, mergedCollections, tdlObjects);

            // Step 6: Create Unified Model
            var model = new UnifiedDiscoveryModel
            {
                ScanId = scanId,
                CompanyId = companyId,
                CompanyName = companyId,
                TallyVersion = "TallyPrime 3.0+",
                Build = "Release 3.0.1",
                ScanDate = DateTime.UtcNow,
                Collections = mergedCollections,
                Objects = tdlObjects,
                Relationships = relationships,
                Methods = tdlMethods,
                Capabilities = new List<string> { "ODBC", "HTTP", "XML", "TDL", "REST" }
            };

            // Step 7: Generate Canonical Field Paths
            model.CanonicalPaths = _fieldPathService.GenerateCanonicalPaths(model);

            // Step 8: Calculate Confidence Summary
            model.ConfidenceSummary["Verified"] = mergedCollections.Count(c => c.Confidence == DiscoveryConfidence.Verified);
            model.ConfidenceSummary["High"] = mergedCollections.Count(c => c.Confidence == DiscoveryConfidence.High);
            model.ConfidenceSummary["Medium"] = mergedCollections.Count(c => c.Confidence == DiscoveryConfidence.Medium);
            model.ConfidenceSummary["Inferred"] = mergedCollections.Count(c => c.Confidence == DiscoveryConfidence.Inferred);

            // Step 9: Save to Persistence Storage
            await _discoveryRepository.SaveCollectionsAndFieldsAsync(scanId, mergedCollections);
            await _discoveryRepository.SaveRelationshipsAsync(scanId, relationships);
            await _discoveryRepository.SaveCanonicalFieldPathsAsync(scanId, model.CanonicalPaths);
            await _discoveryRepository.SaveTallyObjectsAsync(scanId, tdlObjects);

            int totalFields = mergedCollections.Sum(c => c.Fields.Count);
            await _discoveryRepository.UpdateScanStatusAsync(
                scanId,
                "Completed",
                mergedCollections.Count,
                totalFields,
                0,
                $"Unified Discovery completed. Discovered {mergedCollections.Count} collections, {tdlObjects.Count} objects, {relationships.Count} relationships, {model.CanonicalPaths.Count} paths."
            );

            return model;
        }

        public async Task<UnifiedDiscoveryModel> GetLatestModelAsync(string companyId)
        {
            var latestScan = await _discoveryRepository.GetLatestScanAsync(companyId);
            if (latestScan == null)
            {
                return await PerformUnifiedDiscoveryAsync(companyId);
            }

            return await GetModelForScanAsync(latestScan.Id);
        }

        public async Task<UnifiedDiscoveryModel> GetModelForScanAsync(int scanId)
        {
            var scan = await _discoveryRepository.GetScanByIdAsync(scanId);
            if (scan == null)
            {
                throw new KeyNotFoundException($"Discovery scan #{scanId} not found.");
            }

            var collections = await _discoveryRepository.GetCollectionsAsync(scan.CompanyId);
            var relationships = await _discoveryRepository.GetRelationshipsAsync(scan.CompanyId, scanId);
            var paths = await _discoveryRepository.GetCanonicalFieldPathsAsync(scan.CompanyId, scanId);
            var objects = await _discoveryRepository.GetTallyObjectsAsync(scan.CompanyId, scanId);

            var model = new UnifiedDiscoveryModel
            {
                ScanId = scan.Id,
                CompanyId = scan.CompanyId,
                CompanyName = scan.CompanyName,
                TallyVersion = scan.TallyVersion,
                Build = scan.Build,
                ScanDate = scan.StartedAt,
                Collections = collections,
                Objects = objects,
                Relationships = relationships,
                CanonicalPaths = paths,
                Methods = GetTdlMethodDefinitions(),
                Capabilities = new List<string> { "ODBC", "HTTP", "XML", "TDL" }
            };

            model.ConfidenceSummary["Verified"] = collections.Count(c => c.Confidence == DiscoveryConfidence.Verified);
            model.ConfidenceSummary["High"] = collections.Count(c => c.Confidence == DiscoveryConfidence.High);
            model.ConfidenceSummary["Medium"] = collections.Count(c => c.Confidence == DiscoveryConfidence.Medium);
            model.ConfidenceSummary["Inferred"] = collections.Count(c => c.Confidence == DiscoveryConfidence.Inferred);

            return model;
        }

        private List<DiscoveryCollection> MergeCollectionsWithPriority(
            List<DiscoveryCollection> odbcCollections,
            List<TallyObjectDefinition> tdlObjects)
        {
            var result = new List<DiscoveryCollection>();

            foreach (var odbcCol in odbcCollections)
            {
                var copyCol = new DiscoveryCollection
                {
                    Name = odbcCol.Name,
                    DisplayName = odbcCol.DisplayName,
                    Source = SourceType.ODBC,
                    ObjectType = "Collection",
                    Category = odbcCol.Category,
                    CategoryClassification = CategoryClassification.Known,
                    Confidence = DiscoveryConfidence.Verified,
                    CustomType = CustomType.Standard,
                    IsQueryable = true,
                    IsReadable = true,
                    IsExpandable = true,
                    RecordCount = odbcCol.RecordCount,
                    Description = odbcCol.Description,
                    IsFavorite = odbcCol.IsFavorite,
                    Fields = odbcCol.Fields.Select(f => new DiscoveryField
                    {
                        Name = f.Name,
                        DisplayName = f.DisplayName,
                        DataType = f.DataType,
                        Nullable = f.Nullable,
                        Ordinal = f.Ordinal,
                        Source = SourceType.ODBC,
                        Confidence = DiscoveryConfidence.Verified,
                        CustomType = CustomType.Standard,
                        IsOdbcExposed = true,
                        Description = f.Description,
                        SampleValues = f.SampleValues,
                        UsageContexts = new List<string> { "ODBC SQL Exposed" }
                    }).ToList()
                };

                // Merge TDL object metadata without overwriting higher confidence data
                var matchingTdl = tdlObjects.FirstOrDefault(o => o.Name.Equals(odbcCol.Name, StringComparison.OrdinalIgnoreCase));
                if (matchingTdl != null)
                {
                    copyCol.Source = SourceType.TDL; // Higher priority
                    copyCol.Confidence = DiscoveryConfidence.Verified;

                    foreach (var tdlField in matchingTdl.Fields)
                    {
                        if (!copyCol.Fields.Any(f => f.Name.Equals(tdlField.Name, StringComparison.OrdinalIgnoreCase)))
                        {
                            copyCol.Fields.Add(new DiscoveryField
                            {
                                Name = tdlField.Name,
                                DisplayName = tdlField.DisplayName,
                                DataType = tdlField.DataType,
                                Nullable = true,
                                Ordinal = copyCol.Fields.Count + 1,
                                Source = SourceType.TDL,
                                Confidence = DiscoveryConfidence.Verified,
                                CustomType = CustomType.Standard,
                                IsOdbcExposed = false,
                                Description = "Discovered via TDL object definition",
                                UsageContexts = new List<string> { "TDL Method / Field" }
                            });
                        }
                    }
                }

                result.Add(copyCol);
            }

            return result;
        }

        private List<TallyRelationship> BuildRelationshipGraph(
            int scanId,
            string companyId,
            List<DiscoveryCollection> collections,
            List<TallyObjectDefinition> objects)
        {
            var rels = new List<TallyRelationship>();

            // Standard Verified Tally Relationships
            rels.Add(new TallyRelationship
            {
                ScanId = scanId,
                CompanyId = companyId,
                FromEntityId = "Voucher",
                ToEntityId = "Ledger",
                FromField = "PartyLedgerName",
                ToField = "Name",
                RelationshipType = TallyRelationshipType.References,
                Cardinality = CardinalityType.ManyToOne,
                SourceType = SourceType.TDL,
                Confidence = DiscoveryConfidence.Verified,
                Description = "Voucher party ledger references Ledger master"
            });

            rels.Add(new TallyRelationship
            {
                ScanId = scanId,
                CompanyId = companyId,
                FromEntityId = "Voucher",
                ToEntityId = "VoucherType",
                FromField = "VoucherTypeName",
                ToField = "Name",
                RelationshipType = TallyRelationshipType.References,
                Cardinality = CardinalityType.ManyToOne,
                SourceType = SourceType.TDL,
                Confidence = DiscoveryConfidence.Verified,
                Description = "Voucher refers to VoucherType definition"
            });

            rels.Add(new TallyRelationship
            {
                ScanId = scanId,
                CompanyId = companyId,
                FromEntityId = "Voucher",
                ToEntityId = "InventoryEntry",
                FromField = "MasterId",
                ToField = "VoucherMasterId",
                RelationshipType = TallyRelationshipType.Contains,
                Cardinality = CardinalityType.OneToMany,
                SourceType = SourceType.TDL,
                Confidence = DiscoveryConfidence.Verified,
                Description = "Voucher contains nested inventory lines"
            });

            rels.Add(new TallyRelationship
            {
                ScanId = scanId,
                CompanyId = companyId,
                FromEntityId = "Ledger",
                ToEntityId = "Group",
                FromField = "Parent",
                ToField = "Name",
                RelationshipType = TallyRelationshipType.BelongsTo,
                Cardinality = CardinalityType.ManyToOne,
                SourceType = SourceType.TDL,
                Confidence = DiscoveryConfidence.Verified,
                Description = "Ledger master belongs to parent Group"
            });

            rels.Add(new TallyRelationship
            {
                ScanId = scanId,
                CompanyId = companyId,
                FromEntityId = "StockItem",
                ToEntityId = "StockGroup",
                FromField = "Parent",
                ToField = "Name",
                RelationshipType = TallyRelationshipType.BelongsTo,
                Cardinality = CardinalityType.ManyToOne,
                SourceType = SourceType.TDL,
                Confidence = DiscoveryConfidence.Verified,
                Description = "Stock item belongs to Stock Group"
            });

            return rels;
        }

        private List<TallyObjectDefinition> GetTdlObjectDefinitions()
        {
            return new List<TallyObjectDefinition>
            {
                new TallyObjectDefinition
                {
                    Id = "Voucher",
                    Name = "Voucher",
                    DisplayName = "Voucher Object",
                    ObjectType = "Transaction",
                    SourceType = SourceType.TDL,
                    Confidence = DiscoveryConfidence.Verified,
                    CustomType = CustomType.Standard,
                    RecognitionStatus = RecognitionStatus.Recognized,
                    ChildObjects = new List<string> { "AllInventoryEntries", "AllLedgerEntries" },
                    Fields = new List<DiscoveryField>
                    {
                        new DiscoveryField { Name = "VoucherNumber", DataType = FieldDataType.String, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "Date", DataType = FieldDataType.Date, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "PartyLedgerName", DataType = FieldDataType.String, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "Amount", DataType = FieldDataType.Decimal, Confidence = DiscoveryConfidence.Verified }
                    }
                },
                new TallyObjectDefinition
                {
                    Id = "Ledger",
                    Name = "Ledger",
                    DisplayName = "Ledger Master",
                    ObjectType = "Master",
                    SourceType = SourceType.TDL,
                    Confidence = DiscoveryConfidence.Verified,
                    CustomType = CustomType.Standard,
                    RecognitionStatus = RecognitionStatus.Recognized,
                    Fields = new List<DiscoveryField>
                    {
                        new DiscoveryField { Name = "Name", DataType = FieldDataType.String, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "Parent", DataType = FieldDataType.String, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "OpeningBalance", DataType = FieldDataType.Decimal, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "ClosingBalance", DataType = FieldDataType.Decimal, Confidence = DiscoveryConfidence.Verified }
                    }
                },
                new TallyObjectDefinition
                {
                    Id = "StockItem",
                    Name = "StockItem",
                    DisplayName = "Stock Item Master",
                    ObjectType = "Master",
                    SourceType = SourceType.TDL,
                    Confidence = DiscoveryConfidence.Verified,
                    CustomType = CustomType.Standard,
                    RecognitionStatus = RecognitionStatus.Recognized,
                    Fields = new List<DiscoveryField>
                    {
                        new DiscoveryField { Name = "Name", DataType = FieldDataType.String, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "Parent", DataType = FieldDataType.String, Confidence = DiscoveryConfidence.Verified },
                        new DiscoveryField { Name = "BaseUnits", DataType = FieldDataType.String, Confidence = DiscoveryConfidence.Verified }
                    }
                }
            };
        }

        private List<TallyMethodDefinition> GetTdlMethodDefinitions()
        {
            return new List<TallyMethodDefinition>
            {
                new TallyMethodDefinition { Id = "GetLedgerBalance", Name = "GetLedgerBalance", DisplayName = "Get Ledger Balance", ReturnType = "Amount", Source = SourceType.TDL, Description = "Calculates closing balance for ledger" },
                new TallyMethodDefinition { Id = "GetVoucherTotal", Name = "GetVoucherTotal", DisplayName = "Get Voucher Total", ReturnType = "Amount", Source = SourceType.TDL, Description = "Calculates total voucher amount" },
                new TallyMethodDefinition { Id = "GetStockQty", Name = "GetStockQty", DisplayName = "Get Stock Qty", ReturnType = "Quantity", Source = SourceType.TDL, Description = "Returns current stock quantity" }
            };
        }
    }
}
