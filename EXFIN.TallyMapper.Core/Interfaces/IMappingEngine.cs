using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IMappingEngine
    {
        OutputMapping CreateMapping(string sourceEntity, string? companyId = null, string? name = null);
        MappingValidationResult ValidateMapping(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel);
        OutputMapping AddField(OutputMapping mapping, string sourcePath, string? outputName = null);
        OutputMapping RemoveField(OutputMapping mapping, string fieldId);
        OutputMapping MoveField(OutputMapping mapping, string fieldId, int newOrdinal);
        OutputMapping UpdateField(OutputMapping mapping, OutputMappingField updatedField);
        OutputMapping ApplyTransformation(OutputMapping mapping, string fieldId, TransformationType transformation, string? parameter = null);
        OutputMapping AddFilter(OutputMapping mapping, FilterRule rule, string? parentGroupId = null);
        OutputMapping RemoveFilter(OutputMapping mapping, string ruleId);
        UnifiedQueryPlan BuildQuery(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel);
        Task<MappedDataResult> PreviewAsync(OutputMapping mapping, UnifiedDiscoveryModel discoveryModel, CancellationToken cancellationToken = default);
        Task<OutputMapping> SaveMappingAsync(OutputMapping mapping, CancellationToken cancellationToken = default);
        Task<OutputMapping?> LoadMappingAsync(string id, CancellationToken cancellationToken = default);
        Task<List<OutputMapping>> ListMappingsAsync(string? companyId = null, string? searchTerm = null, CancellationToken cancellationToken = default);
        Task<bool> DeleteMappingAsync(string id, CancellationToken cancellationToken = default);
        Task<OutputMapping> DuplicateMappingAsync(string id, string? newName = null, CancellationToken cancellationToken = default);
        string ExportMappingToJson(OutputMapping mapping);
        OutputMapping ImportMappingFromJson(string json);
    }
}
