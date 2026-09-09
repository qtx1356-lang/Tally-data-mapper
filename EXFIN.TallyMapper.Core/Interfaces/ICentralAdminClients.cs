using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface ILicenseApiClient
    {
        Task<(bool Success, CentralLicense License, string ErrorMessage)> ValidateLicenseAsync(string licenseKeyId, string deviceFingerprint);
        Task<(bool Success, CentralLicense License, string ErrorMessage)> RefreshLicenseEntitlementAsync(string licenseId);
        Task<(bool Success, string OfflineLicenseFileContent, string ErrorMessage)> GenerateOfflineLicensePackageAsync(string licenseId);
        Task<bool> IsServerReachableAsync();
    }

    public interface IDeviceRegistrationClient
    {
        Task<(bool Success, CentralDevice Device, string ErrorMessage)> RegisterDeviceAsync(string licenseKeyId, string deviceFingerprint, string platform, string appVersion, string friendlyName);
        Task<(bool Success, string ErrorMessage)> DeactivateDeviceAsync(string licenseId, string deviceFingerprint);
        Task<List<CentralDevice>> GetLicensedDevicesAsync(string licenseId);
    }

    public interface IUpdateManifestClient
    {
        Task<Release> CheckForUpdatesAsync(string channel, string currentVersion, string licenseId);
        Task<bool> VerifyUpdatePackageSignatureAsync(string packagePath, string expectedSha256, string signature, string publicKey);
    }

    public interface IHealthTelemetryClient
    {
        Task<bool> SendHealthHeartbeatAsync(InstallationHealthRecord telemetryPayload);
        Task<bool> SendSanitizedDiagnosticsAsync(string licenseId, string errorCategory, string sanitizedPayloadJson);
        bool IsTelemetryConsentGranted();
        void SetTelemetryConsent(bool isEnabled);
    }

    public interface ICustomerConfigurationClient
    {
        Task<Customer> GetCustomerDetailsAsync(string customerId);
        Task<List<Organization>> GetCustomerOrganizationsAsync(string customerId);
        Task<(bool Success, string TicketId, string ErrorMessage)> SubmitSupportTicketAsync(string customerId, string subject, string description, SupportTicketPriority priority, string sanitizedDiagnosticsJson = null);
    }

    public interface IBillingProvider
    {
        string ProviderName { get; }
        Task<Subscription> GetSubscriptionStatusAsync(string customerId);
        Task<(bool Success, string TransactionId, string ErrorMessage)> ProcessRenewalAsync(string subscriptionId, decimal amount);
        Task<bool> HandlePaymentWebhookAsync(string webhookPayload, string signature);
    }
}
