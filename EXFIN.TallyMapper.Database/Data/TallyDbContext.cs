using EXFIN.TallyMapper.Core.Utilities;
using EXFIN.TallyMapper.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace EXFIN.TallyMapper.Database.Data
{
    public class TallyDbContext : DbContext
    {
        public DbSet<AppSettingEntity> Settings { get; set; } = null!;
        public DbSet<MappingEntity> Mappings { get; set; } = null!;
        public DbSet<ExportHistoryEntity> ExportHistory { get; set; } = null!;
        public DbSet<ExportProfileEntity> ExportProfiles { get; set; } = null!;
        public DbSet<DiscoveryScanEntity> DiscoveryScans { get; set; } = null!;
        public DbSet<DiscoveryCollectionEntity> DiscoveryCollections { get; set; } = null!;
        public DbSet<DiscoveryFieldEntity> DiscoveryFields { get; set; } = null!;
        public DbSet<DiscoveryRelationshipEntity> DiscoveryRelationships { get; set; } = null!;
        public DbSet<CanonicalFieldPathEntity> CanonicalFieldPaths { get; set; } = null!;
        public DbSet<TallyObjectEntity> TallyObjects { get; set; } = null!;
        public DbSet<FavoriteCollectionEntity> FavoriteCollections { get; set; } = null!;
        public DbSet<FavoriteFieldPathEntity> FavoriteFieldPaths { get; set; } = null!;

        public TallyDbContext()
        {
        }

        public TallyDbContext(DbContextOptions<TallyDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                PathUtils.EnsureDirectoriesExist();
                optionsBuilder.UseSqlite($"Data Source={PathUtils.DatabasePath}");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AppSettingEntity>().HasData(
                new AppSettingEntity { Key = "TallyHost", Value = "localhost" },
                new AppSettingEntity { Key = "TallyPort", Value = "9000" },
                new AppSettingEntity { Key = "ConnectionTimeoutSeconds", Value = "10" },
                new AppSettingEntity { Key = "PreviewRecordLimit", Value = "100" },
                new AppSettingEntity { Key = "DefaultExportDirectory", Value = PathUtils.AppDataFolder },
                new AppSettingEntity { Key = "LogLevel", Value = "Information" },
                new AppSettingEntity { Key = "Theme", Value = "Dark" },
                new AppSettingEntity { Key = "AutoConnect", Value = "False" },
                new AppSettingEntity { Key = "AutoScan", Value = "False" }
            );
        }
    }
}
