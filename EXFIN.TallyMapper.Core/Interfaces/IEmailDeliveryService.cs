using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IEmailProvider
    {
        string ProviderName { get; }
        Task<DeliveryResult> SendEmailAsync(EmailConfiguration config, EmailMessage message);
        Task<bool> TestConnectionAsync(EmailConfiguration config);
    }

    public interface IEmailDeliveryService
    {
        Task<DeliveryResult> DeliverReportAsync(DeliveryProfile profile, EmailMessage message, List<EmailAttachment> attachments);
        Task<DeliveryResult> SendTestEmailAsync(EmailConfiguration config, string recipientEmail);
        Task<List<DeliveryHistory>> GetDeliveryHistoryAsync();
        Task<List<EmailTemplate>> GetTemplatesAsync();
        Task<EmailTemplate> SaveTemplateAsync(EmailTemplate template);
    }
}
