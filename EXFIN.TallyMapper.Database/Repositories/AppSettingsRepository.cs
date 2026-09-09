using System;
using System.Linq;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Core.Utilities;
using EXFIN.TallyMapper.Database.Data;
using EXFIN.TallyMapper.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace EXFIN.TallyMapper.Database.Repositories
{
    public class AppSettingsRepository : IAppSettingsService
    {
        private AppSettings _cachedSettings;

        public AppSettingsRepository()
        {
            _cachedSettings = new AppSettings
            {
                DefaultExportDirectory = PathUtils.AppDataFolder
            };
        }

        public AppSettings GetSettings()
        {
            return _cachedSettings;
        }

        public async Task<AppSettings> LoadSettingsAsync()
        {
            try
            {
                using var db = new TallyDbContext();
                await db.Database.EnsureCreatedAsync();

                var dbSettings = await db.Settings.ToListAsync();
                if (dbSettings.Any())
                {
                    _cachedSettings.TallyHost = GetValue(dbSettings, "TallyHost", "localhost");
                    _cachedSettings.TallyPort = int.TryParse(GetValue(dbSettings, "TallyPort", "9000"), out var p) ? p : 9000;
                    _cachedSettings.ConnectionTimeoutSeconds = int.TryParse(GetValue(dbSettings, "ConnectionTimeoutSeconds", "10"), out var t) ? t : 10;
                    _cachedSettings.PreviewRecordLimit = int.TryParse(GetValue(dbSettings, "PreviewRecordLimit", "100"), out var l) ? l : 100;
                    _cachedSettings.DefaultExportDirectory = GetValue(dbSettings, "DefaultExportDirectory", PathUtils.AppDataFolder);
                    _cachedSettings.LogLevel = GetValue(dbSettings, "LogLevel", "Information");
                    _cachedSettings.Theme = GetValue(dbSettings, "Theme", "Dark");
                    _cachedSettings.AutoConnect = !bool.TryParse(GetValue(dbSettings, "AutoConnect", "true"), out var ac) || ac;
                    _cachedSettings.AutoDetectCompany = !bool.TryParse(GetValue(dbSettings, "AutoDetectCompany", "true"), out var adc) || adc;
                    _cachedSettings.LastSelectedCompanyName = GetValue(dbSettings, "LastSelectedCompanyName", string.Empty);
                    _cachedSettings.LastSelectedCompanyGuid = GetValue(dbSettings, "LastSelectedCompanyGuid", string.Empty);
                }
            }
            catch
            {
                // Fallback to default in-memory settings if DB file is inaccessible
            }

            return _cachedSettings;
        }

        public async Task SaveSettingsAsync(AppSettings settings)
        {
            _cachedSettings = settings;
            try
            {
                using var db = new TallyDbContext();
                await db.Database.EnsureCreatedAsync();

                SetOrUpdate(db, "TallyHost", settings.TallyHost);
                SetOrUpdate(db, "TallyPort", settings.TallyPort.ToString());
                SetOrUpdate(db, "ConnectionTimeoutSeconds", settings.ConnectionTimeoutSeconds.ToString());
                SetOrUpdate(db, "PreviewRecordLimit", settings.PreviewRecordLimit.ToString());
                SetOrUpdate(db, "DefaultExportDirectory", settings.DefaultExportDirectory);
                SetOrUpdate(db, "LogLevel", settings.LogLevel);
                SetOrUpdate(db, "Theme", settings.Theme);
                SetOrUpdate(db, "AutoConnect", settings.AutoConnect.ToString());
                SetOrUpdate(db, "AutoDetectCompany", settings.AutoDetectCompany.ToString());
                SetOrUpdate(db, "LastSelectedCompanyName", settings.LastSelectedCompanyName ?? string.Empty);
                SetOrUpdate(db, "LastSelectedCompanyGuid", settings.LastSelectedCompanyGuid ?? string.Empty);

                await db.SaveChangesAsync();
            }
            catch
            {
                // Logging service can record failure if needed
            }
        }

        private static string GetValue(System.Collections.Generic.List<AppSettingEntity> list, string key, string defaultValue)
        {
            var item = list.FirstOrDefault(x => x.Key == key);
            return item != null ? item.Value : defaultValue;
        }

        private static void SetOrUpdate(TallyDbContext db, string key, string value)
        {
            var existing = db.Settings.FirstOrDefault(x => x.Key == key);
            if (existing != null)
            {
                existing.Value = value;
            }
            else
            {
                db.Settings.Add(new AppSettingEntity { Key = key, Value = value });
            }
        }
    }
}
