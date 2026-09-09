using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Repositories;
using EXFIN.TallyMapper.Tally.Services;
using Moq;
using Xunit;

namespace EXFIN.TallyMapper.Tests
{
    public class Phase5MappingTests
    {
        [Fact]
        public void CreateMapping_GeneratesValidInitialStateAndDefaultOutputNames()
        {
            var mockRepo = new Mock<IMappingRepository>();
            var mockPlanner = new Mock<IQueryPlanner>();
            var engine = new MappingEngine(mockRepo.Object, mockPlanner.Object);

            var mapping = engine.CreateMapping("Voucher", "COMP_01", "GST Sales Register");

            Assert.NotNull(mapping.Id);
            Assert.Equal("Voucher", mapping.SourceEntity);
            Assert.Equal("GST Sales Register", mapping.Name);
            Assert.Equal(MappingStatus.Draft, mapping.Status);

            engine.AddField(mapping, "Voucher.Date");
            engine.AddField(mapping, "Voucher.Party.Name");

            Assert.Equal(2, mapping.Fields.Count);
            Assert.Equal("date", mapping.Fields[0].OutputName);
            Assert.Equal("party_name", mapping.Fields[1].OutputName);
        }

        [Fact]
        public void ValidateMapping_DetectsDuplicateOutputNamesAndMissingPaths()
        {
            var mockRepo = new Mock<IMappingRepository>();
            var mockPlanner = new Mock<IQueryPlanner>();
            var engine = new MappingEngine(mockRepo.Object, mockPlanner.Object);

            var mapping = engine.CreateMapping("Voucher");
            engine.AddField(mapping, "Voucher.Date", "invoice_date");
            engine.AddField(mapping, "Voucher.Number", "invoice_date"); // Duplicate output name!
            engine.AddField(mapping, "Voucher.NonExistentField", "custom_val"); // Missing path

            var discoveryModel = new UnifiedDiscoveryModel
            {
                CompanyId = "DEFAULT_COMP",
                Collections = new List<DiscoveryCollection>
                {
                    new DiscoveryCollection
                    {
                        Name = "Voucher",
                        Fields = new List<DiscoveryField>
                        {
                            new DiscoveryField { Name = "Date" },
                            new DiscoveryField { Name = "Number" }
                        }
                    }
                },
                CanonicalPaths = new List<CanonicalFieldPath>
                {
                    new CanonicalFieldPath { PathString = "Voucher.Date" },
                    new CanonicalFieldPath { PathString = "Voucher.Number" }
                }
            };

            var valResult = engine.ValidateMapping(mapping, discoveryModel);

            Assert.False(valResult.IsValid);
            Assert.True(valResult.ErrorCount >= 2);
            Assert.Contains(valResult.Messages, m => m.Message.Contains("Duplicate output column name"));
            Assert.Contains(valResult.Messages, m => m.Message.Contains("missing or unavailable"));
        }

        [Fact]
        public void TransformationsAndFilters_EvaluateCorrectly()
        {
            var mockRepo = new Mock<IMappingRepository>();
            var mockPlanner = new Mock<IQueryPlanner>();
            var engine = new MappingEngine(mockRepo.Object, mockPlanner.Object);

            var mapping = engine.CreateMapping("Voucher");
            engine.AddField(mapping, "Voucher.Party.Name", "customer_name");
            engine.ApplyTransformation(mapping, mapping.Fields[0].Id, TransformationType.UPPER);

            engine.AddField(mapping, "Voucher.Amount", "amount");
            engine.ApplyTransformation(mapping, mapping.Fields[1].Id, TransformationType.ROUND, "2");

            // Add Filter: Amount > 1000
            engine.AddFilter(mapping, new FilterRule
            {
                FieldPath = "Voucher.Amount",
                Operator = FilterOperator.GreaterThan,
                Value = "1000"
            });

            var discoveryModel = new UnifiedDiscoveryModel
            {
                Collections = new List<DiscoveryCollection>
                {
                    new DiscoveryCollection
                    {
                        Name = "Voucher",
                        Fields = new List<DiscoveryField>
                        {
                            new DiscoveryField { Name = "Party.Name" },
                            new DiscoveryField { Name = "Amount" }
                        }
                    }
                },
                CanonicalPaths = new List<CanonicalFieldPath>
                {
                    new CanonicalFieldPath { PathString = "Voucher.Party.Name" },
                    new CanonicalFieldPath { PathString = "Voucher.Amount" }
                }
            };

            var dataResult = engine.PreviewAsync(mapping, discoveryModel).GetAwaiter().GetResult();

            Assert.NotNull(dataResult);
            Assert.NotEmpty(dataResult.Rows);
            foreach (var row in dataResult.Rows)
            {
                var nameVal = row["customer_name"]?.ToString();
                Assert.NotNull(nameVal);
                Assert.Equal(nameVal.ToUpperInvariant(), nameVal); // Verify UPPER transformation

                var amtVal = Convert.ToDecimal(row["amount"]);
                Assert.True(amtVal > 1000m); // Verify Filter
            }
        }

        [Fact]
        public void Serialization_ExportsAndImportsPortableJson()
        {
            var mockRepo = new Mock<IMappingRepository>();
            var mockPlanner = new Mock<IQueryPlanner>();
            var engine = new MappingEngine(mockRepo.Object, mockPlanner.Object);

            var original = engine.CreateMapping("Voucher", null, "GST Sales Template");
            engine.AddField(original, "Voucher.Date", "invoice_date");
            engine.AddField(original, "Voucher.Party.GSTIN", "party_gstin");

            var json = engine.ExportMappingToJson(original);
            Assert.Contains("GST Sales Template", json);
            Assert.Contains("invoice_date", json);

            var restored = engine.ImportMappingFromJson(json);
            Assert.Equal(original.Name, restored.Name);
            Assert.Equal(original.Fields.Count, restored.Fields.Count);
            Assert.Equal("invoice_date", restored.Fields[0].OutputName);
        }

        [Fact]
        public async Task PreviewAsync_RespectsCancellation()
        {
            var mockRepo = new Mock<IMappingRepository>();
            var mockPlanner = new Mock<IQueryPlanner>();
            var engine = new MappingEngine(mockRepo.Object, mockPlanner.Object);

            var mapping = engine.CreateMapping("Voucher");
            engine.AddField(mapping, "Voucher.Date");

            var discoveryModel = new UnifiedDiscoveryModel
            {
                Collections = new List<DiscoveryCollection>
                {
                    new DiscoveryCollection { Name = "Voucher" }
                }
            };

            using var cts = new CancellationTokenSource();
            cts.Cancel();

            await Assert.ThrowsAsync<OperationCanceledException>(async () =>
            {
                await engine.PreviewAsync(mapping, discoveryModel, cts.Token);
            });
        }
    }
}
