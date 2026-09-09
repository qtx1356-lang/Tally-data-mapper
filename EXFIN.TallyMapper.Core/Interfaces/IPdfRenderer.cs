using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IPdfRenderer
    {
        Task<byte[]> RenderPdfAsync(DocumentDefinition document, DocumentPrintSettings settings);
        Task<bool> ValidatePdfStructureAsync(byte[] pdfBytes);
    }
}
