using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Data;
using EXFIN.TallyMapper.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace EXFIN.TallyMapper.Database.Repositories
{
    public class MappingRepository : IMappingRepository
    {
        private static readonly JsonSerializerOptions JsonOpts = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = false
        };

        public async Task<OutputMapping> SaveMappingAsync(OutputMapping mapping, CancellationToken cancellationToken = default)
        {
            using var db = new TallyDbContext();
            mapping.UpdatedAt = DateTime.UtcNow;

            var json = JsonSerializer.Serialize(mapping, JsonOpts);
            var existing = await db.Mappings.FirstOrDefaultAsync(m => m.Id == mapping.Id, cancellationToken);

            if (existing == null)
            {
                existing = new MappingEntity
                {
                    Id = mapping.Id,
                    Name = mapping.Name,
                    Description = mapping.Description ?? string.Empty,
                    SourceCollection = mapping.SourceEntity,
                    CreatedAt = mapping.CreatedAt,
                    UpdatedAt = mapping.UpdatedAt,
                    Version = mapping.Version.ToString(),
                    JsonData = json
                };
                db.Mappings.Add(existing);
            }
            else
            {
                existing.Name = mapping.Name;
                existing.Description = mapping.Description ?? string.Empty;
                existing.SourceCollection = mapping.SourceEntity;
                existing.UpdatedAt = mapping.UpdatedAt;
                existing.Version = mapping.Version.ToString();
                existing.JsonData = json;
            }

            await db.SaveChangesAsync(cancellationToken);
            return mapping;
        }

        public async Task<OutputMapping?> GetMappingByIdAsync(string id, CancellationToken cancellationToken = default)
        {
            using var db = new TallyDbContext();
            var entity = await db.Mappings.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
            if (entity == null || string.IsNullOrWhiteSpace(entity.JsonData))
                return null;

            try
            {
                return JsonSerializer.Deserialize<OutputMapping>(entity.JsonData, JsonOpts);
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<OutputMapping>> GetAllMappingsAsync(string? companyId = null, string? searchTerm = null, CancellationToken cancellationToken = default)
        {
            using var db = new TallyDbContext();
            var entities = await db.Mappings.OrderByDescending(m => m.UpdatedAt).ToListAsync(cancellationToken);
            var result = new List<OutputMapping>();

            foreach (var entity in entities)
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(entity.JsonData)) continue;
                    var mapping = JsonSerializer.Deserialize<OutputMapping>(entity.JsonData, JsonOpts);
                    if (mapping == null) continue;

                    // Filter company if non-portable
                    if (!string.IsNullOrEmpty(companyId) && !mapping.Configuration.IsPortableTemplate && mapping.CompanyId != companyId)
                    {
                        continue;
                    }

                    // Filter search term
                    if (!string.IsNullOrWhiteSpace(searchTerm))
                    {
                        var term = searchTerm.Trim().ToLowerInvariant();
                        var matchName = mapping.Name.ToLowerInvariant().Contains(term);
                        var matchSource = mapping.SourceEntity.ToLowerInvariant().Contains(term);
                        var matchDesc = mapping.Description?.ToLowerInvariant().Contains(term) ?? false;
                        var matchField = mapping.Fields.Any(f => f.OutputName.ToLowerInvariant().Contains(term) || f.SourcePath.ToLowerInvariant().Contains(term));

                        if (!matchName && !matchSource && !matchDesc && !matchField)
                        {
                            continue;
                        }
                    }

                    result.Add(mapping);
                }
                catch
                {
                    // Skip corrupt json entries gracefully
                }
            }

            return result;
        }

        public async Task<bool> DeleteMappingAsync(string id, CancellationToken cancellationToken = default)
        {
            using var db = new TallyDbContext();
            var entity = await db.Mappings.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
            if (entity == null) return false;

            db.Mappings.Remove(entity);
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
