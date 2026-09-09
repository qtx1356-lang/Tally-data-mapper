using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IPrintRenderer
    {
        Task<string> RenderPrintHtmlAsync(DocumentDefinition document, DocumentPrintSettings settings);
    }
}
