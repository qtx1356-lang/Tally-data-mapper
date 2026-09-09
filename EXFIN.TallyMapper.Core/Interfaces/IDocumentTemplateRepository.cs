using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IDocumentTemplateRepository
    {
        Task<List<DocumentTemplate>> GetTemplatesAsync();
        Task<DocumentTemplate> GetTemplateByIdAsync(string id);
        Task<DocumentTemplate> SaveTemplateAsync(DocumentTemplate template);
        Task<bool> DeleteTemplateAsync(string id);
    }
}
