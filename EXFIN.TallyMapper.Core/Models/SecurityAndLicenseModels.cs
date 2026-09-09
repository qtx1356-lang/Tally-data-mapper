using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Core.Models
{
    public enum UserStatus
    {
        Active,
        Disabled,
        LockedOut,
        PendingActivation
    }

    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string RoleId { get; set; } = "ROLE_VIEWER";
        public UserStatus Status { get; set; } = UserStatus.Active;
        public string PasswordHash { get; set; } = string.Empty;
        public string PasswordSalt { get; set; } = string.Empty;
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutUntil { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public DateTime? LastActiveAt { get; set; }
    }

    public enum SessionStatus
    {
        Active,
        Expired,
        TerminatedByAdmin,
        LoggedOut
    }

    public class UserSession
    {
        public string SessionId { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime LoginTime { get; set; } = DateTime.UtcNow;
        public DateTime? LogoutTime { get; set; }
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public string DeviceIdentifier { get; set; } = string.Empty;
        public string IpAddress { get; set; } = "127.0.0.1";
        public SessionStatus Status { get; set; } = SessionStatus.Active;
        public DateTime ExpiryTime { get; set; } = DateTime.UtcNow.AddHours(8);
    }

    public class Role
    {
        public string RoleId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsSystemRole { get; set; } = true;
        public List<string> Permissions { get; set; } = new List<string>();
    }

    public class Permission
    {
        public string PermissionId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public enum CompanyPermissionLevel
    {
        ReadOnly,
        Standard,
        Manager,
        FullControl
    }

    public class UserCompanyAccess
    {
        public string UserId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public CompanyPermissionLevel PermissionLevel { get; set; } = CompanyPermissionLevel.ReadOnly;
    }

    public class ReportAccessPolicy
    {
        public string ReportId { get; set; } = string.Empty;
        public List<string> AllowedRoles { get; set; } = new List<string>();
        public List<string> AllowedUsers { get; set; } = new List<string>();
        public List<string> AllowedCompanies { get; set; } = new List<string>();
    }

    public enum LicenseType
    {
        Trial,
        Monthly,
        Annual,
        Perpetual,
        Enterprise
    }

    public enum LicenseStatus
    {
        Unlicensed,
        Trial,
        Active,
        Expired,
        Suspended,
        Revoked,
        GracePeriod
    }

    public enum ProductEdition
    {
        Free,
        Professional,
        Business,
        Enterprise
    }

    public class License
    {
        public string LicenseId { get; set; } = string.Empty;
        public string LicenseKey { get; set; } = string.Empty;
        public string Product { get; set; } = "EXFIN Tally Data Mapper";
        public ProductEdition Edition { get; set; } = ProductEdition.Professional;
        public LicenseType Type { get; set; } = LicenseType.Annual;
        public string Customer { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddYears(1);
        public LicenseStatus Status { get; set; } = LicenseStatus.Active;
        public int MaxDevices { get; set; } = 3;
        public List<string> Features { get; set; } = new List<string>();
        public string Signature { get; set; } = string.Empty;
        public DateTime LastVerifiedAt { get; set; } = DateTime.UtcNow;
        public int OfflineGraceDaysRemaining { get; set; } = 7;
        public DateTime? LastSystemClockObserved { get; set; }
    }

    public class DeviceRegistration
    {
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string Platform { get; set; } = "Windows 11 x64";
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }

    public class FeatureEntitlement
    {
        public string FeatureKey { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ProductEdition RequiredEdition { get; set; } = ProductEdition.Professional;
        public bool IsEntitled { get; set; } = true;
    }

    public class SecuritySettings
    {
        public int SessionTimeoutMinutes { get; set; } = 60;
        public int MaxFailedAttempts { get; set; } = 5;
        public int LockoutDurationMinutes { get; set; } = 15;
        public int MinPasswordLength { get; set; } = 8;
        public bool RequireSpecialChar { get; set; } = true;
        public bool RequireDigit { get; set; } = true;
        public int AuditRetentionDays { get; set; } = 365;
        public bool DiagnosticLoggingEnabled { get; set; } = false;
        public string AllowedExportFormats { get; set; } = "CSV,JSON,XLSX,PDF";
        public string DefaultReportDirectory { get; set; } = @"%AppData%\EXFIN\TallyMapper\Reports";
        public string DefaultArchiveDirectory { get; set; } = @"%AppData%\EXFIN\TallyMapper\Archives";
        public string UpdateChannel { get; set; } = "Stable";
    }

    public enum UpdateChannel
    {
        Stable,
        Beta,
        Developer
    }

    public class UpdateManifest
    {
        public string Version { get; set; } = "12.0.0";
        public DateTime ReleaseDate { get; set; } = DateTime.UtcNow;
        public string DownloadUrl { get; set; } = "https://updates.exfin.com/tallymapper/v12.0.0/EXFIN_TallyMapper_Setup_x64.exe";
        public string MinSupportedVersion { get; set; } = "10.0.0";
        public string ReleaseNotes { get; set; } = string.Empty;
        public string PackageSha256 { get; set; } = string.Empty;
        public string Signature { get; set; } = string.Empty;
        public UpdateChannel Channel { get; set; } = UpdateChannel.Stable;
    }

    public class BackupPackage
    {
        public string BackupId { get; set; } = Guid.NewGuid().ToString();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Version { get; set; } = "1.0";
        public string AppVersion { get; set; } = "12.0.0";
        public bool IsEncrypted { get; set; } = false;
        public string Checksum { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = "Administrator";
        public Dictionary<string, int> ItemCounts { get; set; } = new Dictionary<string, int>();
    }

    public class EnterprisePolicy
    {
        public string OrganizationName { get; set; } = "EXFIN Enterprise";
        public string PolicyVersion { get; set; } = "2026.1";
        public bool EnforceStrictTallyReadOnly { get; set; } = true;
        public bool AllowExternalAiSharing { get; set; } = false;
        public bool RequirePasswordComplexity { get; set; } = true;
        public string EnforcedAuditRetention { get; set; } = "1 Year";
    }
}
