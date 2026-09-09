using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IMetadataDiffService
    {
        ScanDiffResult CompareScans(UnifiedDiscoveryModel scanA, UnifiedDiscoveryModel scanB);
    }
}
