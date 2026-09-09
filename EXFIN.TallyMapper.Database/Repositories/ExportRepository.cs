using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Data;
using EXFIN.TallyMapper.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace EXFIN.TallyMapper.Database.Repositories
{
    public class ExportProfileRepository : IExportProfileRepository
    {
        private readonly DbContextOptions<TallyDbContext> _dbOptions;

        public ExportProfileRepository(DbContextOptions<TallyDbContext> dbOptions)
        {
            _dbOptions = dbOptions;
        }

        public async Task<List<ExportProfile>> GetAllProfilesAsync()
        {
            using var db = new TallyDbContext(_dbOptions);
            var entities = await db.ExportProfiles.OrderByDescending(p => p.UpdatedAt).ToListAsync();
            return entities.Select(MapToModel).ToList();
        }

        public async Task<ExportProfile?> GetProfileByIdAsync(string id)
        {
            using var db = new TallyDbContext(_dbOptions);
            var entity = await db.ExportProfiles.FirstOrDefaultAsync(p => p.Id == id);
            return entity != null ? MapToModel(entity) : null;
        }

        public async Task<ExportProfile> SaveProfileAsync(ExportProfile profile)
        {
            using var db = new TallyDbContext(_dbOptions);
            var entity = await db.ExportProfiles.FirstOrDefaultAsync(p => p.Id == profile.Id);
            if (entity == null)
            {
                entity = new ExportProfileEntity { Id = profile.Id };
                db.ExportProfiles.Add(entity);
            }

            entity.Name = profile.Name;
            entity.MappingId = profile.MappingId;
            entity.MappingName = profile.MappingName;
            entity.CompanyId = profile.CompanyId;
            entity.Format = profile.Format.ToString();
            entity.DestinationPath = profile.DestinationPath;
            entity.OptionsJson = JsonSerializer.Serialize(profile.Options);
            entity.CreatedAt = profile.CreatedAt;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.IsEnabled = profile.IsEnabled;
            entity.LastExportAt = profile.LastExportAt;
            entity.LastStatus = profile.LastStatus?.ToString();
            entity.MappingVersion = profile.MappingVersion;

            await db.SaveChangesAsync();
            return MapToModel(entity);
        }

        public async Task<bool> DeleteProfileAsync(string id)
        {
            using var db = new TallyDbContext(_dbOptions);
            var entity = await db.ExportProfiles.FirstOrDefaultAsync(p => p.Id == id);
            if (entity == null) return false;

            db.ExportProfiles.Remove(entity);
            await db.SaveChangesAsync();
            return true;
        }

        private static ExportProfile MapToModel(ExportProfileEntity entity)
        {
            ExportOptions options = new ExportOptions();
            try
            {
                if (!string.IsNullOrWhiteSpace(entity.OptionsJson))
                {
                    options = JsonSerializer.Deserialize<ExportOptions>(entity.OptionsJson) ?? new ExportOptions();
                }
            }
            catch { }

            Enum.TryParse<ExportFormat>(entity.Format, true, out var fmt);
            ExportJobStatus? status = null;
            if (!string.IsNullOrEmpty(entity.LastStatus) && Enum.TryParse<ExportJobStatus>(entity.LastStatus, true, out var st))
            {
                status = st;
            }

            return new ExportProfile
            {
                Id = entity.Id,
                Name = entity.Name,
                MappingId = entity.MappingId,
                MappingName = entity.MappingName,
                CompanyId = entity.CompanyId,
                Format = fmt,
                DestinationPath = entity.DestinationPath,
                Options = options,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                IsEnabled = entity.IsEnabled,
                LastExportAt = entity.LastExportAt,
                LastStatus = status,
                MappingVersion = entity.MappingVersion
            };
        }
    }

    public class ExportHistoryRepository : IExportHistoryRepository
    {
        private readonly DbContextOptions<TallyDbContext> _dbOptions;

        public ExportHistoryRepository(DbContextOptions<TallyDbContext> dbOptions)
        {
            _dbOptions = dbOptions;
        }

        public async Task<List<ExportHistory>> GetHistoryAsync(int limit = 100)
        {
            using var db = new TallyDbContext(_dbOptions);
            var entities = await db.ExportHistory.OrderByDescending(h => h.ExportedAt).Take(limit).ToListAsync();
            return entities.Select(MapToModel).ToList();
        }

        public async Task LogExportAsync(ExportHistory history)
        {
            using var db = new TallyDbContext(_dbOptions);
            var entity = new ExportHistoryEntity
            {
                Id = history.Id,
                ProfileId = history.ProfileId,
                MappingId = history.MappingId,
                MappingName = history.MappingName,
                CompanyId = history.CompanyId,
                CompanyName = history.CompanyName,
                StartedAt = history.StartedAt,
                CompletedAt = history.CompletedAt,
                ExportedAt = history.CompletedAt,
                Status = history.Status.ToString(),
                OutputFormat = history.Format.ToString(),
                FilePath = history.DestinationPath,
                RecordsRead = history.RecordsRead,
                RecordsWritten = history.RecordsWritten,
                RecordCount = history.RecordsWritten,
                ErrorCount = history.ErrorCount,
                WarningCount = history.WarningCount,
                FileSize = history.FileSize,
                FileHash = history.FileHash,
                DurationSeconds = (double)history.DurationMs / 1000.0,
                DurationMs = history.DurationMs,
                ErrorMessage = history.ErrorMessage
            };

            db.ExportHistory.Add(entity);
            await db.SaveChangesAsync();
        }

        public async Task<bool> ClearHistoryAsync()
        {
            using var db = new TallyDbContext(_dbOptions);
            db.ExportHistory.RemoveRange(db.ExportHistory);
            await db.SaveChangesAsync();
            return true;
        }

        private static ExportHistory MapToModel(ExportHistoryEntity entity)
        {
            Enum.TryParse<ExportFormat>(entity.OutputFormat, true, out var fmt);
            Enum.TryParse<ExportJobStatus>(entity.Status, true, out var status);

            return new ExportHistory
            {
                Id = entity.Id,
                ProfileId = entity.ProfileId,
                MappingId = entity.MappingId,
                MappingName = entity.MappingName,
                CompanyId = entity.CompanyId,
                CompanyName = entity.CompanyName,
                StartedAt = entity.StartedAt,
                CompletedAt = entity.CompletedAt,
                Status = status,
                Format = fmt,
                DestinationPath = entity.FilePath,
                RecordsRead = entity.RecordsRead,
                RecordsWritten = entity.RecordsWritten,
                ErrorCount = entity.ErrorCount,
                WarningCount = entity.WarningCount,
                FileSize = entity.FileSize,
                FileHash = entity.FileHash,
                DurationMs = entity.DurationMs > 0 ? entity.DurationMs : (long)(entity.DurationSeconds * 1000.0),
                ErrorMessage = entity.ErrorMessage
            };
        }
    }
}
