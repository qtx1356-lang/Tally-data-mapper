using System;
using System.Net.Http;
using System.Windows;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Services;
using EXFIN.TallyMapper.Core.Utilities;
using EXFIN.TallyMapper.Database.Repositories;
using EXFIN.TallyMapper.Tally.Http;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Parsers;
using EXFIN.TallyMapper.Tally.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EXFIN.TallyMapper.App
{
    public partial class App : Application
    {
        public static IServiceProvider ServiceProvider { get; private set; } = null!;

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            PathUtils.EnsureDirectoriesExist();

            var serviceCollection = new ServiceCollection();
            ConfigureServices(serviceCollection);

            ServiceProvider = serviceCollection.BuildServiceProvider();
        }

        private void ConfigureServices(IServiceCollection services)
        {
            services.AddLogging(configure =>
            {
                configure.AddConsole();
                configure.SetMinimumLevel(LogLevel.Information);
            });

            services.AddSingleton<HttpClient>();
            services.AddSingleton<ILoggingService, FileLoggingService>();
            services.AddSingleton<IAppSettingsService, AppSettingsRepository>();
            services.AddSingleton<ITallyResponseParser, TallyXmlResponseParser>();
            services.AddSingleton<ITallyConnector, TallyHttpConnector>();
            services.AddSingleton<ITallyConnectionService, TallyConnectionService>();
            services.AddSingleton<ITallyCompanyService, TallyCompanyService>();
            services.AddSingleton<ITallyHealthService, TallyHealthService>();

            // Phase 3 Services
            services.AddSingleton<IDiscoveryRepository, DiscoveryRepository>();
            services.AddSingleton<ITallyOdbcConnector, TallyOdbcConnector>();
            services.AddSingleton<IOdbcSchemaDiscoveryService, OdbcSchemaDiscoveryService>();
            services.AddSingleton<IDataExplorerService, DataExplorerService>();
            services.AddSingleton<IFieldInspectorService, FieldInspectorService>();

            // Phase 4 Unified Discovery Services
            services.AddSingleton<IEntityRecognitionService, EntityRecognitionService>();
            services.AddSingleton<IFieldPathService, FieldPathService>();
            services.AddSingleton<IMetadataDiffService, MetadataDiffService>();
            services.AddSingleton<IQueryPlanner, QueryPlanner>();
            services.AddSingleton<IUnifiedQueryExecutor, UnifiedQueryExecutor>();
            services.AddSingleton<IUnifiedDiscoveryService, UnifiedDiscoveryService>();

            // Phase 5 Output Mapping Engine Services
            services.AddSingleton<IMappingRepository, MappingRepository>();
            services.AddSingleton<MappingEngine>();
            services.AddSingleton<IMappingEngine>(sp => sp.GetRequiredService<MappingEngine>());
            services.AddSingleton<IExportDataProvider>(sp => sp.GetRequiredService<MappingEngine>());

        }
    }
}
