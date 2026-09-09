using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum CustomerStatus
    {
        Active,
        Suspended,
        PendingActivation,
        Archived
    }

    public enum CentralLicenseStatus
    {
        Active,
        ExpiringSoon,
        Expired,
        Suspended,
        Revoked
    }

    public enum CentralDeviceStatus
    {
        Active,
        Deactivated,
        Stale,
        Blacklisted
    }

    public enum ReleaseChannel
    {
        Stable,
        Beta,
        Developer
    }

    public enum InstallationHealthStatus
    {
        Healthy,
        Warning,
        Offline,
        Error
    }

    public enum SupportTicketStatus
    {
        Open,
        InProgress,
        WaitingOnCustomer,
        Resolved,
        Closed
    }

    public enum SupportTicketPriority
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum AdminRoleType
    {
        SuperAdministrator,
        LicenseAdministrator,
        SupportAdministrator,
        ReleaseAdministrator,
        ReadOnlyAdministrator
    }

    public enum SubscriptionStatus
    {
        Active,
        PastDue,
        Suspended,
        Canceled
    }

    public class Customer
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public CustomerStatus Status { get; set; } = CustomerStatus.Active;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public List<Organization> Organizations { get; set; } = new List<Organization>();
    }

    public class Organization
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CentralLicense
    {
        public string Id { get; set; } = string.Empty;
        public string LicenseKeyId { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string OrganizationId { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public string EditionId { get; set; } = string.Empty;
        public CentralLicenseStatus Status { get; set; } = CentralLicenseStatus.Active;
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime StartsAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddYears(1);
        public int MaxDevices { get; set; } = 3;
        public List<string> EntitledFeatures { get; set; } = new List<string>();
        public string DigitalSignature { get; set; } = string.Empty;
        public string PublicKeyFingerprint { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CentralDevice
    {
        public string Id { get; set; } = string.Empty;
        public string LicenseId { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public string Platform { get; set; } = "Windows 11 x64";
        public string ApplicationVersion { get; set; } = "12.0.0";
        public DateTime FirstSeen { get; set; } = DateTime.UtcNow;
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;
        public CentralDeviceStatus Status { get; set; } = CentralDeviceStatus.Active;
        public string FriendlyName { get; set; } = "Office Workstation";
    }

    public class Product
    {
        public string Id { get; set; } = "PROD_TALLY_MAPPER";
        public string Name { get; set; } = "EXFIN Tally Data Mapper";
        public string VersionPolicy { get; set; } = "SemVer-2.0";
        public string Status { get; set; } = "Active";
    }

    public class ProductEdition
    {
        public string Id { get; set; } = string.Empty;
        public string ProductId { get; set; } = "PROD_TALLY_MAPPER";
        public string Name { get; set; } = string.Empty;
        public int MaxDevices { get; set; } = 1;
        public List<string> DefaultFeatureIds { get; set; } = new List<string>();
        public decimal PriceYearlyUsd { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class Feature
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
    }

    public class Release
    {
        public string Version { get; set; } = string.Empty;
        public ReleaseChannel Channel { get; set; } = ReleaseChannel.Stable;
        public DateTime ReleaseDate { get; set; } = DateTime.UtcNow;
        public string MinimumVersion { get; set; } = "1.0.0";
        public string DownloadReference { get; set; } = string.Empty;
        public string ReleaseNotes { get; set; } = string.Empty;
        public string PackageSha256 { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
        public int StagedRolloutPercent { get; set; } = 100;
        public bool IsCriticalSecurityUpdate { get; set; } = false;
        public bool IsPublished { get; set; } = true;
    }

    public class InstallationHealthRecord
    {
        public string Id { get; set; } = string.Empty;
        public string LicenseId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string DeviceFingerprint { get; set; } = string.Empty;
        public string ApplicationVersion { get; set; } = "12.0.0";
        public string OsVersion { get; set; } = "Windows 11 Pro 23H2";
        public string TallyVersion { get; set; } = "TallyPrime 4.1";
        public string ConnectionStatus { get; set; } = "Connected (Read-Only)";
        public DateTime? LastSuccessfulReportExecution { get; set; }
        public string LastErrorCategory { get; set; } = "None";
        public InstallationHealthStatus Status { get; set; } = InstallationHealthStatus.Healthy;
        public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
        public double AverageReportLatencyMs { get; set; } = 145.0;
    }

    public class SupportTicket
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;
        public SupportTicketPriority Priority { get; set; } = SupportTicketPriority.Medium;
        public bool HasDiagnosticsAttached { get; set; } = false;
        public string SanitizedDiagnosticsSummary { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Subscription
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string LicenseId { get; set; } = string.Empty;
        public string Plan { get; set; } = "Enterprise Annual";
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime RenewalDate { get; set; } = DateTime.UtcNow.AddYears(1);
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
        public string BillingProviderReference { get; set; } = "STRIPE_SUB_99812";
    }

    public class AdminUser
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public AdminRoleType Role { get; set; } = AdminRoleType.LicenseAdministrator;
        public bool IsMfaEnabled { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
    }

    public class CentralAuditRecord
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string AdminUserId { get; set; } = string.Empty;
        public string AdminUsername { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;
        public string TargetId { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
    }
}
