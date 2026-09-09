using System.Collections.Generic;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IFieldPathService
    {
        List<CanonicalFieldPath> GenerateCanonicalPaths(UnifiedDiscoveryModel model);
        bool ValidatePath(string pathString, UnifiedDiscoveryModel model);
    }
}
