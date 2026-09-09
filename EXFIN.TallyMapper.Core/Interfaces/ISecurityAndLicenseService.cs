using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface IAuthenticationService
    {
        Task<(bool Success, string Token, User User, string ErrorMessage)> AuthenticateAsync(string username, string password, string deviceIdentifier);
        Task<bool> LogoutAsync(string sessionId);
        Task<(bool Success, string ErrorMessage)> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        Task<(bool Success, string ErrorMessage)> AdminResetPasswordAsync(string adminUserId, string targetUserId, string temporaryPassword);
        bool ValidatePasswordComplexity(string password, SecuritySettings settings);
        string HashPassword(string password, string salt);
        bool VerifyPassword(string password, string salt, string hash);
    }

    public interface ISessionManager
    {
        Task<UserSession> CreateSessionAsync(string userId, string username, string deviceIdentifier, string ipAddress);
        Task<UserSession> ValidateSessionAsync(string sessionId);
        Task TouchSessionAsync(string sessionId);
        Task TerminateSessionAsync(string sessionId);
        Task ExpireStaleSessionsAsync(int timeoutMinutes);
        Task<List<UserSession>> GetActiveSessionsAsync();
    }

    public interface IAuthorizationService
    {
        Task<bool> HasPermissionAsync(string userId, string permissionId);
        Task<bool> CheckCompanyAccessAsync(string userId, string companyId, CompanyPermissionLevel requiredLevel);
        Task<List<string>> FilterPermittedCompaniesAsync(string userId, List<string> allCompanyIds);
        Task<bool> CheckReportAccessAsync(string userId, string reportId);
        Task<List<Role>> GetRolesAsync();
        Task<List<Permission>> GetPermissionsAsync();
    }

    public interface ILicenseService
    {
        Task<License> GetCurrentLicenseAsync();
        Task<(bool Success, License License, string ErrorMessage)> ActivateLicenseAsync(string licenseKey, string deviceIdentifier, string deviceName);
        Task<(bool Success, string ErrorMessage)> DeactivateCurrentDeviceAsync();
        Task<bool> CheckFeatureEntitlementAsync(string featureKey);
        Task<bool> CheckClockTamperingAsync(DateTime currentSystemTime);
        Task<List<DeviceRegistration>> GetRegisteredDevicesAsync();
        Task<List<FeatureEntitlement>> GetFeatureEntitlementsAsync();
        Task<(bool InGrace, int DaysRemaining)> GetOfflineGracePeriodStatusAsync();
    }

    public interface ILocalLicenseVerifier
    {
        bool VerifyLicenseSignature(string payloadJson, string signature, string publicKey);
        bool ValidateExpiry(DateTime expiryDate);
    }

    public interface IRemoteLicenseVerifier
    {
        Task<(bool IsValid, string StatusMessage)> VerifyWithServerAsync(string licenseKey, string deviceFingerprint);
    }

    public interface IAuditService
    {
        Task RecordAuditAsync(string action, string objectType, string details, string userId = null, string username = null, string severity = "Info");
        Task<List<AuditLogEntry>> QueryAuditLogsAsync(DateTime? from = null, DateTime? to = null, string user = null, string action = null);
        Task<string> ExportAuditLogsAsync(string format = "csv");
        Task PurgeExpiredAuditLogsAsync(int retentionDays);
    }

    public interface IUpdateService
    {
        Task<UpdateManifest> CheckForUpdatesAsync(UpdateChannel channel);
        Task<(bool Success, string LocalFilePath, string ErrorMessage)> DownloadUpdateAsync(UpdateManifest manifest);
        bool VerifyPackageSignature(string filePath, string expectedSha256, string signature);
        Task<(bool Success, string ErrorMessage)> ApplyUpdateAsync(string verifiedPackagePath);
        Task<(bool Success, string ErrorMessage)> RollbackUpdateAsync();
    }

    public interface IBackupService
    {
        Task<BackupPackage> CreateBackupAsync(string password = null, bool includeAudit = false);
        Task<(bool IsValid, string ErrorMessage, BackupPackage Package)> ValidateBackupAsync(string backupFilePath, string password = null);
        Task<Dictionary<string, object>> PreviewBackupContentsAsync(string backupFilePath, string password = null);
        Task<(bool Success, string ErrorMessage)> RestoreBackupAsync(string backupFilePath, string password = null);
    }
}
