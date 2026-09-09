using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IEntityRecognitionService
    {
        RecognitionStatus ClassifyEntity(string entityName, out string canonicalType);
        CollectionCategory InferCategory(string collectionName, string? objectType = null);
    }
}
