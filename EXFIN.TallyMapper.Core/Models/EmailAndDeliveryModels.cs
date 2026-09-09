using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public class EmailConfiguration
    {
        public string SmtpHost { get; set; } = "smtp.company.com";
        public int Port { get; set; } = 587;
        public bool UseSsl { get; set; } = true;
        public string Username { get; set; } = "reports@company.com";
        public string EncryptedPasswordRef { get; set; } = "SEC_REF_881023"; // Masked password ref
        public string SenderEmail { get; set; } = "reports@company.com";
        public string SenderName { get; set; } = "EXFIN Automated Financial Delivery";
        public int MaxAttachmentSizeMb { get; set; } = 10;
        public bool LocalOnlyMode { get; set; } = false;
    }

    public class EmailAttachment
    {
        public string FileName { get; set; }
        public string ContentType { get; set; } = "application/pdf";
        public byte[] Data { get; set; }
        public long SizeBytes { get; set; }
    }

    public class EmailMessage
    {
        public List<string> To { get; set; } = new List<string>();
        public List<string> Cc { get; set; } = new List<string>();
        public List<string> Bcc { get; set; } = new List<string>();
        public string Subject { get; set; }
        public string BodyHtml { get; set; }
        public string BodyText { get; set; }
        public List<EmailAttachment> Attachments { get; set; } = new List<EmailAttachment>();
    }

    public class DeliveryResult
    {
        public bool Success { get; set; }
        public string MessageId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Sent"; // Sent, Failed, Cancelled
        public string ErrorSummary { get; set; }
        public int DurationMs { get; set; }
        public bool IsTransientFailure { get; set; }
    }

    public class EmailTemplate
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; } // e.g. "Default Success", "Default Warning", "Default Failure"
        public string Subject { get; set; } = "{company} — {report} — {date}";
        public string Body { get; set; } = "Dear Management,\n\nAttached is the automated report for {company}.\nPeriod: {period}\nRecords Processed: {records}\nStatus: {status}\n\nRegards,\nEXFIN Tally Data Engine";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class DeliveryProfile
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Name { get; set; }
        public List<string> Recipients { get; set; } = new List<string>();
        public string EmailTemplateId { get; set; }
        public string Provider { get; set; } = "SMTP";
        public List<string> Attachments { get; set; } = new List<string> { "PDF", "Excel" };
        public string DeliverCondition { get; set; } = "On Success"; // Never, On Success, On Warning, On Failure, Always
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class DeliveryHistory
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string JobExecutionId { get; set; }
        public string DeliveryProfileId { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Sent"; // Pending, Sending, Sent, Failed, Cancelled
        public int RecipientsCount { get; set; }
        public int AttachmentCount { get; set; }
        public string ErrorMessage { get; set; }
    }
}
