using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Database.Repositories;
using EXFIN.TallyMapper.Tally.Interfaces;

namespace EXFIN.TallyMapper.Tally.Services
{
    public class DataExplorerService : IDataExplorerService
    {
        private readonly ITallyOdbcConnector _odbcConnector;
        private readonly IDiscoveryRepository _discoveryRepository;
        private static readonly Dictionary<string, List<string>> _recentCollectionsPerCompany = new Dictionary<string, List<string>>();

        public DataExplorerService(ITallyOdbcConnector odbcConnector, IDiscoveryRepository discoveryRepository)
        {
            _odbcConnector = odbcConnector;
            _discoveryRepository = discoveryRepository;
        }

        public async Task<QueryResult> GetCollectionSampleAsync(string companyId, string collectionName, int limit = 100, string searchTerm = "")
        {
            await RecordRecentCollectionAsync(companyId, collectionName);

            return await _odbcConnector.ExecuteQueryAsync(new QueryDefinition
            {
                CollectionName = collectionName,
                Limit = Math.Min(limit, 500),
                SearchTerm = searchTerm
            });
        }

        public async Task ToggleFavoriteAsync(string companyId, string collectionName)
        {
            await _discoveryRepository.ToggleFavoriteAsync(companyId, collectionName);
        }

        public async Task<List<string>> GetFavoritesAsync(string companyId)
        {
            return await _discoveryRepository.GetFavoritesAsync(companyId);
        }

        public Task<List<string>> GetRecentCollectionsAsync(string companyId)
        {
            if (_recentCollectionsPerCompany.TryGetValue(companyId, out var recents))
            {
                return Task.FromResult(recents.ToList());
            }
            return Task.FromResult(new List<string>());
        }

        public Task RecordRecentCollectionAsync(string companyId, string collectionName)
        {
            if (string.IsNullOrWhiteSpace(companyId) || string.IsNullOrWhiteSpace(collectionName))
                return Task.CompletedTask;

            if (!_recentCollectionsPerCompany.ContainsKey(companyId))
            {
                _recentCollectionsPerCompany[companyId] = new List<string>();
            }

            var list = _recentCollectionsPerCompany[companyId];
            list.Remove(collectionName);
            list.Insert(0, collectionName);

            if (list.Count > 10)
            {
                list.RemoveAt(list.Count - 1);
            }

            return Task.CompletedTask;
        }
    }

    public class FieldInspectorService : IFieldInspectorService
    {
        private readonly IDataExplorerService _dataExplorerService;

        public FieldInspectorService(IDataExplorerService dataExplorerService)
        {
            _dataExplorerService = dataExplorerService;
        }

        public async Task<List<string>> GetSampleValuesAsync(string companyId, string collectionName, string fieldName, int maxSamples = 5)
        {
            var queryResult = await _dataExplorerService.GetCollectionSampleAsync(companyId, collectionName, 50);
            var samples = new List<string>();

            foreach (var row in queryResult.Rows)
            {
                if (row.TryGetValue(fieldName, out var val))
                {
                    string formatted = val == null ? "NULL" : val.ToString()!;
                    if (!samples.Contains(formatted))
                    {
                        samples.Add(formatted);
                    }
                }
                if (samples.Count >= maxSamples) break;
            }

            if (!samples.Any())
            {
                samples.Add("No sample value available.");
            }

            return samples;
        }
    }
}
